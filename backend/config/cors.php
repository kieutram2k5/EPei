<?php
// backend/config/cors.php - Fixed for localhost sessions

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
$allowed = ['http://localhost', 'http://127.0.0.1', 'http://localhost:80', 'http://127.0.0.1:80'];

// Allow any localhost origin
if (empty($origin) || strpos($origin, 'localhost') !== false || strpos($origin, '127.0.0.1') !== false) {
    $allowOrigin = empty($origin) ? 'http://localhost' : $origin;
} else {
    $allowOrigin = $origin;
}

header('Access-Control-Allow-Origin: ' . $allowOrigin);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
