<?php
/**
 * TvCorp — Instalador e Migrador do Banco de Dados
 */
header("Content-Type: text/html; charset=UTF-8");

$dbFile = __DIR__ . '/api/tvcorp.db';
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
            username VARCHAR(100) NULL,
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

        CREATE TABLE IF NOT EXISTS home_ads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            badge VARCHAR(100) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            tag_1 VARCHAR(100) NULL,
            tag_2 VARCHAR(100) NULL,
            show_qr INT DEFAULT 0,
            qr_code_text VARCHAR(255) NULL,
            slide_order INT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        $db->exec($sql);

        // Migração de coluna username para bancos SQLite já existentes
        try {
            $db->exec("ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL;");
        } catch (Exception $e) {}

        // Criar ou atualizar contas de administrador padrão (admin & mariozinhocs)
        $defaultAdmins = [
            [
                'name' => 'admin',
                'username' => 'admin',
                'email' => 'eu.anorak@gmail.com',
                'password' => 'admin2026',
                'company' => 'Anorak Technology'
            ],
            [
                'name' => 'mariozinhocs',
                'username' => 'mariozinhocs',
                'email' => 'mariozinhocs@gmail.com',
                'password' => 'admin2026',
                'company' => 'TvCorp / Anorak'
            ]
        ];

        foreach ($defaultAdmins as $adm) {
            $stmtUser = $db->prepare("SELECT id FROM users WHERE email = ? OR username = ?");
            $stmtUser->execute([$adm['email'], $adm['username']]);
            $existing = $stmtUser->fetch();

            if (!$existing) {
                $passHash = password_hash($adm['password'], PASSWORD_BCRYPT);
                $stmtInsert = $db->prepare("INSERT INTO users (name, username, email, password_hash, company, role) VALUES (?, ?, ?, ?, ?, 'admin')");
                $stmtInsert->execute([$adm['name'], $adm['username'], $adm['email'], $passHash, $adm['company']]);
                $uId = $db->lastInsertId();

                $stmtSub = $db->prepare("INSERT INTO subscriptions (user_id, plan_name, screen_limit, status, expires_at) VALUES (?, 'LEGEND (Permanente)', 100, 'active', '2099-12-31 23:59:59')");
                $stmtSub->execute([$uId]);
            }
        }

        // Se a tabela home_ads estiver vazia, popula com anúncios de exemplo padrão
        $stmtAds = $db->query("SELECT COUNT(*) as count FROM home_ads");
        if ($stmtAds->fetch()['count'] == 0) {
            $db->exec("INSERT INTO home_ads (badge, title, description, tag_1, tag_2, show_qr, qr_code_text, slide_order) VALUES
                ('📢 Endomarketing & Comunicação', 'Reunião Geral de Alinhamento & Metas 2026', 'Toda a equipe convidada para o auditório principal hoje às 16h. Apresentação dos resultados do trimestre e premiação Destaque do Mês.', '⏰ Hoje às 16:00', '📍 Auditório Central', 0, '', 1),
                ('📊 Indicadores de Desempenho (KPIs)', 'Metas da Operação em Tempo Real', 'Acompanhamento automático das metas de vendas do mês (R$ 485K), SLA de atendimento (99.4%) e satisfação dos clientes NPS (94 pts).', '▲ +18.4% vs meta', '★ SLA 99.4%', 0, '', 2),
                ('🛍️ Mídia Indoor & Ofertas', 'Oferta Relâmpago de Primavera', 'Aproveite até 30% de desconto em toda a linha de produtos corporativos selecionados para assinantes.', 'CÓDIGO: TVCORP30', 'Validez: 48h', 1, 'TVCORP30', 3)
            ");
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
