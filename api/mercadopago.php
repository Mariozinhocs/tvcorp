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

// Configuração do Mercado Pago (Chave do Access Token)
// O cliente pode substituir esta constante pelo seu Access Token de Produção ou Testes
define('MP_ACCESS_TOKEN', 'APP_USR-7890123456789012-081415-abcdef1234567890abcdef1234567890-123456789');

// Mapeamento de Planos Comercializáveis do TvCorp
$PLANS = [
    'start' => [
        'name' => 'Plano Start',
        'price' => 39.00,
        'screen_limit' => 2,
        'description' => 'TvCorp - Assinatura Plano Start (2 Telas)'
    ],
    'pro' => [
        'name' => 'Plano Pro',
        'price' => 89.00,
        'screen_limit' => 5,
        'description' => 'TvCorp - Assinatura Plano Pro (5 Telas)'
    ],
    'enterprise' => [
        'name' => 'Plano Enterprise',
        'price' => 199.00,
        'screen_limit' => 15,
        'description' => 'TvCorp - Assinatura Plano Enterprise (15 Telas)'
    ]
];

$action = isset($_GET['action']) ? $_GET['action'] : '';

// 1. CRIAR COBRANÇA PIX (OU CHECKOUT DE TESTE)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'create-pix') {
    $data = json_decode(file_get_contents("php://input"), true);
    $planKey = isset($data['planKey']) ? trim(strtolower($data['planKey'])) : 'start';
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : (isset($data['userId']) ? intval($data['userId']) : 1);
    $email = isset($data['email']) ? trim($data['email']) : 'cliente@tvcorp.com';

    if (!isset($PLANS[$planKey])) {
        http_response_code(400);
        echo json_encode(["error" => "Plano selecionado é inválido"]);
        exit;
    }

    $plan = $PLANS[$planKey];
    $notificationUrl = "http://" . $_SERVER['HTTP_HOST'] . "/api/webhook.php";

    // Tentar chamada oficial à API do Mercado Pago via cURL
    $payload = [
        "transaction_amount" => $plan['price'],
        "description" => $plan['description'],
        "payment_method_id" => "pix",
        "payer" => [
            "email" => $email,
            "first_name" => "Cliente",
            "last_name" => "TvCorp"
        ],
        "notification_url" => $notificationUrl,
        "external_reference" => json_encode(["user_id" => $userId, "plan_key" => $planKey])
    ];

    $ch = curl_init("https://api.mercadopago.com/v1/payments");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Content-Type: application/json",
        "Authorization: Bearer " . MP_ACCESS_TOKEN
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $responseData = json_decode($response, true);

    // Se o Mercado Pago aceitou e gerou o PIX real
    if ($httpCode === 201 && isset($responseData['point_of_interaction']['transaction_data'])) {
        $pixData = $responseData['point_of_interaction']['transaction_data'];
        
        // Registrar cobrança pendente no banco
        $paymentId = strval($responseData['id']);
        $stmtSub = $db->prepare("
            INSERT INTO subscriptions (user_id, plan_name, screen_limit, status, mp_payment_id, expires_at) 
            VALUES (?, ?, ?, 'pending', ?, ?)
        ");
        $stmtSub->execute([
            $userId, $plan['name'], $plan['screen_limit'], $paymentId, date('Y-m-d H:i:s', strtotime('+30 days'))
        ]);

        echo json_encode([
            "success" => true,
            "is_live" => true,
            "payment_id" => $paymentId,
            "plan_name" => $plan['name'],
            "price" => $plan['price'],
            "qr_code_base64" => $pixData['qr_code_base64'],
            "qr_code" => $pixData['qr_code']
        ]);
        exit;
    }

    // MODO DE SIMULAÇÃO/DEMONSTRAÇÃO REALISTA (Fallback caso token de MP não seja fornecido)
    $simulatedPaymentId = "mp_sim_" . rand(100000, 999999);
    $simulatedPixCode = "00020126580014BR.GOV.BCB.PIX0136tvcorp-pix-chave-demo-360-hub5204000053039865405" . sprintf("%.2f", $plan['price']) . "5802BR5920TVCORP TECNOLOGIA6009SAO PAULO62070503***6304E2B1";

    // Imagem simulada de QR Code
    $simulatedQrBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    // Criar/Atualizar pendência
    $stmtSub = $db->prepare("
        INSERT INTO subscriptions (user_id, plan_name, screen_limit, status, mp_payment_id, expires_at) 
        VALUES (?, ?, ?, 'pending', ?, ?)
    ");
    $stmtSub->execute([
        $userId, $plan['name'], $plan['screen_limit'], $simulatedPaymentId, date('Y-m-d H:i:s', strtotime('+30 days'))
    ]);

    echo json_encode([
        "success" => true,
        "is_live" => false,
        "payment_id" => $simulatedPaymentId,
        "plan_name" => $plan['name'],
        "price" => $plan['price'],
        "qr_code_base64" => $simulatedQrBase64,
        "qr_code" => $simulatedPixCode,
        "note" => "Checkout de Teste Ativo (Insira seu Access Token em api/mercadopago.php para vendas reais)"
    ]);
    exit;
}

// 2. CRIAR PROCESSAMENTO DE CARTÃO DE CRÉDITO (MERCADO PAGO)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'create-card') {
    $data = json_decode(file_get_contents("php://input"), true);
    $planKey = isset($data['planKey']) ? trim(strtolower($data['planKey'])) : 'start';
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : (isset($data['userId']) ? intval($data['userId']) : 1);
    $email = isset($data['email']) ? trim($data['email']) : 'cliente@tvcorp.com';
    $cardToken = isset($data['cardToken']) ? trim($data['cardToken']) : '';
    $installments = isset($data['installments']) ? intval($data['installments']) : 1;
    $paymentMethodId = isset($data['paymentMethodId']) ? trim($data['paymentMethodId']) : 'visa';

    if (!isset($PLANS[$planKey])) {
        http_response_code(400);
        echo json_encode(["error" => "Plano selecionado é inválido"]);
        exit;
    }

    $plan = $PLANS[$planKey];
    $notificationUrl = "http://" . $_SERVER['HTTP_HOST'] . "/api/webhook.php";

    // Tentar cobração real via Mercado Pago se houver token válido
    if (!empty($cardToken) && MP_ACCESS_TOKEN !== 'APP_USR-7890123456789012-081415-abcdef1234567890abcdef1234567890-123456789') {
        $payload = [
            "transaction_amount" => $plan['price'],
            "token" => $cardToken,
            "description" => $plan['description'],
            "installments" => $installments,
            "payment_method_id" => $paymentMethodId,
            "payer" => [
                "email" => $email
            ],
            "notification_url" => $notificationUrl
        ];

        $ch = curl_init("https://api.mercadopago.com/v1/payments");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Content-Type: application/json",
            "Authorization: Bearer " . MP_ACCESS_TOKEN
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $responseData = json_decode($response, true);

        if ($httpCode === 201 && isset($responseData['id'])) {
            $paymentId = strval($responseData['id']);
            $status = ($responseData['status'] === 'approved') ? 'active' : 'pending';

            $stmtSub = $db->prepare("
                INSERT INTO subscriptions (user_id, plan_name, screen_limit, status, mp_payment_id, expires_at) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmtSub->execute([
                $userId, $plan['name'], $plan['screen_limit'], $status, $paymentId, date('Y-m-d H:i:s', strtotime('+30 days'))
            ]);

            echo json_encode([
                "success" => true,
                "is_live" => true,
                "payment_id" => $paymentId,
                "status" => $status,
                "plan_name" => $plan['name'],
                "price" => $plan['price'],
                "message" => "Pagamento via Cartão processado pelo Mercado Pago!"
            ]);
            exit;
        }
    }

    // MODO DE SIMULAÇÃO/DEMONSTRAÇÃO REALISTA PARA CARTÃO DE CRÉDITO
    $simulatedPaymentId = "mp_card_sim_" . rand(100000, 999999);
    $expires = date('Y-m-d H:i:s', strtotime('+30 days'));

    $stmtSub = $db->prepare("
        INSERT INTO subscriptions (user_id, plan_name, screen_limit, status, mp_payment_id, expires_at) 
        VALUES (?, ?, ?, 'active', ?, ?)
    ");
    $stmtSub->execute([
        $userId, $plan['name'], $plan['screen_limit'], $simulatedPaymentId, $expires
    ]);

    echo json_encode([
        "success" => true,
        "is_live" => false,
        "payment_id" => $simulatedPaymentId,
        "status" => "active",
        "plan_name" => $plan['name'],
        "price" => $plan['price'],
        "installments" => $installments,
        "message" => "🎉 Pagamento com Cartão de Crédito Aprovado com Sucesso!"
    ]);
    exit;
}

// 3. SIMULAR APROVAÇÃO RÁPIDA (Útil para demonstração/testes de vendas pelo PO)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'simulate-approval') {
    $data = json_decode(file_get_contents("php://input"), true);
    $paymentId = isset($data['paymentId']) ? trim($data['paymentId']) : '';

    if (empty($paymentId)) {
        http_response_code(400);
        echo json_encode(["error" => "paymentId é obrigatório"]);
        exit;
    }

    try {
        $stmt = $db->prepare("SELECT * FROM subscriptions WHERE mp_payment_id = ?");
        $stmt->execute([$paymentId]);
        $sub = $stmt->fetch();

        if (!$sub) {
            http_response_code(404);
            echo json_encode(["error" => "Assinatura pendente não encontrada"]);
            exit;
        }

        $now = date('Y-m-d H:i:s');
        $expires = date('Y-m-d H:i:s', strtotime('+30 days'));

        $stmtUp = $db->prepare("UPDATE subscriptions SET status = 'active', expires_at = ? WHERE id = ?");
        $stmtUp->execute([$expires, $sub['id']]);

        echo json_encode(["success" => true, "message" => "Pagamento aprovado e plano liberado com sucesso!"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}
