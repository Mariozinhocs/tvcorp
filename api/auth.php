<?php
session_start();

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

// 1. REGISTRO DE NOVO CLIENTE (Com Trial de 7 dias grátis)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'register') {
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

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["error" => "Formato de e-mail inválido"]);
        exit;
    }

    try {
        // Verificar se e-mail já existe
        $stmtCheck = $db->prepare("SELECT COUNT(*) as count FROM users WHERE email = ?");
        $stmtCheck->execute([$email]);
        if ($stmtCheck->fetch()['count'] > 0) {
            http_response_code(400);
            echo json_encode(["error" => "Já existe uma conta cadastrada com este e-mail"]);
            exit;
        }

        $now = date('Y-m-d H:i:s');
        $passHash = password_hash($password, PASSWORD_BCRYPT);

        $db->beginTransaction();

        $stmtUser = $db->prepare("INSERT INTO users (name, email, password_hash, company, created_at) VALUES (?, ?, ?, ?, ?)");
        $stmtUser->execute([$name, $email, $passHash, $company, $now]);
        $userId = intval($db->lastInsertId());

        // Ativar Plano Trial Grátis de 7 Dias por Padrão (1 Tela)
        $trialExpires = date('Y-m-d H:i:s', strtotime('+7 days'));
        $stmtSub = $db->prepare("INSERT INTO subscriptions (user_id, plan_name, screen_limit, status, expires_at) VALUES (?, ?, ?, ?, ?)");
        $stmtSub->execute([$userId, 'Trial 7 Dias Grátis', 1, 'active', $trialExpires]);

        $db->commit();

        // Autenticar na sessão
        $_SESSION['user_id'] = $userId;

        echo json_encode([
            "success" => true,
            "user" => [
                "id" => $userId,
                "name" => $name,
                "email" => $email,
                "company" => $company
            ],
            "subscription" => [
                "plan_name" => "Trial 7 Dias Grátis",
                "screen_limit" => 1,
                "status" => "active",
                "expires_at" => $trialExpires
            ]
        ]);

    } catch (PDOException $e) {
        if ($db->inTransaction()) $db->rollBack();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 2. LOGIN DE CLIENTE
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
    $data = json_decode(file_get_contents("php://input"), true);
    $loginInput = isset($data['email']) ? trim($data['email']) : (isset($data['login']) ? trim($data['login']) : '');
    $password = isset($data['password']) ? trim($data['password']) : '';

    if (empty($loginInput) || empty($password)) {
        http_response_code(400);
        echo json_encode(["error" => "E-mail/Usuário e senha são obrigatórios"]);
        exit;
    }

    try {
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1");
        $stmt->execute([strtolower($loginInput), $loginInput]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(["error" => "E-mail/Usuário ou senha incorretos"]);
            exit;
        }

        // Buscar dados da assinatura ativa
        $stmtSub = $db->prepare("SELECT * FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1");
        $stmtSub->execute([$user['id']]);
        $sub = $stmtSub->fetch();

        $_SESSION['user_id'] = $user['id'];

        echo json_encode([
            "success" => true,
            "user" => [
                "id" => $user['id'],
                "name" => $user['name'],
                "email" => $user['email'],
                "company" => $user['company']
            ],
            "subscription" => $sub ? [
                "plan_name" => $sub['plan_name'],
                "screen_limit" => intval($sub['screen_limit']),
                "status" => $sub['status'],
                "expires_at" => $sub['expires_at']
            ] : null
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 3. CONSULTAR USUÁRIO LOGADO (ME)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'me') {
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : (isset($_GET['user_id']) ? intval($_GET['user_id']) : null);

    if (!$userId) {
        // Se não houver sessão ativa, retorna a conta admin padrão para teste
        $userId = 1;
    }

    try {
        $stmt = $db->prepare("SELECT id, name, email, company, created_at FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(404);
            echo json_encode(["error" => "Usuário não encontrado"]);
            exit;
        }

        // Assinatura
        $stmtSub = $db->prepare("SELECT * FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1");
        $stmtSub->execute([$userId]);
        $sub = $stmtSub->fetch();

        // Contagem de telas em uso pelo usuário
        $stmtScreens = $db->prepare("SELECT COUNT(*) as count FROM screens WHERE user_id = ? OR user_id IS NULL");
        $stmtScreens->execute([$userId]);
        $screensUsed = $stmtScreens->fetch()['count'];

        echo json_encode([
            "authenticated" => true,
            "user" => $user,
            "subscription" => $sub ? [
                "plan_name" => $sub['plan_name'],
                "screen_limit" => intval($sub['screen_limit']),
                "screens_used" => intval($screensUsed),
                "status" => $sub['status'],
                "expires_at" => $sub['expires_at']
            ] : null
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 4. ATUALIZAR PERFIL DO USUÁRIO
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update-profile') {
    $data = json_decode(file_get_contents("php://input"), true);
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : (isset($data['userId']) ? intval($data['userId']) : 1);
    $name = isset($data['name']) ? trim($data['name']) : '';
    $email = isset($data['email']) ? trim(strtolower($data['email'])) : '';
    $company = isset($data['company']) ? trim($data['company']) : '';

    if (empty($name) || empty($email)) {
        http_response_code(400);
        echo json_encode(["error" => "Nome e e-mail são obrigatórios"]);
        exit;
    }

    try {
        $stmt = $db->prepare("UPDATE users SET name = ?, email = ?, company = ? WHERE id = ?");
        $stmt->execute([$name, $email, $company, $userId]);

        echo json_encode([
            "success" => true,
            "message" => "Perfil atualizado com sucesso!",
            "user" => [
                "id" => $userId,
                "name" => $name,
                "email" => $email,
                "company" => $company
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 5. ALTERAR SENHA DO USUÁRIO
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'change-password') {
    $data = json_decode(file_get_contents("php://input"), true);
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : (isset($data['userId']) ? intval($data['userId']) : 1);
    $currentPassword = isset($data['currentPassword']) ? trim($data['currentPassword']) : '';
    $newPassword = isset($data['newPassword']) ? trim($data['newPassword']) : '';

    if (empty($newPassword)) {
        http_response_code(400);
        echo json_encode(["error" => "Nova senha não pode ser vazia"]);
        exit;
    }

    try {
        $stmtCheck = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmtCheck->execute([$userId]);
        $user = $stmtCheck->fetch();

        if ($user && !empty($user['password_hash']) && !empty($currentPassword)) {
            if (!password_verify($currentPassword, $user['password_hash'])) {
                http_response_code(400);
                echo json_encode(["error" => "Senha atual incorreta"]);
                exit;
            }
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
        $stmtUp = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $stmtUp->execute([$newHash, $userId]);

        echo json_encode(["success" => true, "message" => "Senha alterada com sucesso!"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 6. HISTÓRICO DE PAGAMENTOS / ASSINATURAS DO USUÁRIO
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'payments') {
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : (isset($_GET['user_id']) ? intval($_GET['user_id']) : 1);

    try {
        $stmt = $db->prepare("SELECT id, plan_name, screen_limit, status, mp_payment_id, expires_at, created_at FROM subscriptions WHERE user_id = ? ORDER BY id DESC");
        $stmt->execute([$userId]);
        $payments = $stmt->fetchAll();

        echo json_encode($payments);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 7. LOGOUT
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'logout') {
    session_destroy();
    echo json_encode(["success" => true]);
    exit;
}
