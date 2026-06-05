<?php
ob_start();
// backend/api/messages.php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/session.php';
ob_clean();

$action = $_GET['action'] ?? 'send';

switch ($action) {
    case 'send':
        sendMessage();
        break;
    case 'list':
        requireAdmin();
        listMessages();
        break;
    case 'read':
        requireAdmin();
        markRead($_GET['id'] ?? 0);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Action không hợp lệ']);
}

function sendMessage() {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $content = trim($data['content'] ?? '');

    if (!$name || !$email || !$content) {
        echo json_encode(['success' => false, 'message' => 'Vui lòng điền đầy đủ thông tin']);
        return;
    }

    $db = getDB();
    $org = $data['organization'] ?? '';
    $subject = $data['subject'] ?? '';
    $stmt = $db->prepare("INSERT INTO messages (name, email, organization, subject, content) VALUES (?,?,?,?,?)");
    $stmt->bind_param('sssss', $name, $email, $org, $subject, $content);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Tin nhắn đã được gửi! Chúng tôi sẽ phản hồi trong 24 giờ.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Lỗi gửi tin nhắn']);
    }
}

function listMessages() {
    $db = getDB();
    $result = $db->query("SELECT * FROM messages ORDER BY created_at DESC");
    $messages = $result->fetch_all(MYSQLI_ASSOC);
    echo json_encode(['success' => true, 'data' => $messages]);
}

function markRead($id) {
    $db = getDB();
    $stmt = $db->prepare("UPDATE messages SET is_read = 1 WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    echo json_encode(['success' => true]);
}
