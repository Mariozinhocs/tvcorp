<?php
/**
 * TvCorp — Instalador e Migrador do Banco de Dados
 */
header("Content-Type: text/html; charset=UTF-8");

$dbFile = __DIR__ . '/api/tvcorp.sqlite';
$installed = false;
$msg = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $db = new PDO("sqlite:" . $dbFile);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Tabelas do TvCorp
        $sql = "
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(191) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            company VARCHAR(100) NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS screens (
            id VARCHAR(64) PRIMARY KEY,
            user_id INT NULL,
            name VARCHAR(100) NOT NULL,
            status VARCHAR(20) DEFAULT 'offline',
            pair_code VARCHAR(10) NULL,
            playlist_id INT NULL,
            screenshot_url TEXT NULL,
            last_heartbeat DATETIME NULL,
            paired_at DATETIME NULL
        );

        CREATE TABLE IF NOT EXISTS playlists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INT NULL,
            name VARCHAR(100) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS media (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INT NULL,
            name VARCHAR(100) NOT NULL,
            type VARCHAR(20) NOT NULL,
            url TEXT NOT NULL,
            duration INT DEFAULT 10,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS playlist_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            playlist_id INT NOT NULL,
            media_id INT NOT NULL,
            position INT DEFAULT 0,
            duration INT NULL
        );

        CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INT NOT NULL,
            plan_name VARCHAR(100) NOT NULL,
            screen_limit INT DEFAULT 1,
            status VARCHAR(50) DEFAULT 'active',
            mp_payment_id VARCHAR(100) NULL,
            expires_at DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        ";

        $db->exec($sql);

        // Se a tabela users estiver vazia, cria a conta admin padrão
        $stmt = $db->query("SELECT COUNT(*) as count FROM users");
        if ($stmt->fetch()['count'] == 0) {
            $passHash = password_hash('admin2026', PASSWORD_BCRYPT);
            $stmtInsert = $db->prepare("INSERT INTO users (name, email, password_hash, company, role) VALUES (?, ?, ?, ?, ?)");
            $stmtInsert->execute(['Administrador TvCorp', 'admin@tvcorp.com', $passHash, 'TvCorp Inc', 'admin']);
        }

        $installed = true;
        $msg = "🎉 Banco de dados do TvCorp instalado/migrado com sucesso!";

    } catch (Exception $e) {
        $msg = "❌ Erro ao instalar banco de dados: " . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>TvCorp — Instalador de Banco de Dados</title>
  <style>
    body { font-family: sans-serif; background: #070b14; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); padding: 2rem; border-radius: 16px; max-width: 480px; text-align: center; }
    .btn { background: #7b61ff; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; }
    .msg { margin-top: 1rem; padding: 12px; border-radius: 8px; font-size: 0.9rem; }
    .success { background: rgba(16,185,129,0.2); color: #10b981; }
    .error { background: rgba(244,63,94,0.2); color: #f43f5e; }
  </style>
</head>
<body>
  <div class="card">
    <h1>📺 Instalador TvCorp</h1>
    <p>Clique no botão abaixo para criar/atualizar as tabelas do banco de dados.</p>
    
    <form method="POST">
      <button type="submit" class="btn">Instalar / Migrar Banco de Dados 🚀</button>
    </form>

    <?php if ($msg): ?>
      <div class="msg <?php echo $installed ? 'success' : 'error'; ?>"><?php echo $msg; ?></div>
    <?php endif; ?>
  </div>
</body>
</html>
