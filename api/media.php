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

$action = isset($_GET['action']) ? $_GET['action'] : '';

// 1. GET /api/media.php (Listar Mídias)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && empty($action)) {
    try {
        $stmt = $db->query("SELECT * FROM media ORDER BY id DESC");
        echo json_encode($stmt->fetchAll());
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 2. POST /api/media.php?action=add (Adicionar Mídia)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'add') {
    $data = json_decode(file_get_contents("php://input"), true);
    $name = isset($data['name']) ? trim($data['name']) : '';
    $type = isset($data['type']) ? trim($data['type']) : '';
    $url = isset($data['url']) ? trim($data['url']) : '';
    $duration = isset($data['duration']) ? intval($data['duration']) : 10;

    if (empty($name) || empty($type) || empty($url)) {
        http_response_code(400);
        echo json_encode(["error" => "name, type e url são obrigatórios"]);
        exit;
    }

    try {
        $stmt = $db->prepare("INSERT INTO media (name, type, url, duration) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $type, $url, $duration]);
        $id = $db->lastInsertId();

        echo json_encode([
            "id" => intval($id),
            "name" => $name,
            "type" => $type,
            "url" => $url,
            "duration" => $duration
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 3. POST /api/media.php?action=delete (Deletar Mídia)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'delete') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(["error" => "id é obrigatório"]);
        exit;
    }

    try {
        $stmt = $db->prepare("DELETE FROM media WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}
