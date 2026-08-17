<?php
// Conexão e inicialização do Banco de Dados SQLite em PHP (PDO) com Suporte a Usuários e Assinaturas (SaaS Multi-tenant)

function getDatabase() {
    $dbPath = __DIR__ . '/tvcorp.db';
    
    try {
        $db = new PDO("sqlite:" . $dbPath);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        
        // Habilitar chaves estrangeiras no SQLite
        $db->exec('PRAGMA foreign_keys = ON;');
        
        // 1. Tabela de Usuários (Clientes SaaS)
        $db->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                company TEXT,
                created_at TEXT NOT NULL
            );
        ");

        // 2. Tabela de Assinaturas e Planos Mercado Pago
        $db->exec("
            CREATE TABLE IF NOT EXISTS subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                plan_name TEXT NOT NULL DEFAULT 'Trial 7 Dias',
                screen_limit INTEGER NOT NULL DEFAULT 1,
                status TEXT CHECK(status IN ('active', 'pending', 'expired')) NOT NULL DEFAULT 'active',
                mp_payment_id TEXT,
                expires_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        ");

        // 3. Tabela de Playlists
        $db->exec("
            CREATE TABLE IF NOT EXISTS playlists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                name TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        ");

        // 4. Tabela de Mídias
        $db->exec("
            CREATE TABLE IF NOT EXISTS media (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                name TEXT NOT NULL,
                type TEXT CHECK(type IN ('image', 'video', 'website')) NOT NULL,
                url TEXT NOT NULL,
                duration INTEGER NOT NULL DEFAULT 10,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        ");

        // 5. Tabela de Itens da Playlist
        $db->exec("
            CREATE TABLE IF NOT EXISTS playlist_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                playlist_id INTEGER NOT NULL,
                media_id INTEGER NOT NULL,
                position INTEGER NOT NULL,
                duration INTEGER,
                FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
                FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
            );
        ");

        // 6. Tabela de Telas (TVs)
        $db->exec("
            CREATE TABLE IF NOT EXISTS screens (
                id TEXT PRIMARY KEY,
                user_id INTEGER,
                name TEXT NOT NULL,
                status TEXT CHECK(status IN ('online', 'offline')) NOT NULL DEFAULT 'offline',
                pair_code TEXT UNIQUE,
                paired_at TEXT,
                playlist_id INTEGER,
                last_heartbeat TEXT,
                screenshot_url TEXT,
                pending_command TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE SET NULL
            );
        ");
        
        // Criar usuário padrão de demonstração / admin se não existir nenhum
        $stmtUser = $db->query('SELECT COUNT(*) as count FROM users');
        $userRow = $stmtUser->fetch();
        if ($userRow['count'] == 0) {
            $now = date('Y-m-d H:i:s');
            $passHash = password_hash('admin123', PASSWORD_BCRYPT);
            
            $stmtInsUser = $db->prepare('INSERT INTO users (name, email, password_hash, company, created_at) VALUES (?, ?, ?, ?, ?)');
            $stmtInsUser->execute(['Administrador TvCorp', 'admin@tvcorp.com', $passHash, 'TvCorp Inc', $now]);
            $adminUserId = $db->lastInsertId();

            // Ativar plano ilimitado para a conta admin padrão
            $expires = date('Y-m-d H:i:s', strtotime('+10 years'));
            $stmtInsSub = $db->prepare('INSERT INTO subscriptions (user_id, plan_name, screen_limit, status, expires_at) VALUES (?, ?, ?, ?, ?)');
            $stmtInsSub->execute([$adminUserId, 'Plano Enterprise Admin', 100, 'active', $expires]);

            // Vincular mídias e playlists existentes ao admin
            $db->exec("UPDATE media SET user_id = $adminUserId WHERE user_id IS NULL");
            $db->exec("UPDATE playlists SET user_id = $adminUserId WHERE user_id IS NULL");
            $db->exec("UPDATE screens SET user_id = $adminUserId WHERE user_id IS NULL");
        }

        // Semear mídias iniciais se biblioteca estiver vazia
        $stmtMedia = $db->query('SELECT COUNT(*) as count FROM media');
        $mediaRow = $stmtMedia->fetch();
        if ($mediaRow['count'] == 0) {
            $adminUserId = 1;
            $stmtInsert = $db->prepare('INSERT INTO media (user_id, name, type, url, duration) VALUES (?, ?, ?, ?, ?)');
            $stmtInsert->execute([$adminUserId, 'Bem-vindo à TvCorp', 'image', 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=640&auto=format&fit=crop', 8]);
            $stmtInsert->execute([$adminUserId, 'Indicadores de Performance', 'image', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=640&auto=format&fit=crop', 8]);
            $stmtInsert->execute([$adminUserId, 'Website Corporativo', 'website', 'https://www.wikipedia.org', 12]);
            
            $stmtPl = $db->prepare("INSERT INTO playlists (user_id, name) VALUES (?, 'Programação Geral')");
            $stmtPl->execute([$adminUserId]);
            $playlistId = $db->lastInsertId();
            
            $medias = $db->query('SELECT id FROM media')->fetchAll();
            $stmtItem = $db->prepare('INSERT INTO playlist_items (playlist_id, media_id, position, duration) VALUES (?, ?, ?, ?)');
            foreach ($medias as $index => $m) {
                $stmtItem->execute([$playlistId, $m['id'], $index, null]);
            }
        }
        
        return $db;
    } catch (PDOException $e) {
        header("HTTP/1.1 500 Internal Server Error");
        echo json_encode(["error" => "Falha na conexão com o banco de dados: " . $e->getMessage()]);
        exit;
    }
}
