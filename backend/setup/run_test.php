<?php
$ch = curl_init('http://localhost/EPei/backend/setup/test_order2.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
echo curl_exec($ch);
