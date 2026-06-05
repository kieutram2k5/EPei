<?php
// Test tạo đơn hàng trực tiếp
require_once __DIR__ . '/../config/database.php';

$db = getDB();

// Giả lập dữ liệu đặt hàng
$orderId = 'EPei-TEST-' . date('His');
$name    = 'Test User';
$phone   = '0981175522';
$email   = 'test@epei.vn';
$address = '123 Test Street, HCM';
$note    = '';
$payment = 'cod';
$total   = 45000;

echo "=== Test Order Creation ===\n";
echo "Order ID: $orderId\n";

// Test INSERT không có user_id
$stmt = $db->prepare("INSERT INTO orders (id,customer_name,customer_phone,customer_email,customer_address,note,payment_method,total) VALUES (?,?,?,?,?,?,?,?)");
$stmt->bind_param('sssssssi', $orderId,$name,$phone,$email,$address,$note,$payment,$total);

if ($stmt->execute()) {
    echo "✅ Order created OK\n";
} else {
    echo "❌ Order error: " . $db->error . "\n";
}

// Test INSERT order_items
$itemStmt = $db->prepare("INSERT INTO order_items (order_id,product_id,product_name,price,quantity,subtotal) VALUES (?,?,?,?,?,?)");
$oid='EPei-TEST-'.$orderId; $pid=1; $pname='Giấy viết A4'; $pr=45000; $qty=1; $sub=45000;
$itemStmt->bind_param('sissii', $orderId,$pid,$pname,$pr,$qty,$sub);

if ($itemStmt->execute()) {
    echo "✅ Order item created OK\n";
} else {
    echo "❌ Order item error: " . $db->error . "\n";
}

// Cleanup
$db->query("DELETE FROM order_items WHERE order_id='$orderId'");
$db->query("DELETE FROM orders WHERE id='$orderId'");
echo "✅ Cleanup done\n";
echo "\n=== orders table structure ===\n";
$r = $db->query("DESCRIBE orders");
while($row = $r->fetch_assoc()) {
    echo "  {$row['Field']} | {$row['Type']} | {$row['Null']} | {$row['Default']}\n";
}
