<?php
ob_start();
// backend/api/payment.php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/session.php';
ob_clean();

$action = $_GET['action'] ?? 'get';

switch ($action) {
    case 'get':
        getPaymentInfo();
        break;
    case 'update':
        requireAdmin();
        updatePaymentInfo();
        break;
    case 'confirm':
        requireAdmin();
        confirmPayment($_GET['order_id'] ?? '');
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Action không hợp lệ']);
}

function getPaymentInfo() {
    $db = getDB();
    $result = $db->query("SELECT * FROM payment_codes WHERE active = 1 LIMIT 1");
    $info = $result->fetch_assoc();
    echo json_encode(['success' => true, 'data' => $info]);
}

function updatePaymentInfo() {
    $data = json_decode(file_get_contents('php://input'), true);
    $db = getDB();

    // Kiểm tra đã có chưa
    $existing = $db->query("SELECT id FROM payment_codes WHERE active = 1 LIMIT 1")->fetch_assoc();

    $bankName = $data['bank_name'] ?? '';
    $accountNumber = $data['account_number'] ?? '';
    $accountName = $data['account_name'] ?? '';
    $qrContent = $data['qr_content'] ?? '';
    $description = $data['description'] ?? '';

    if ($existing) {
        $stmt = $db->prepare("UPDATE payment_codes SET bank_name=?, account_number=?, account_name=?, qr_content=?, description=? WHERE id=?");
        $stmt->bind_param('sssssi', $bankName, $accountNumber, $accountName, $qrContent, $description, $existing['id']);
    } else {
        $stmt = $db->prepare("INSERT INTO payment_codes (bank_name, account_number, account_name, qr_content, description) VALUES (?,?,?,?,?)");
        $stmt->bind_param('sssss', $bankName, $accountNumber, $accountName, $qrContent, $description);
    }

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Cập nhật thông tin thanh toán thành công']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Lỗi cập nhật']);
    }
}

function confirmPayment($orderId) {
    $db = getDB();
    $stmt = $db->prepare("UPDATE orders SET payment_status = 'paid' WHERE id = ?");
    $stmt->bind_param('s', $orderId);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Đã xác nhận thanh toán']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Lỗi xác nhận']);
    }
}
