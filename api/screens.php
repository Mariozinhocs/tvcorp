<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/db.php';
$db = getDatabase();

// Rotina rápida de inatividade: marcar telas offline se inativas há mais de 18 segundos
try {
    $now = new DateTime();
    $stmt = $db->query("SELECT id, last_heartbeat FROM screens WHERE status = 'online'");
    $onlineScreens = $stmt->fetchAll();
    
    foreach ($onlineScreens as $screen) {
        if ($screen['last_heartbeat']) {
            $lastHb = new DateTime($screen['last_heartbeat']);
            $interval = $now->getTimestamp() - $lastHb->getTimestamp();
            if ($interval > 18) {
                $db->prepare("UPDATE screens SET status = 'offline' WHERE id = ?")->execute([$screen['id']]);
            }
        }
    }
} catch (Exception $e) {
    // Silencia erros da rotina secundária
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

// 1. GET /api/screens.php (Listar telas - Admin)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && empty($action)) {
    try {
        $stmt = $db->query("
            SELECT s.*, p.name as playlist_name 
            FROM screens s 
            LEFT JOIN playlists p ON s.playlist_id = p.id
        ");
        echo json_encode($stmt->fetchAll());
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 2. GET /api/screens.php?action=get-playlist&screenId=X (Obter Playlist do Player)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get-playlist') {
    $screenId = isset($_GET['screenId']) ? $_GET['screenId'] : '';
    if (empty($screenId)) {
        http_response_code(400);
        echo json_encode(["error" => "screenId é obrigatório"]);
        exit;
    }

    try {
        $stmtScreen = $db->prepare("SELECT playlist_id FROM screens WHERE id = ?");
        $stmtScreen->execute([$screenId]);
        $screen = $stmtScreen->fetch();

        if (!$screen || !$screen['playlist_id']) {
            echo json_encode(["playlist" => null, "items" => []]);
            exit;
        }

        $playlistId = $screen['playlist_id'];
        
        $stmtPl = $db->prepare("SELECT * FROM playlists WHERE id = ?");
        $stmtPl->execute([$playlistId]);
        $playlist = $stmtPl->fetch();

        $stmtItems = $db->prepare("
            SELECT pi.*, m.name, m.type, m.url, COALESCE(pi.duration, m.duration) as active_duration
            FROM playlist_items pi
            JOIN media m ON pi.media_id = m.id
            WHERE pi.playlist_id = ?
            ORDER BY pi.position ASC
        ");
        $stmtItems->execute([$playlistId]);
        $items = $stmtItems->fetchAll();

        echo json_encode(["playlist" => $playlist, "items" => $items]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 3. POST /api/screens.php?action=register-code (Registrar Código do Player)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'register-code') {
    $data = json_decode(file_get_contents("php://input"), true);
    $screenId = isset($data['screenId']) ? $data['screenId'] : '';

    if (empty($screenId)) {
        http_response_code(400);
        echo json_encode(["error" => "screenId é obrigatório"]);
        exit;
    }

    // Função interna para gerar código de pareamento único de 6 caracteres
    function generatePairCode($db) {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        while (true) {
            $code = '';
            for ($i = 0; $i < 6; $i++) {
                $code .= $chars[rand(0, strlen($chars) - 1)];
            }
            // Verificar se é único
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM screens WHERE pair_code = ?");
            $stmt->execute([$code]);
            $row = $stmt->fetch();
            if ($row['count'] == 0) {
                return $code;
            }
        }
    }

    try {
        $stmt = $db->prepare("SELECT * FROM screens WHERE id = ?");
        $stmt->execute([$screenId]);
        $existing = $stmt->fetch();

        $now = date('Y-m-d H:i:s');

        if ($existing) {
            if ($existing['paired_at']) {
                echo json_encode(["paired" => true, "screen" => $existing]);
                exit;
            }
            $pairCode = $existing['pair_code'] ? $existing['pair_code'] : generatePairCode($db);
            $stmtUpdate = $db->prepare("UPDATE screens SET pair_code = ?, status = 'online', last_heartbeat = ? WHERE id = ?");
            $stmtUpdate->execute([$pairCode, $now, $screenId]);
        } else {
            $pairCode = generatePairCode($db);
            $stmtInsert = $db->prepare("INSERT INTO screens (id, name, status, pair_code, last_heartbeat) VALUES (?, ?, ?, ?, ?)");
            $stmtInsert->execute([$screenId, 'Tela não pareada', 'online', $pairCode, $now]);
        }

        echo json_encode(["paired" => false, "pairCode" => $pairCode]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 4. POST /api/screens.php?action=pair (Parear Tela do Admin)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'pair') {
    $data = json_decode(file_get_contents("php://input"), true);
    $pairCode = isset($data['pairCode']) ? trim(strtoupper($data['pairCode'])) : '';
    $name = isset($data['name']) ? trim($data['name']) : '';
    $playlistId = isset($data['playlistId']) ? $data['playlistId'] : null;

    if (empty($pairCode) || empty($name)) {
        http_response_code(400);
        echo json_encode(["error" => "pairCode e name são obrigatórios"]);
        exit;
    }

    try {
        $stmt = $db->prepare("SELECT * FROM screens WHERE pair_code = ?");
        $stmt->execute([$pairCode]);
        $screen = $stmt->fetch();

        if (!$screen) {
            http_response_code(404);
            echo json_encode(["error" => "Código de pareamento inválido ou expirado"]);
            exit;
        }

        if ($screen['paired_at']) {
            http_response_code(400);
            echo json_encode(["error" => "Esta tela já está pareada"]);
            exit;
        }

        $now = date('Y-m-d H:i:s');
        $stmtUpdate = $db->prepare("
            UPDATE screens 
            SET name = ?, paired_at = ?, playlist_id = ?, pair_code = NULL 
            WHERE id = ?
        ");
        $stmtUpdate->execute([$name, $now, $playlistId, $screen['id']]);

        echo json_encode(["success" => true, "screenId" => $screen['id']]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 5. POST /api/screens.php?action=poll (Polling contínuo do Player)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'poll') {
    $screenId = isset($_GET['screenId']) ? $_GET['screenId'] : '';
    if (empty($screenId)) {
        http_response_code(400);
        echo json_encode(["error" => "screenId é obrigatório"]);
        exit;
    }

    try {
        $stmt = $db->prepare("SELECT * FROM screens WHERE id = ?");
        $stmt->execute([$screenId]);
        $screen = $stmt->fetch();

        if (!$screen) {
            // Se foi deletada da API, força o despareamento no player
            echo json_encode(["unpaired" => true]);
            exit;
        }

        $now = date('Y-m-d H:i:s');
        // Atualizar batimento cardíaco da tela
        $db->prepare("UPDATE screens SET status = 'online', last_heartbeat = ? WHERE id = ?")->execute([$now, $screenId]);

        // Se despareou no admin (ou seja, foi limpo o paired_at)
        if (!$screen['paired_at']) {
            echo json_encode(["unpaired" => true, "pairCode" => $screen['pair_code']]);
            exit;
        }

        echo json_encode([
            "paired" => true,
            "playlistId" => $screen['playlist_id'] ? intval($screen['playlist_id']) : null,
            "pendingCommand" => $screen['pending_command']
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 6. POST /api/screens.php?action=clear-command (Limpar Comando executado pelo Player)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'clear-command') {
    $screenId = isset($_GET['screenId']) ? $_GET['screenId'] : '';
    if (empty($screenId)) {
        http_response_code(400);
        echo json_encode(["error" => "screenId é obrigatório"]);
        exit;
    }

    try {
        $db->prepare("UPDATE screens SET pending_command = NULL WHERE id = ?")->execute([$screenId]);
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 7. POST /api/screens.php?action=send-command (Enviar Comando do Admin)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'send-command') {
    $data = json_decode(file_get_contents("php://input"), true);
    $screenId = isset($data['screenId']) ? $data['screenId'] : '';
    $command = isset($data['command']) ? $data['command'] : '';

    if (empty($screenId) || empty($command)) {
        http_response_code(400);
        echo json_encode(["error" => "screenId e command são obrigatórios"]);
        exit;
    }

    try {
        $stmt = $db->prepare("UPDATE screens SET pending_command = ? WHERE id = ?");
        $stmt->execute([$command, $screenId]);
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 8. POST /api/screens.php?action=update-playlist (Associar Playlist à Tela)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update-playlist') {
    $data = json_decode(file_get_contents("php://input"), true);
    $screenId = isset($data['screenId']) ? $data['screenId'] : '';
    $playlistId = isset($data['playlistId']) ? $data['playlistId'] : null;

    if (empty($screenId)) {
        http_response_code(400);
        echo json_encode(["error" => "screenId é obrigatório"]);
        exit;
    }

    try {
        $stmt = $db->prepare("UPDATE screens SET playlist_id = ? WHERE id = ?");
        $stmt->execute([$playlistId, $screenId]);
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 9. POST /api/screens.php?action=upload-screenshot (Upload de print do Player)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'upload-screenshot') {
    $data = json_decode(file_get_contents("php://input"), true);
    $screenId = isset($data['screenId']) ? $data['screenId'] : '';
    $base64 = isset($data['base64']) ? $data['base64'] : '';

    if (empty($screenId) || empty($base64)) {
        http_response_code(400);
        echo json_encode(["error" => "screenId e base64 são obrigatórios"]);
        exit;
    }

    try {
        $stmt = $db->prepare("UPDATE screens SET screenshot_url = ? WHERE id = ?");
        $stmt->execute([$base64, $screenId]);
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 10. POST /api/screens.php?action=delete (Deletar/Desparear Tela do Admin)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'delete') {
    $screenId = isset($_GET['id']) ? $_GET['id'] : '';
    if (empty($screenId)) {
        http_response_code(400);
        echo json_encode(["error" => "id é obrigatório"]);
        exit;
    }

    try {
        // Para manter o player e o banco de dados limpos, nós apenas excluímos a linha no SQLite
        $stmt = $db->prepare("DELETE FROM screens WHERE id = ?");
        $stmt->execute([$screenId]);
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}
