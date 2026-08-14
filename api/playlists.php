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

// 1. GET /api/playlists.php (Listar playlists)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && empty($action)) {
    try {
        $stmt = $db->query("SELECT * FROM playlists ORDER BY id DESC");
        echo json_encode($stmt->fetchAll());
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 2. GET /api/playlists.php?action=get&id=X (Detalhes e itens da playlist)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(["error" => "id é obrigatório"]);
        exit;
    }

    try {
        $stmt = $db->prepare("SELECT * FROM playlists WHERE id = ?");
        $stmt->execute([$id]);
        $playlist = $stmt->fetch();

        if (!$playlist) {
            http_response_code(404);
            echo json_encode(["error" => "Playlist não encontrada"]);
            exit;
        }

        $stmtItems = $db->prepare("
            SELECT pi.*, m.name, m.type, m.url, m.duration as default_duration
            FROM playlist_items pi
            JOIN media m ON pi.media_id = m.id
            WHERE pi.playlist_id = ?
            ORDER BY pi.position ASC
        ");
        $stmtItems->execute([$id]);
        $items = $stmtItems->fetchAll();

        $playlist['items'] = $items;
        echo json_encode($playlist);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 3. POST /api/playlists.php?action=create (Criar playlist)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'create') {
    $data = json_decode(file_get_contents("php://input"), true);
    $name = isset($data['name']) ? trim($data['name']) : '';

    if (empty($name)) {
        http_response_code(400);
        echo json_encode(["error" => "name é obrigatório"]);
        exit;
    }

    try {
        $stmt = $db->prepare("INSERT INTO playlists (name) VALUES (?)");
        $stmt->execute([$name]);
        $id = $db->lastInsertId();

        echo json_encode([
            "id" => intval($id),
            "name" => $name,
            "items" => []
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 4. POST /api/playlists.php?action=save-items&id=X (Salvar/Reordenar itens na playlist)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'save-items') {
    $playlistId = isset($_GET['id']) ? intval($_GET['id']) : 0;
    $data = json_decode(file_get_contents("php://input"), true);
    $items = isset($data['items']) ? $data['items'] : null;

    if (empty($playlistId) || !is_array($items)) {
        http_response_code(400);
        echo json_encode(["error" => "id da playlist e items (array) são obrigatórios"]);
        exit;
    }

    try {
        $db->beginTransaction();

        // Remover os itens existentes
        $stmtDel = $db->prepare("DELETE FROM playlist_items WHERE playlist_id = ?");
        $stmtDel->execute([$playlistId]);

        // Inserir os itens reordenados
        $stmtIns = $db->prepare("
            INSERT INTO playlist_items (playlist_id, media_id, position, duration) 
            VALUES (?, ?, ?, ?)
        ");
        
        foreach ($items as $index => $item) {
            $mediaId = isset($item['mediaId']) ? intval($item['mediaId']) : 0;
            $duration = isset($item['duration']) ? intval($item['duration']) : null;
            $stmtIns->execute([$playlistId, $mediaId, $index, $duration]);
        }

        $db->commit();
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 5. POST /api/playlists.php?action=delete (Deletar playlist)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'delete') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(["error" => "id é obrigatório"]);
        exit;
    }

    try {
        $stmt = $db->prepare("DELETE FROM playlists WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}
