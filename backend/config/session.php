<?php
// backend/config/session.php - Fixed session config

// Must be set before session_start
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_secure', '0');
ini_set('session.cookie_httponly', '1');
ini_set('session.use_strict_mode', '1');

if (session_status() === PHP_SESSION_NONE) {
    session_name('epei_session');
    session_start();
}

function getCurrentUser() {
    return isset($_SESSION['epei_user']) ? $_SESSION['epei_user'] : null;
}

function requireAuth() {
    $user = getCurrentUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Chưa đăng nhập']);
        exit();
    }
    return $user;
}

function requireAdmin() {
    $user = requireAuth();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Không có quyền truy cập']);
        exit();
    }
    return $user;
}
