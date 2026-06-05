<?php
// debug.php — Kiểm tra toàn bộ hệ thống
// Truy cập: http://localhost/EPei/backend/setup/debug.php
error_reporting(E_ALL);
ini_set('display_errors', 1);
?>
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>EPei Debug</title>
<style>
  body{font-family:'Segoe UI',sans-serif;background:#f0f4f0;padding:20px;margin:0}
  .card{background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  h1{color:#4A7C59;margin-bottom:20px}
  h3{margin:0 0 12px;font-size:1rem}
  .ok{color:#27ae60;font-weight:600}
  .err{color:#c0392b;font-weight:600}
  .warn{color:#e67e22;font-weight:600}
  table{width:100%;border-collapse:collapse;font-size:.88rem}
  td,th{padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:left}
  th{background:#f8f8f8;font-weight:600}
  code{background:#f0f4f0;padding:2px 6px;border-radius:4px;font-size:.85rem}
  .btn{display:inline-block;background:#4A7C59;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:.9rem;margin-top:8px}
</style>
</head>
<body>
<h1>🔍 EPei System Debug</h1>

<?php
// ── 1. PHP Info ──────────────────────────────────────────────────────────────
echo '<div class="card"><h3>1. PHP Environment</h3><table>';
echo '<tr><td>PHP Version</td><td class="ok">'.PHP_VERSION.'</td></tr>';
echo '<tr><td>mysqli extension</td><td class="'.(extension_loaded('mysqli')?'ok':'err').'">'.(extension_loaded('mysqli')?'✅ Loaded':'❌ NOT loaded').'</td></tr>';
echo '<tr><td>session extension</td><td class="'.(extension_loaded('session')?'ok':'err').'">'.(extension_loaded('session')?'✅ Loaded':'❌ NOT loaded').'</td></tr>';
echo '<tr><td>json extension</td><td class="'.(extension_loaded('json')?'ok':'err').'">'.(extension_loaded('json')?'✅ Loaded':'❌ NOT loaded').'</td></tr>';
echo '<tr><td>Document Root</td><td><code>'.$_SERVER['DOCUMENT_ROOT'].'</code></td></tr>';
echo '<tr><td>Script Path</td><td><code>'.$_SERVER['SCRIPT_FILENAME'].'</code></td></tr>';
echo '</table></div>';

// ── 2. MySQL Connection ──────────────────────────────────────────────────────
echo '<div class="card"><h3>2. MySQL Connection</h3>';
$conn = @new mysqli('localhost','root','');
if ($conn->connect_error) {
    echo '<p class="err">❌ Kết nối MySQL thất bại: '.$conn->connect_error.'</p>';
    echo '<p>→ Kiểm tra MySQL đang chạy trong XAMPP Control Panel</p>';
} else {
    echo '<p class="ok">✅ Kết nối MySQL thành công</p>';
    echo '<p>MySQL version: '.$conn->server_info.'</p>';

    // ── 3. Database ──────────────────────────────────────────────────────────
    echo '</div><div class="card"><h3>3. Database epei_db</h3>';
    $r = $conn->query("SHOW DATABASES LIKE 'epei_db'");
    if ($r->num_rows === 0) {
        echo '<p class="err">❌ Database <code>epei_db</code> CHƯA TỒN TẠI</p>';
        echo '<p class="warn">→ Bạn cần chạy install.php trước!</p>';
        echo '<a href="install.php" class="btn">▶ Chạy Install ngay</a>';
    } else {
        echo '<p class="ok">✅ Database epei_db tồn tại</p>';
        $conn->select_db('epei_db');

        // Tables
        $tables = ['users','products','orders','order_items','messages','payment_codes'];
        echo '<table><tr><th>Bảng</th><th>Trạng thái</th><th>Số dòng</th></tr>';
        foreach ($tables as $t) {
            $tr = $conn->query("SHOW TABLES LIKE '$t'");
            if ($tr->num_rows === 0) {
                echo "<tr><td><code>$t</code></td><td class='err'>❌ Chưa tạo</td><td>-</td></tr>";
            } else {
                $cnt = $conn->query("SELECT COUNT(*) c FROM `$t`")->fetch_assoc()['c'];
                echo "<tr><td><code>$t</code></td><td class='ok'>✅ OK</td><td>$cnt dòng</td></tr>";
            }
        }
        echo '</table>';

        // Users
        $ur = $conn->query("SELECT id,name,email,role FROM users LIMIT 5");
        if ($ur && $ur->num_rows > 0) {
            echo '<br><table><tr><th>ID</th><th>Tên</th><th>Email</th><th>Role</th></tr>';
            while ($u = $ur->fetch_assoc()) {
                echo "<tr><td>{$u['id']}</td><td>{$u['name']}</td><td>{$u['email']}</td><td>{$u['role']}</td></tr>";
            }
            echo '</table>';
        }
    }
    $conn->close();
}
echo '</div>';

// ── 4. Session Test ──────────────────────────────────────────────────────────
echo '<div class="card"><h3>4. Session Test</h3>';
ini_set('session.cookie_samesite','Lax');
session_name('epei_session');
session_start();
$_SESSION['test'] = 'ok_'.time();
echo '<p class="ok">✅ Session started: ID = '.session_id().'</p>';
echo '<p>session.save_path: <code>'.session_save_path().'</code></p>';
echo '<p>Test value: <code>'.$_SESSION['test'].'</code></p>';
echo '</div>';

// ── 5. API Test ──────────────────────────────────────────────────────────────
echo '<div class="card"><h3>5. API Endpoint Test</h3>';
$apiUrl = 'http://localhost/EPei/backend/api/auth.php?action=me';
echo '<p>Testing: <code>'.$apiUrl.'</code></p>';
if (function_exists('curl_init')) {
    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    echo '<p>HTTP Status: <strong>'.$code.'</strong></p>';
    echo '<p>Response: <code>'.htmlspecialchars(substr($resp,0,200)).'</code></p>';
    $json = json_decode($resp, true);
    if ($json) echo '<p class="ok">✅ JSON response hợp lệ</p>';
    else echo '<p class="err">❌ Response không phải JSON — có thể có PHP error/warning trước output</p>';
} else {
    echo '<p class="warn">⚠ cURL không khả dụng — không thể test API</p>';
}
echo '</div>';

// ── 6. File paths ────────────────────────────────────────────────────────────
echo '<div class="card"><h3>6. File Structure</h3><table><tr><th>File</th><th>Tồn tại</th></tr>';
$files = [
    'backend/config/database.php',
    'backend/config/cors.php',
    'backend/config/session.php',
    'backend/api/auth.php',
    'backend/api/products.php',
    'backend/api/orders.php',
    'backend/api/messages.php',
    'backend/api/payment.php',
    'backend/api/users.php',
    'frontend/index.html',
    'frontend/js/api.js',
    'frontend/js/app.js',
];
$base = 'C:/xampp/htdocs/EPei/';
foreach ($files as $f) {
    $exists = file_exists($base.$f);
    echo '<tr><td><code>'.$f.'</code></td><td class="'.($exists?'ok':'err').'">'.($exists?'✅':'❌ MISSING').'</td></tr>';
}
echo '</table></div>';
?>

<div class="card">
  <h3>7. Quick Actions</h3>
  <a href="install.php" class="btn" style="margin-right:8px">🔄 Chạy Install (tạo lại DB)</a>
  <a href="/EPei/frontend/index.html" class="btn" style="background:#2980b9">🌐 Vào Website</a>
</div>
</body>
</html>
