<?php
/**
 * install_cli.php — Chạy qua CLI: C:\xampp\php\php.exe install_cli.php
 * Hoặc qua browser: http://localhost/EPei/backend/setup/install_cli.php
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

$isCLI = (php_sapi_name() === 'cli');
$nl    = $isCLI ? "\n" : "<br>";

function out($msg, $isCLI) {
    echo ($isCLI ? $msg : htmlspecialchars($msg)) . ($isCLI ? "\n" : "<br>\n");
}

out("=== EPei Database Installer ===", $isCLI);

// Kết nối
$conn = @new mysqli('localhost', 'root', '');
if ($conn->connect_error) {
    out("❌ MySQL connection failed: " . $conn->connect_error, $isCLI);
    out("→ Start MySQL in XAMPP Control Panel", $isCLI);
    exit(1);
}
$conn->set_charset('utf8mb4');
out("✅ MySQL connected (v" . $conn->server_info . ")", $isCLI);

// Database
$conn->query("CREATE DATABASE IF NOT EXISTS `epei_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$conn->select_db('epei_db');
out("✅ Database epei_db ready", $isCLI);

// Drop tables
$conn->query("SET FOREIGN_KEY_CHECKS=0");
foreach (['order_items','orders','messages','payment_codes','products','users'] as $t) {
    $conn->query("DROP TABLE IF EXISTS `$t`");
}

// Create tables
$tables = [
"CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `role` ENUM('admin','customer') DEFAULT 'customer',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

"CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `price` DECIMAL(12,0) NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `eco_score` INT DEFAULT 95,
  `ingredient` VARCHAR(200) DEFAULT NULL,
  `icon` VARCHAR(100) DEFAULT NULL,
  `img_class` VARCHAR(50) DEFAULT NULL,
  `badge` VARCHAR(50) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `stock` INT DEFAULT 100,
  `active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

"CREATE TABLE `orders` (
  `id` VARCHAR(30) PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `customer_name` VARCHAR(100) NOT NULL,
  `customer_phone` VARCHAR(20) NOT NULL,
  `customer_email` VARCHAR(150) DEFAULT NULL,
  `customer_address` TEXT NOT NULL,
  `note` TEXT DEFAULT NULL,
  `payment_method` VARCHAR(50) DEFAULT 'cod',
  `payment_status` ENUM('pending','paid','failed') DEFAULT 'pending',
  `order_status` ENUM('pending','confirmed','shipping','done','cancelled') DEFAULT 'pending',
  `total` DECIMAL(15,0) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

"CREATE TABLE `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` VARCHAR(30) NOT NULL,
  `product_id` INT NOT NULL,
  `product_name` VARCHAR(200) NOT NULL,
  `price` DECIMAL(12,0) NOT NULL,
  `quantity` INT NOT NULL,
  `subtotal` DECIMAL(15,0) NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

"CREATE TABLE `messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `organization` VARCHAR(150) DEFAULT NULL,
  `subject` VARCHAR(200) DEFAULT NULL,
  `content` TEXT NOT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

"CREATE TABLE `payment_codes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bank_name` VARCHAR(100) NOT NULL,
  `account_number` VARCHAR(50) NOT NULL,
  `account_name` VARCHAR(100) NOT NULL,
  `qr_content` TEXT DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
];

foreach ($tables as $sql) {
    if (!$conn->query($sql)) {
        out("❌ Table error: " . $conn->error, $isCLI);
    }
}
$conn->query("SET FOREIGN_KEY_CHECKS=1");
out("✅ All 6 tables created", $isCLI);

// Users
$adminPw = password_hash('admin123', PASSWORD_BCRYPT);
$userPw  = password_hash('user123',  PASSWORD_BCRYPT);

$stmt = $conn->prepare("INSERT INTO `users` (name,email,password,phone,address,role) VALUES (?,?,?,?,?,?)");
$data = [
    ['Admin EPei',   'admin@epei.vn', $adminPw, '0981175522', 'Hà Nội, Việt Nam',  'admin'],
    ['Nguyễn Văn A', 'user@epei.vn',  $userPw,  '0900000001', 'TP.HCM, Việt Nam', 'customer'],
];
foreach ($data as $d) {
    $stmt->bind_param('ssssss', $d[0],$d[1],$d[2],$d[3],$d[4],$d[5]);
    $stmt->execute();
}
out("✅ 2 users created (admin + customer)", $isCLI);

// Verify
out("   admin123 verify: " . (password_verify('admin123',$adminPw) ? 'PASS' : 'FAIL'), $isCLI);
out("   user123  verify: " . (password_verify('user123', $userPw)  ? 'PASS' : 'FAIL'), $isCLI);

// Products
$products = [
  ['Giấy viết sinh thái A4','writing',45000,'ream (500 tờ)',95,'Bã mía 70% + Lá cây 30%','fas fa-file-alt','img-1','Bán chạy','Giấy viết cao cấp từ bã mía và lá cây, độ trắng tự nhiên 92%, không tẩy trắng hóa học.',200],
  ['Giấy in sinh thái A4','writing',52000,'ream (500 tờ)',94,'Bã mía 65% + Lá cây 35%','fas fa-print','img-5','','Giấy in chất lượng cao, tương thích mọi loại máy in laser và inkjet.',180],
  ['Giấy đóng gói Kraft sinh thái','packaging',38000,'kg',98,'Bã mía 100%','fas fa-box','img-2','Mới','Giấy kraft bền vững từ 100% bã mía, độ bền kéo cao, chống ẩm tốt.',150],
  ['Túi giấy đóng gói cao cấp','packaging',8000,'chiếc',99,'Bã mía 100%','fas fa-shopping-bag','img-6','Eco 99%','Túi giấy kraft cao cấp, quai xách chắc chắn, in logo theo yêu cầu.',500],
  ['Giấy nghệ thuật sinh thái','art',65000,'tập 50 tờ',97,'Lá cây 60% + Bã mía 40%','fas fa-paint-brush','img-3','Cao cấp','Giấy nghệ thuật texture tự nhiên, bề mặt mịn đặc biệt.',80],
  ['Sổ tay văn phòng xanh','office',55000,'cuốn',96,'Bã mía 80% + Lá cây 20%','fas fa-book','img-4','','Sổ tay bìa cứng tái chế, ruột giấy sinh thái 80 trang.',120],
  ['Bộ văn phòng phẩm xanh','office',185000,'bộ',96,'Bã mía + Lá cây + Tái chế','fas fa-pencil-ruler','img-8','Combo','Bộ văn phòng phẩm hoàn chỉnh: sổ tay, bút chì tái chế, kẹp giấy sinh thái.',60],
  ['Giấy tái chế đa năng','recycle',28000,'kg',100,'Giấy tái chế 100%','fas fa-recycle','img-7','100% Tái chế','Giấy từ 100% nguyên liệu tái chế, phù hợp in ấn nội bộ.',300],
  ['Thiệp sinh nhật sinh thái','card',25000,'chiếc',97,'Bã mía 80% + Hoa khô tự nhiên','fas fa-birthday-cake','img-card-1','Hot','Thiệp sinh nhật handcraft từ giấy bã mía, ép hoa khô tự nhiên.',200],
  ['Thiệp cưới cao cấp EPei','card',45000,'chiếc',96,'Bã mía 70% + Lá cây 30%','fas fa-heart','img-card-2','Sang trọng','Thiệp cưới cao cấp từ giấy sinh thái, thiết kế tối giản hiện đại.',150],
  ['Thiệp cảm ơn doanh nghiệp','card',15000,'chiếc',98,'Bã mía 90% + Lá cây 10%','fas fa-envelope-open-text','img-card-3','','Thiệp cảm ơn chuyên nghiệp cho doanh nghiệp.',300],
  ['Bộ thiệp 4 mùa EPei','card',85000,'bộ 8 chiếc',97,'Bã mía + Hoa lá tự nhiên','fas fa-leaf','img-card-4','Bộ sưu tập','Bộ 8 thiệp theo 4 mùa xuân-hạ-thu-đông.',80],
  ['Bookmark lá cây ép khô','bookmark',12000,'chiếc',99,'Lá cây tự nhiên 100%','fas fa-bookmark','img-bm-1','Độc đáo','Bookmark từ lá cây thật được ép khô và phủ bảo vệ sinh thái.',400],
  ['Bookmark giấy bã mía in họa tiết','bookmark',8000,'chiếc',96,'Bã mía 100%','fas fa-bookmark','img-bm-2','','Bookmark giấy bã mía dày dặn, in họa tiết thiên nhiên.',500],
  ['Bộ bookmark nghệ thuật 5 chiếc','bookmark',35000,'bộ',97,'Bã mía + Lá cây + Hoa khô','fas fa-bookmark','img-bm-3','Bộ sưu tập','Bộ 5 bookmark nghệ thuật với 5 thiết kế khác nhau.',200],
  ['Bookmark từ tính sinh thái','bookmark',18000,'chiếc',95,'Bã mía 85% + Lá cây 15%','fas fa-magnet','img-bm-4','Thực dụng','Bookmark từ tính tiện lợi, không cần kẹp vào trang sách.',250],
];

$ps = $conn->prepare("INSERT INTO `products` (name,category,price,unit,eco_score,ingredient,icon,img_class,badge,description,stock) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
$ok = 0;
foreach ($products as $p) {
    $n=$p[0];$c=$p[1];$pr=(int)$p[2];$u=$p[3];$e=(int)$p[4];
    $i=$p[5];$ic=$p[6];$im=$p[7];$b=$p[8];$d=$p[9];$s=(int)$p[10];
    $ps->bind_param('ssisssssssi',$n,$c,$pr,$u,$e,$i,$ic,$im,$b,$d,$s);
    if ($ps->execute()) $ok++;
    else out("  ❌ Product error '{$n}': ".$conn->error, $isCLI);
}
out("✅ $ok/" . count($products) . " products inserted", $isCLI);

// Payment
$conn->query("INSERT INTO `payment_codes` (bank_name,account_number,account_name,qr_content,description) VALUES
  ('Vietcombank','1234567890','CONG TY EPEI',
   'https://img.vietqr.io/image/VCB-1234567890-compact2.png?amount=0&addInfo=EPei&accountName=CONG%20TY%20EPEI',
   'Nội dung chuyển khoản: [Mã đơn hàng] - [Tên khách hàng]')");
out("✅ Payment QR info inserted", $isCLI);

$conn->close();
out("", $isCLI);
out("=== DONE! ===", $isCLI);
out("Login: admin@epei.vn / admin123", $isCLI);
out("Login: user@epei.vn  / user123", $isCLI);
out("Website: http://localhost/EPei/frontend/index.html", $isCLI);

if (!$isCLI) {
    echo '<br><a href="/EPei/frontend/index.html" style="background:#4A7C59;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-family:sans-serif;font-weight:600">→ Vào trang web EPei</a>';
    echo '<br><br><a href="debug.php" style="background:#2980b9;color:#fff;padding:10px 20px;border-radius:10px;text-decoration:none;font-family:sans-serif">🔍 Chạy Debug</a>';
}
