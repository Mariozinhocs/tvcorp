<?php
require_once __DIR__ . '/../config.php';
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método não permitido"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$loginInput = isset($data['email']) ? trim($data['email']) : (isset($data['login']) ? trim($data['login']) : '');
$password = isset($data['password']) ? trim($data['password']) : '';

if (empty($loginInput) || empty($password)) {
    http_response_code(400);
    echo json_encode(["error" => "E-mail/Usuário e senha são obrigatórios"]);
    exit;
}

$db = getDatabaseConnection();

try {
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1");
    $stmt->execute([strtolower($loginInput), $loginInput]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(["error" => "E-mail/Usuário ou senha incorretos"]);
        exit;
    }

    $_SESSION['user_id'] = $user['id'];

    echo json_encode([
        "success" => true,
        "user" => [
            "id" => $user['id'],
            "name" => $user['name'],
            "username" => $user['username'] ?? '',
            "email" => $user['email'],
            "company" => $user['company'] ?? '',
            "role" => $user['role'] ?? 'user'
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
