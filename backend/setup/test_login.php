<?php
// Test login trực tiếp — không qua HTTP
require_once __DIR__ . '/../config/database.php';

$email    = 'admin@epei.vn';
$password = 'admin123';

$db   = getDB();
$stmt = $db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
$stmt->bind_param('s', $email);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

if (!$user) {
    echo "❌ User not found in database\n";
    exit;
}

echo "✅ User found: {$user['name']} ({$user['role']})\n";
echo "   Stored hash: " . substr($user['password'], 0, 30) . "...\n";

$verify = password_verify($password, $user['password']);
echo "   password_verify('admin123', hash): " . ($verify ? "✅ PASS" : "❌ FAIL") . "\n";

// Test user123
$stmt2 = $db->prepare("SELECT * FROM users WHERE email = 'user@epei.vn' LIMIT 1");
$stmt2->execute();
$user2 = $stmt2->get_result()->fetch_assoc();
if ($user2) {
    $v2 = password_verify('user123', $user2['password']);
    echo "   user@epei.vn / user123: " . ($v2 ? "✅ PASS" : "❌ FAIL") . "\n";
}

echo "\nAll users in DB:\n";
$res = $db->query("SELECT id, name, email, role FROM users");
while ($r = $res->fetch_assoc()) {
    echo "  [{$r['id']}] {$r['name']} | {$r['email']} | {$r['role']}\n";
}
