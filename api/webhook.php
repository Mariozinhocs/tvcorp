<?php
// Endpoint Webhook do Mercado Pago para Notificações Instantâneas de Pagamento (IPN)

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/db.php';
$db = getDatabase();

// Receber o corpo da requisição enviada pelo Mercado Pago
$body = file_get_contents("php://input");
$data = json_decode($body, true);

// Log de depuração básico
file_put_contents(__DIR__ . '/webhook_log.txt', date('Y-m-d H:i:s') . " - Body: " . $body . "\n", FILE_APPEND);

$paymentId = null;

// Identificar a estrutura de notificação
if (isset($data['data']['id'])) {
    $paymentId = strval($data['data']['id']);
} elseif (isset($_GET['id'])) {
    $paymentId = strval($_GET['id']);
} elseif (isset($data['id'])) {
    $paymentId = strval($data['id']);
}

if (!$paymentId) {
    http_response_code(200);
    echo json_encode(["status" => "ignored", "reason" => "Nenhum ID de pagamento recebido"]);
    exit;
}

try {
    // Buscar se temos alguma assinatura pendente vinculada a esse ID
    $stmt = $db->prepare("SELECT * FROM subscriptions WHERE mp_payment_id = ?");
    $stmt->execute([$paymentId]);
    $sub = $stmt->fetch();

    if ($sub) {
        // Renovar a assinatura do usuário para ativo por 30 dias
        $expires = date('Y-m-d H:i:s', strtotime('+30 days'));
        $stmtUp = $db->prepare("UPDATE subscriptions SET status = 'active', expires_at = ? WHERE id = ?");
        $stmtUp->execute([$expires, $sub['id']]);

        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Assinatura ativada com sucesso!"]);
        exit;
    } else {
        http_response_code(200);
        echo json_encode(["status" => "ignored", "reason" => "Pagamento não encontrado na base local"]);
        exit;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
    exit;
}
