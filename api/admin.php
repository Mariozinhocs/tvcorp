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

// 1. DADOS DE KPI E LISTA DE ASSINANTES (ADMIN)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($action === 'dashboard' || $action === 'list_users' || empty($action))) {
    try {
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        $filterStatus = isset($_GET['status']) ? trim($_GET['status']) : '';

        // Query KPIs
        $totalUsers = intval($db->query("SELECT COUNT(*) as count FROM users")->fetch()['count']);
        $totalScreens = intval($db->query("SELECT COUNT(*) as count FROM screens")->fetch()['count']);
        
        $activeSubs = intval($db->query("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active' AND plan_name NOT LIKE '%Trial%'")->fetch()['count']);
        $trialSubs = intval($db->query("SELECT COUNT(*) as count FROM subscriptions WHERE plan_name LIKE '%Trial%' OR status = 'active'")->fetch()['count']);
        $expiredSubs = intval($db->query("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'expired'")->fetch()['count']);

        // Calcular MRR Estimado baseado nos planos ativos
        $stmtMrr = $db->query("
            SELECT plan_name, COUNT(*) as qty 
            FROM subscriptions 
            WHERE status = 'active' 
            GROUP BY plan_name
        ");
        $mrr = 0;
        $planPrices = [
            'Start' => 39.00,
            'Pro' => 89.00,
            'Enterprise' => 199.00,
            'Master Franchise' => 399.00
        ];

        while ($row = $stmtMrr->fetch()) {
            foreach ($planPrices as $pName => $pPrice) {
                if (stripos($row['plan_name'], $pName) !== false) {
                    $mrr += ($pPrice * intval($row['qty']));
                }
            }
        }

        // Listagem de Usuários com Assinatura e Contagem de Telas
        $sql = "
            SELECT 
                u.id, u.name, u.email, u.company, u.created_at,
                s.id as subscription_id, s.plan_name, s.screen_limit, s.status as sub_status, s.expires_at, s.mp_payment_id,
                (SELECT COUNT(*) FROM screens sc WHERE sc.user_id = u.id) as total_screens
            FROM users u
            LEFT JOIN subscriptions s ON u.id = s.user_id
            WHERE 1=1
        ";
        $params = [];

        if (!empty($search)) {
            $sql .= " AND (u.name LIKE ? OR u.email LIKE ? OR u.company LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        if (!empty($filterStatus)) {
            if ($filterStatus === 'trial') {
                $sql .= " AND (s.plan_name LIKE '%Trial%' OR s.status = 'active')";
            } else if ($filterStatus === 'active') {
                $sql .= " AND s.status = 'active' AND s.plan_name NOT LIKE '%Trial%'";
            } else if ($filterStatus === 'expired') {
                $sql .= " AND s.status = 'expired'";
            }
        }

        $sql .= " ORDER BY u.id DESC";

        $stmtUsers = $db->prepare($sql);
        $stmtUsers->execute($params);
        $users = $stmtUsers->fetchAll();

        echo json_encode([
            "success" => true,
            "kpis" => [
                "total_users" => $totalUsers,
                "total_screens" => $totalScreens,
                "active_subs" => $activeSubs,
                "trial_subs" => $trialSubs,
                "expired_subs" => $expiredSubs,
                "mrr" => number_format($mrr, 2, ',', '.')
            ],
            "users" => $users
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Erro ao carregar dados do admin: " . $e->getMessage()]);
        exit;
    }
}

// 2. EXTENDER TRIAL (+X DIAS)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'extend_trial') {
    $data = json_decode(file_get_contents("php://input"), true);
    $userId = isset($data['user_id']) ? intval($data['user_id']) : 0;
    $days = isset($data['days']) ? intval($data['days']) : 7;

    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(["error" => "ID do usuário é obrigatório"]);
        exit;
    }

    try {
        $stmtSub = $db->prepare("SELECT * FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1");
        $stmtSub->execute([$userId]);
        $sub = $stmtSub->fetch();

        $currentExpire = ($sub && !empty($sub['expires_at'])) ? strtotime($sub['expires_at']) : time();
        if ($currentExpire < time()) {
            $currentExpire = time();
        }
        $newExpire = date('Y-m-d H:i:s', strtotime("+$days days", $currentExpire));

        if ($sub) {
            $stmtUpdate = $db->prepare("UPDATE subscriptions SET expires_at = ?, status = 'active' WHERE id = ?");
            $stmtUpdate->execute([$newExpire, $sub['id']]);
        } else {
            $stmtIns = $db->prepare("INSERT INTO subscriptions (user_id, plan_name, screen_limit, status, expires_at) VALUES (?, 'Trial Extendido', 2, 'active', ?)");
            $stmtIns->execute([$userId, $newExpire]);
        }

        echo json_encode(["success" => true, "message" => "Trial estendido com sucesso por +$days dias!", "new_expires_at" => $newExpire]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Erro ao extender trial: " . $e->getMessage()]);
        exit;
    }
}

// 3. ALTERAR PLANO DO ASSINANTE
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'change_plan') {
    $data = json_decode(file_get_contents("php://input"), true);
    $userId = isset($data['user_id']) ? intval($data['user_id']) : 0;
    $planName = isset($data['plan_name']) ? trim($data['plan_name']) : 'Pro';

    $planLimits = [
        'Start' => 1,
        'Pro' => 5,
        'Enterprise' => 20,
        'Master Franchise' => 100
    ];
    $screenLimit = isset($planLimits[$planName]) ? $planLimits[$planName] : 5;

    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(["error" => "ID do usuário é obrigatório"]);
        exit;
    }

    try {
        $stmtSub = $db->prepare("SELECT * FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1");
        $stmtSub->execute([$userId]);
        $sub = $stmtSub->fetch();

        $newExpire = date('Y-m-d H:i:s', strtotime('+30 days'));

        if ($sub) {
            $stmtUpdate = $db->prepare("UPDATE subscriptions SET plan_name = ?, screen_limit = ?, status = 'active', expires_at = ? WHERE id = ?");
            $stmtUpdate->execute([$planName, $screenLimit, $newExpire, $sub['id']]);
        } else {
            $stmtIns = $db->prepare("INSERT INTO subscriptions (user_id, plan_name, screen_limit, status, expires_at) VALUES (?, ?, ?, 'active', ?)");
            $stmtIns->execute([$userId, $planName, $screenLimit, $newExpire]);
        }

        echo json_encode(["success" => true, "message" => "Plano alterado para '$planName' com limite de $screenLimit telas!"]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Erro ao alterar plano: " . $e->getMessage()]);
        exit;
    }
}

// 4. ATIVAR OU SUSPENDER CONTA
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'toggle_status') {
    $data = json_decode(file_get_contents("php://input"), true);
    $userId = isset($data['user_id']) ? intval($data['user_id']) : 0;

    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(["error" => "ID do usuário é obrigatório"]);
        exit;
    }

    try {
        $stmtSub = $db->prepare("SELECT * FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1");
        $stmtSub->execute([$userId]);
        $sub = $stmtSub->fetch();

        $newStatus = ($sub && $sub['status'] === 'active') ? 'expired' : 'active';

        if ($sub) {
            $stmtUpdate = $db->prepare("UPDATE subscriptions SET status = ? WHERE id = ?");
            $stmtUpdate->execute([$newStatus, $sub['id']]);
        }

        echo json_encode(["success" => true, "message" => "Status da assinatura alterado para '$newStatus'!"]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Erro ao alterar status: " . $e->getMessage()]);
        exit;
    }
}

http_response_code(400);
echo json_encode(["error" => "Ação inválida no Admin"]);
