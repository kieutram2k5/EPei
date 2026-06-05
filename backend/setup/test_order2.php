<?php
// Test tạo đơn hàng qua API
$payload = json_encode([
    'customer_name'    => 'Nguyễn Test',
    'customer_phone'   => '0981175522',
    'customer_email'   => 'test@epei.vn',
    'customer_address' => '123 Đường Test, TP.HCM',
    'note'             => 'Test order',
    'payment_method'   => 'cod',
    'items'            => [
        ['id' => 1, 'qty' => 2],
        ['id' => 3, 'qty' => 1],
    ],
]);

$ch = curl_init('http://localhost/EPei/backend/api/orders.php?action=create');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP $code\n";
echo $resp . "\n";

$d = json_decode($resp, true);
if ($d && $d['success']) {
    echo "\n✅ Order created: {$d['order_id']} — Total: " . number_format($d['total']) . "đ\n";

    // Cleanup
    require_once __DIR__ . '/../config/database.php';
    $db = getDB();
    $oid = $db->real_escape_string($d['order_id']);
    $db->query("DELETE FROM order_items WHERE order_id='$oid'");
    $db->query("DELETE FROM orders WHERE id='$oid'");
    echo "✅ Cleanup done\n";
} else {
    echo "\n❌ Failed: " . ($d['message'] ?? 'unknown') . "\n";
}
