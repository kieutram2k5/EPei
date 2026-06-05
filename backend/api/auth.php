<?php
ob_start();
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/session.php';
ob_clean();

$action = $_GET['action'] ?? '';
switch ($action) {
    case 'login':    handleLogin();    break;
    case 'register': handleRegister(); break;
    case 'logout':   handleLogout();   break;
    case 'me':       getMe();          break;
    default: echo json_encode(['success'=>false,'message'=>'Action không hợp lệ']);
}

function handleLogin() {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) $data = $_POST;
    $email    = trim($data['email']    ?? '');
    $password = $data['password'] ?? '';
    if (!$email || !$password) { echo json_encode(['success'=>false,'message'=>'Vui lòng nhập đầy đủ thông tin']); return; }
    $db   = getDB();
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    if (!$user || !password_verify($password, $user['password'])) {
        echo json_encode(['success'=>false,'message'=>'Email hoặc mật khẩu không đúng']); return;
    }
    unset($user['password']);
    $_SESSION['epei_user'] = $user;
    echo json_encode(['success'=>true,'user'=>$user,'message'=>'Đăng nhập thành công'], JSON_UNESCAPED_UNICODE);
}

function handleRegister() {
    $data     = json_decode(file_get_contents('php://input'), true);
    if (!$data) $data = $_POST;
    $name     = trim($data['name']     ?? '');
    $email    = trim($data['email']    ?? '');
    $password = $data['password'] ?? '';
    $phone    = trim($data['phone']    ?? '');
    if (!$name || !$email || !$password) { echo json_encode(['success'=>false,'message'=>'Vui lòng nhập đầy đủ thông tin']); return; }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { echo json_encode(['success'=>false,'message'=>'Email không hợp lệ']); return; }
    if (strlen($password) < 6) { echo json_encode(['success'=>false,'message'=>'Mật khẩu phải có ít nhất 6 ký tự']); return; }
    $db  = getDB();
    $chk = $db->prepare("SELECT id FROM users WHERE email = ?");
    $chk->bind_param('s', $email);
    $chk->execute();
    if ($chk->get_result()->num_rows > 0) { echo json_encode(['success'=>false,'message'=>'Email đã được sử dụng']); return; }
    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $stmt   = $db->prepare("INSERT INTO users (name,email,password,phone,role) VALUES (?,?,?,?,'customer')");
    $stmt->bind_param('ssss', $name, $email, $hashed, $phone);
    if (!$stmt->execute()) { echo json_encode(['success'=>false,'message'=>'Lỗi tạo tài khoản: '.$db->error]); return; }
    $user = ['id'=>$db->insert_id,'name'=>$name,'email'=>$email,'phone'=>$phone,'address'=>'','role'=>'customer'];
    $_SESSION['epei_user'] = $user;
    echo json_encode(['success'=>true,'user'=>$user,'message'=>'Đăng ký thành công'], JSON_UNESCAPED_UNICODE);
}

function handleLogout() {
    $_SESSION = [];
    session_destroy();
    echo json_encode(['success'=>true,'message'=>'Đã đăng xuất']);
}

function getMe() {
    $user = getCurrentUser();
    echo $user
        ? json_encode(['success'=>true,'user'=>$user], JSON_UNESCAPED_UNICODE)
        : json_encode(['success'=>false,'message'=>'Chưa đăng nhập']);
}
