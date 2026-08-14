<?php
// Conexão e inicialização do Banco de Dados SQLite em PHP (PDO)

function getDatabase() {
    $dbPath = __DIR__ . '/tvcorp.db';
    
    try {
        $db = new PDO("sqlite:" . $dbPath);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        
        // Habilitar chaves estrangeiras no SQLite
        $db->exec('PRAGMA foreign_keys = ON;');
        
        // Inicializar Tabelas
        $db->exec("
            CREATE TABLE IF NOT EXISTS playlists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS media (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT CHECK(type IN ('image', 'video', 'website')) NOT NULL,
                url TEXT NOT NULL,
                duration INTEGER NOT NULL DEFAULT 10
            );

            CREATE TABLE IF NOT EXISTS playlist_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                playlist_id INTEGER NOT NULL,
                media_id INTEGER NOT NULL,
                position INTEGER NOT NULL,
                duration INTEGER,
                FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
                FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS screens (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                status TEXT CHECK(status IN ('online', 'offline')) NOT NULL DEFAULT 'offline',
                pair_code TEXT UNIQUE,
                paired_at TEXT,
                playlist_id INTEGER,
                last_heartbeat TEXT,
                screenshot_url TEXT,
                pending_command TEXT,
                FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE SET NULL
            );
        ");
        
        // Semear dados iniciais de demonstração (seed)
        $stmt = $db->query('SELECT COUNT(*) as count FROM media');
        $row = $stmt->fetch();
        if ($row['count'] == 0) {
            // Inserir mídias iniciais
            $stmtInsert = $db->prepare('INSERT INTO media (name, type, url, duration) VALUES (?, ?, ?, ?)');
            $stmtInsert->execute(['Bem-vindo à TvCorp', 'image', 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=640&auto=format&fit=crop', 8]);
            $stmtInsert->execute(['Indicadores de Performance', 'image', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=640&auto=format&fit=crop', 8]);
            $stmtInsert->execute(['Website Corporativo', 'website', 'https://www.wikipedia.org', 12]);
            
            // Criar playlist padrão
            $db->exec("INSERT INTO playlists (name) VALUES ('Programação Geral')");
            $playlistId = $db->lastInsertId();
            
            // Associar as mídias à playlist
            $medias = $db->query('SELECT id FROM media')->fetchAll();
            $stmtItem = $db->prepare('INSERT INTO playlist_items (playlist_id, media_id, position, duration) VALUES (?, ?, ?, ?)');
            
            foreach ($medias as $index => $media) {
                $stmtItem->execute([$playlistId, $media['id'], $index, null]);
            }
        }
        
        return $db;
    } catch (PDOException $e) {
        header("HTTP/1.1 500 Internal Server Error");
        echo json_encode(["error" => "Falha na conexão com o banco de dados: " . $e->getMessage()]);
        exit;
    }
}
