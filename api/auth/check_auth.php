<?php
require_once __DIR__ . '/../config.php';
header("Content-Type: application/json; charset=UTF-8");

$userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 1;

$db = getDatabaseConnection();

try {
    $stmt = $db->prepare("SELECT id, name, email, company, role, created_at FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        // Usuário admin padrão se for ambiente inicial
        $user = [
            "id" => 1,
            "name" => "Administrador TvCorp",
            "email" => "admin@tvcorp.com",
            "company" => "TvCorp Inc",
            "role" => "admin"
        ];
    }

    $stmtSub = $db->prepare("SELECT * FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1");
    $stmtSub->execute([$userId]);
    $sub = $stmtSub->fetch();

    if (!$sub) {
        $sub = [
            "plan_name" => "Plano Pro Enterprise",
            "screen_limit" => 10,
            "status" => "active",
            "expires_at" => "2026-12-31"
        ];
    }

    echo json_encode([
        "authenticated" => true,
        "user" => $user,
        "subscription" => $sub
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
