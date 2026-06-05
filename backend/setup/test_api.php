<?php
$r = file_get_contents('http://localhost/EPei/backend/api/products.php?action=list');
$d = json_decode($r, true);
echo "success: " . ($d['success'] ? 'true' : 'false') . "\n";
echo "count: " . count($d['data']) . "\n";
if (!empty($d['data'])) {
    $p = $d['data'][0];
    echo "first: {$p['name']} - {$p['price']}đ (type: " . gettype($p['price']) . ")\n";
    echo "img_class: {$p['img_class']}\n";
    echo "icon: {$p['icon']}\n";
}
