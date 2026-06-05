<?php
// backend/config/database.php — v3 with auto-install
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'epei_db');

function getDB() {
    static $conn = null;

    // Reconnect nếu kết nối bị đứt
    if ($conn !== null && !@$conn->ping()) {
        $conn->close();
        $conn = null;
    }

    if ($conn === null) {
        // Kết nối MySQL (chưa chọn DB)
        $conn = @new mysqli(DB_HOST, DB_USER, DB_PASS);

        if ($conn->connect_error) {
            http_response_code(503);
            echo json_encode([
                'success' => false,
                'message' => 'MySQL chưa khởi động. Hãy bật MySQL trong XAMPP Control Panel.',
            ]);
            exit;
        }

        $conn->set_charset('utf8mb4');
        $conn->query("SET sql_mode = ''");

        // Tạo database nếu chưa có
        $conn->query("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $conn->select_db(DB_NAME);

        // Kiểm tra bảng users — nếu chưa có thì auto install
        $check = $conn->query("SHOW TABLES LIKE 'users'");
        if (!$check || $check->num_rows === 0) {
            require_once __DIR__ . '/auto_install.php';
            autoInstall($conn);
        }
    }

    return $conn;
}
