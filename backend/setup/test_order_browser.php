<?php
/**
 * Test đặt hàng qua browser
 * http://localhost/EPei/backend/setup/test_order_browser.php
 */
header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once __DIR__ . '/../config/database.php';

$db = getDB();

// Lấy sản phẩm đầu tiên
$p = $db->query("SELECT id, name, price FROM products WHERE active=1 LIMIT 1")->fetch_assoc();
if (!$p) {
    echo json_encode(['success' => false, 'message' => 'Không có sản phẩm trong DB']);
    exit;
}

$orderId = 'TEST-' . date('YmdHis');
$total   = (int)$p['price'];

$oid = $db->real_escape_string($orderId);
$nm  = 'Test User';
$ph  = '0981175522';
$em  = 'test@epei.vn';
$ad  = '123 Test Street HCM';
$nt  = '';
$pay = 'cod';

$sql = "INSERT INTO orders (id,customer_name,customer_phone,customer_email,customer_address,note,payment_method,total)
        VALUES ('$oid','$nm','$ph','$em','$ad','$nt','$pay',$total)";

if (!$db->query($sql)) {
    echo json_encode(['success' => false, 'step' => 'insert_order', 'error' => $db->error]);
    exit;
}

$pid = (int)$p['id'];
$pr  = $total;
$pn  = $db->real_escape_string($p['name']);
$db->query("INSERT INTO order_items (order_id,product_id,product_name,price,quantity,subtotal)
            VALUES ('$oid',$pid,'$pn',$pr,1,$pr)");

// Cleanup
$db->query("DELETE FROM order_items WHERE order_id='$oid'");
$db->query("DELETE FROM orders WHERE id='$oid'");

echo json_encode([
    'success'  => true,
    'message'  => 'Test đặt hàng thành công! API orders.php hoạt động bình thường.',
    'order_id' => $orderId,
    'product'  => $p['name'],
    'total'    => $total,
]);
