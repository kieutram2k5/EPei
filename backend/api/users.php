<?php
ob_start();
// backend/api/users.php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/session.php';
ob_clean();

$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'list':
        requireAdmin();
        listUsers();
        break;
    case 'update_profile':
        $user = requireAuth();
        updateProfile($user);
        break;
    case 'stats':
        requireAdmin();
        getStats();
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Action không hợp lệ']);
}

function listUsers() {
    $db     = getDB();
    $result = $db->query("SELECT id, name, email, phone, address, role, created_at FROM users ORDER BY created_at DESC");
    $users  = $result->fetch_all(MYSQLI_ASSOC);
    echo json_encode(['success' => true, 'data' => $users]);
}

function updateProfile($currentUser) {
    $data    = json_decode(file_get_contents('php://input'), true);
    if (!$data) $data = $_POST;
    $db      = getDB();
    $name    = trim($data['name']    ?? $currentUser['name']);
    $phone   = trim($data['phone']   ?? '');
    $address = trim($data['address'] ?? '');

    $stmt = $db->prepare("UPDATE users SET name=?, phone=?, address=? WHERE id=?");
    $stmt->bind_param('sssi', $name, $phone, $address, $currentUser['id']);
    if ($stmt->execute()) {
        // Update session with correct key
        $_SESSION['epei_user']['name']    = $name;
        $_SESSION['epei_user']['phone']   = $phone;
        $_SESSION['epei_user']['address'] = $address;
        echo json_encode(['success' => true, 'message' => 'Cập nhật thành công',
                          'user' => $_SESSION['epei_user']]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Lỗi cập nhật: ' . $db->error]);
    }
}

function getStats() {
    $db            = getDB();
    $totalOrders   = (int)$db->query("SELECT COUNT(*) c FROM orders")->fetch_assoc()['c'];
    $revenue       = (int)$db->query("SELECT COALESCE(SUM(total),0) s FROM orders WHERE order_status!='cancelled'")->fetch_assoc()['s'];
    $customers     = (int)$db->query("SELECT COUNT(*) c FROM users WHERE role='customer'")->fetch_assoc()['c'];
    $pending       = (int)$db->query("SELECT COUNT(*) c FROM orders WHERE order_status='pending'")->fetch_assoc()['c'];
    $unread        = (int)$db->query("SELECT COUNT(*) c FROM messages WHERE is_read=0")->fetch_assoc()['c'];
    echo json_encode(['success' => true, 'data' => [
        'total_orders'    => $totalOrders,
        'revenue'         => $revenue,
        'customers'       => $customers,
        'pending_orders'  => $pending,
        'unread_messages' => $unread,
    ]]);
}
