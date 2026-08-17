<?php
require_once __DIR__ . '/../config.php';
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método não permitido"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$name = isset($data['name']) ? trim($data['name']) : '';
$email = isset($data['email']) ? trim(strtolower($data['email'])) : '';
$password = isset($data['password']) ? trim($data['password']) : '';
$company = isset($data['company']) ? trim($data['company']) : '';

if (empty($name) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["error" => "Nome, e-mail e senha são obrigatórios"]);
    exit;
}

$db = getDatabaseConnection();

try {
    $stmtCheck = $db->prepare("SELECT COUNT(*) as count FROM users WHERE email = ?");
    $stmtCheck->execute([$email]);
    if ($stmtCheck->fetch()['count'] > 0) {
        http_response_code(400);
        echo json_encode(["error" => "Já existe uma conta cadastrada com este e-mail"]);
        exit;
    }

    $passHash = password_hash($password, PASSWORD_BCRYPT);
    $stmtUser = $db->prepare("INSERT INTO users (name, email, password_hash, company, role) VALUES (?, ?, ?, ?, 'user')");
    $stmtUser->execute([$name, $email, $passHash, $company]);
    $userId = intval($db->lastInsertId());

    // Ativar Trial de 7 Dias
    $trialExpires = date('Y-m-d H:i:s', strtotime('+7 days'));
    $stmtSub = $db->prepare("INSERT INTO subscriptions (user_id, plan_name, screen_limit, status, expires_at) VALUES (?, ?, ?, 'active', ?)");
    $stmtSub->execute([$userId, 'Trial 7 Dias Grátis', 1, $trialExpires]);

    $_SESSION['user_id'] = $userId;

    echo json_encode([
        "success" => true,
        "user" => [
            "id" => $userId,
            "name" => $name,
            "email" => $email,
            "company" => $company,
            "role" => "user"
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
