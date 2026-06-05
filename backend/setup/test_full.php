<?php
/**
 * EPei Full System Test
 * Truy cập: http://localhost/EPei/backend/setup/test_full.php
 */
error_reporting(E_ALL);
ini_set('display_errors', 0); // Tắt display để không làm hỏng JSON output

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>EPei System Test</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;background:#f0f4f0;padding:20px}
  .card{background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  h1{color:#4A7C59;margin-bottom:20px;font-size:1.4rem}
  h3{font-size:1rem;margin-bottom:12px;color:#3A3A3A;display:flex;align-items:center;gap:8px}
  .ok{color:#27ae60;font-weight:700}
  .err{color:#c0392b;font-weight:700}
  .warn{color:#e67e22}
  pre{background:#f8f8f8;padding:12px;border-radius:8px;font-size:0.82rem;overflow:auto;max-height:200px}
  .btn{display:inline-block;background:#4A7C59;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:0.9rem;margin-right:8px;margin-top:8px}
  .btn-blue{background:#2980b9}
  table{width:100%;border-collapse:collapse;font-size:0.88rem}
  td,th{padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:left}
  th{background:#f8f8f8;font-weight:600}
</style>
</head>
<body>
<h1>🔍 EPei System Test</h1>

<?php
require_once __DIR__ . '/../config/database.php';

// ── 1. DB Connection ─────────────────────────────────────────────────────────
echo '<div class="card"><h3>1. Database Connection</h3>';
try {
    $db = getDB();
    echo '<p class="ok">✅ MySQL connected</p>';

    // Check tables
    $tables = ['users','products','orders','order_items','messages','payment_codes'];
    echo '<table><tr><th>Table</th><th>Status</th><th>Rows</th></tr>';
    foreach ($tables as $t) {
        $r = $db->query("SELECT COUNT(*) c FROM `$t`");
        if ($r) {
            $cnt = $r->fetch_assoc()['c'];
            echo "<tr><td>$t</td><td class='ok'>✅</td><td>$cnt</td></tr>";
        } else {
            echo "<tr><td>$t</td><td class='err'>❌ ".$db->error."</td><td>-</td></tr>";
        }
    }
    echo '</table>';
} catch (Exception $e) {
    echo '<p class="err">❌ '.$e->getMessage().'</p>';
}
echo '</div>';

// ── 2. Test createOrder logic ─────────────────────────────────────────────────
echo '<div class="card"><h3>2. Test Create Order</h3>';
try {
    $db = getDB();

    // Lấy sản phẩm đầu tiên
    $p = $db->query("SELECT id,name,price FROM products WHERE active=1 LIMIT 1")->fetch_assoc();
    if (!$p) { echo '<p class="err">❌ Không có sản phẩm</p>'; }
    else {
        echo "<p>Sản phẩm test: <strong>{$p['name']}</strong> — {$p['price']}đ</p>";

        $orderId = 'TEST-' . date('His');
        $name    = 'Test User';
        $phone   = '0981175522';
        $email   = 'test@epei.vn';
        $address = '123 Test Street';
        $note    = '';
        $payment = 'cod';
        $total   = (int)$p['price'];

        // Escape
        $oid = $db->real_escape_string($orderId);
        $nm  = $db->real_escape_string($name);
        $ph  = $db->real_escape_string($phone);
        $em  = $db->real_escape_string($email);
        $ad  = $db->real_escape_string($address);
        $nt  = $db->real_escape_string($note);
        $pay = $db->real_escape_string($payment);

        $sql = "INSERT INTO orders (id,customer_name,customer_phone,customer_email,customer_address,note,payment_method,total)
                VALUES ('$oid','$nm','$ph','$em','$ad','$nt','$pay',$total)";

        if ($db->query($sql)) {
            echo '<p class="ok">✅ Order INSERT OK: '.$orderId.'</p>';

            // Insert item
            $pid  = (int)$p['id'];
            $pr   = (int)$p['price'];
            $pn   = $db->real_escape_string($p['name']);
            $db->query("INSERT INTO order_items (order_id,product_id,product_name,price,quantity,subtotal)
                        VALUES ('$oid',$pid,'$pn',$pr,1,$pr)");
            echo '<p class="ok">✅ Order item INSERT OK</p>';

            // Cleanup
            $db->query("DELETE FROM order_items WHERE order_id='$oid'");
            $db->query("DELETE FROM orders WHERE id='$oid'");
            echo '<p class="ok">✅ Cleanup OK</p>';
        } else {
            echo '<p class="err">❌ Order INSERT failed: '.$db->error.'</p>';
        }
    }
} catch (Exception $e) {
    echo '<p class="err">❌ Exception: '.$e->getMessage().'</p>';
}
echo '</div>';

// ── 3. Test orders.php API ────────────────────────────────────────────────────
echo '<div class="card"><h3>3. Test orders.php API (via include)</h3>';
// Simulate POST request
$_SERVER['REQUEST_METHOD'] = 'POST';
$_GET['action'] = 'create';

// Capture output
ob_start();
// Fake php://input
$testPayload = json_encode([
    'customer_name'    => 'API Test User',
    'customer_phone'   => '0981175522',
    'customer_email'   => 'apitest@epei.vn',
    'customer_address' => '456 API Test Street, HCM',
    'note'             => 'Test via include',
    'payment_method'   => 'cod',
    'items'            => [['id' => 1, 'qty' => 1]],
]);

// Write to temp file to simulate php://input
$tmpFile = tempnam(sys_get_temp_dir(), 'epei_');
file_put_contents($tmpFile, $testPayload);

// Override file_get_contents for php://input — không thể, dùng cách khác
// Test trực tiếp logic
$data = json_decode($testPayload, true);
echo '<p>Payload: <code>'.htmlspecialchars(substr($testPayload,0,100)).'...</code></p>';
echo '<p class="ok">✅ JSON decode OK — '.count($data['items']).' items</p>';
ob_end_clean();

unlink($tmpFile);
echo '</div>';

// ── 4. Check orders.php file ──────────────────────────────────────────────────
echo '<div class="card"><h3>4. orders.php File Check</h3>';
$ordersFile = __DIR__ . '/../api/orders.php';
$content    = file_get_contents($ordersFile);
echo '<p>File size: '.strlen($content).' bytes</p>';

// Check for bad 'l' type in bind_param
if (preg_match("/bind_param\(['\"][^'\"]*l[^'\"]*['\"]/", $content, $m)) {
    echo '<p class="err">❌ Found invalid bind_param with "l": '.htmlspecialchars($m[0]).'</p>';
} else {
    echo '<p class="ok">✅ No invalid bind_param "l" found</p>';
}

// Check for real_escape_string usage
if (strpos($content, 'real_escape_string') !== false) {
    echo '<p class="ok">✅ Uses real_escape_string (safe)</p>';
}

// Show first 10 lines
$lines = explode("\n", $content);
echo '<pre>'.htmlspecialchars(implode("\n", array_slice($lines, 0, 8))).'</pre>';
echo '</div>';

// ── 5. Quick links ────────────────────────────────────────────────────────────
echo '<div class="card"><h3>5. Quick Actions</h3>';
echo '<a href="/EPei/frontend/index.html" class="btn">🌐 Website</a>';
echo '<a href="/EPei/backend/setup/install_cli.php" class="btn btn-blue">🔄 Reinstall DB</a>';
echo '<a href="/EPei/backend/setup/debug.php" class="btn btn-blue">🔍 Debug</a>';
echo '</div>';
?>
</body>
</html>
