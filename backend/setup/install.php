<?php
/**
 * EPei — install.php
 * Truy cập: http://localhost/EPei/backend/setup/install.php
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

$errors = [];
$success = [];

// ── Kết nối MySQL ────────────────────────────────────────────────────────────
$conn = @new mysqli('localhost', 'root', '');
if ($conn->connect_error) {
    die('<h2 style="color:red;font-family:sans-serif">❌ Không kết nối được MySQL: '
        . $conn->connect_error
        . '<br><br>→ Hãy bật MySQL trong XAMPP Control Panel</h2>');
}
$conn->set_charset('utf8mb4');

// ── Tạo database ─────────────────────────────────────────────────────────────
$conn->query("CREATE DATABASE IF NOT EXISTS `epei_db`
              CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$conn->select_db('epei_db');
$success[] = 'Database epei_db đã sẵn sàng';

// ── Drop & Create tables ─────────────────────────────────────────────────────
$conn->query("SET FOREIGN_KEY_CHECKS=0");

$conn->query("DROP TABLE IF EXISTS `order_items`");
$conn->query("DROP TABLE IF EXISTS `orders`");
$conn->query("DROP TABLE IF EXISTS `messages`");
$conn->query("DROP TABLE IF EXISTS `payment_codes`");
$conn->query("DROP TABLE IF EXISTS `products`");
$conn->query("DROP TABLE IF EXISTS `users`");

$conn->query("CREATE TABLE `users` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `name`       VARCHAR(100)  NOT NULL,
  `email`      VARCHAR(150)  NOT NULL UNIQUE,
  `password`   VARCHAR(255)  NOT NULL,
  `phone`      VARCHAR(20)   DEFAULT NULL,
  `address`    TEXT          DEFAULT NULL,
  `role`       ENUM('admin','customer') DEFAULT 'customer',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$conn->query("CREATE TABLE `products` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `name`        VARCHAR(200)  NOT NULL,
  `category`    VARCHAR(50)   NOT NULL,
  `price`       DECIMAL(12,0) NOT NULL,
  `unit`        VARCHAR(50)   NOT NULL,
  `eco_score`   INT           DEFAULT 95,
  `ingredient`  VARCHAR(200)  DEFAULT NULL,
  `icon`        VARCHAR(100)  DEFAULT NULL,
  `img_class`   VARCHAR(50)   DEFAULT NULL,
  `badge`       VARCHAR(50)   DEFAULT NULL,
  `description` TEXT          DEFAULT NULL,
  `stock`       INT           DEFAULT 100,
  `active`      TINYINT(1)    DEFAULT 1,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$conn->query("CREATE TABLE `orders` (
  `id`               VARCHAR(30)   PRIMARY KEY,
  `user_id`          INT           DEFAULT NULL,
  `customer_name`    VARCHAR(100)  NOT NULL,
  `customer_phone`   VARCHAR(20)   NOT NULL,
  `customer_email`   VARCHAR(150)  DEFAULT NULL,
  `customer_address` TEXT          NOT NULL,
  `note`             TEXT          DEFAULT NULL,
  `payment_method`   VARCHAR(50)   DEFAULT 'cod',
  `payment_status`   ENUM('pending','paid','failed') DEFAULT 'pending',
  `order_status`     ENUM('pending','confirmed','shipping','done','cancelled') DEFAULT 'pending',
  `total`            DECIMAL(15,0) NOT NULL,
  `created_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$conn->query("CREATE TABLE `order_items` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `order_id`     VARCHAR(30)   NOT NULL,
  `product_id`   INT           NOT NULL,
  `product_name` VARCHAR(200)  NOT NULL,
  `price`        DECIMAL(12,0) NOT NULL,
  `quantity`     INT           NOT NULL,
  `subtotal`     DECIMAL(15,0) NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$conn->query("CREATE TABLE `messages` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `name`         VARCHAR(100) NOT NULL,
  `email`        VARCHAR(150) NOT NULL,
  `organization` VARCHAR(150) DEFAULT NULL,
  `subject`      VARCHAR(200) DEFAULT NULL,
  `content`      TEXT         NOT NULL,
  `is_read`      TINYINT(1)   DEFAULT 0,
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$conn->query("CREATE TABLE `payment_codes` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `bank_name`      VARCHAR(100) NOT NULL,
  `account_number` VARCHAR(50)  NOT NULL,
  `account_name`   VARCHAR(100) NOT NULL,
  `qr_content`     TEXT         DEFAULT NULL,
  `description`    TEXT         DEFAULT NULL,
  `active`         TINYINT(1)   DEFAULT 1,
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$conn->query("SET FOREIGN_KEY_CHECKS=1");
$success[] = 'Tất cả bảng đã được tạo (6 bảng)';

// ── Insert users ─────────────────────────────────────────────────────────────
$adminPw = password_hash('admin123', PASSWORD_BCRYPT);
$userPw  = password_hash('user123',  PASSWORD_BCRYPT);

$stmt = $conn->prepare("INSERT INTO `users` (name,email,password,phone,address,role) VALUES (?,?,?,?,?,?)");

$n='Admin EPei'; $e='admin@epei.vn'; $ph='0981175522'; $ad='Hà Nội, Việt Nam'; $r='admin';
$stmt->bind_param('ssssss', $n, $e, $adminPw, $ph, $ad, $r);
$stmt->execute();

$n='Nguyễn Văn A'; $e='user@epei.vn'; $ph='0900000001'; $ad='TP.HCM, Việt Nam'; $r='customer';
$stmt->bind_param('ssssss', $n, $e, $userPw, $ph, $ad, $r);
$stmt->execute();
$success[] = '2 tài khoản mẫu đã tạo (admin + customer)';

// ── Insert products ───────────────────────────────────────────────────────────
$products = [
  ['Giấy viết sinh thái A4','writing',45000,'ream (500 tờ)',95,'Bã mía 70% + Lá cây 30%','fas fa-file-alt','img-1','Bán chạy','Giấy viết cao cấp từ bã mía và lá cây, độ trắng tự nhiên 92%, không tẩy trắng hóa học. Phù hợp cho văn phòng, học sinh, sinh viên.',200],
  ['Giấy in sinh thái A4','writing',52000,'ream (500 tờ)',94,'Bã mía 65% + Lá cây 35%','fas fa-print','img-5','','Giấy in chất lượng cao, tương thích mọi loại máy in laser và inkjet. Độ trắng 90%, không bị kẹt giấy, thân thiện môi trường.',180],
  ['Giấy đóng gói Kraft sinh thái','packaging',38000,'kg',98,'Bã mía 100%','fas fa-box','img-2','Mới','Giấy kraft bền vững từ 100% bã mía, độ bền kéo cao, chống ẩm tốt. Lý tưởng cho đóng gói thực phẩm và quà tặng.',150],
  ['Túi giấy đóng gói cao cấp','packaging',8000,'chiếc',99,'Bã mía 100%','fas fa-shopping-bag','img-6','Eco 99%','Túi giấy kraft cao cấp, quai xách chắc chắn, in logo theo yêu cầu. Thay thế hoàn toàn túi nilon, phân hủy sinh học trong 3 tháng.',500],
  ['Giấy nghệ thuật sinh thái','art',65000,'tập 50 tờ',97,'Lá cây 60% + Bã mía 40%','fas fa-paint-brush','img-3','Cao cấp','Giấy nghệ thuật texture tự nhiên, bề mặt mịn đặc biệt, phù hợp vẽ màu nước, in ấn nghệ thuật và thiết kế sáng tạo.',80],
  ['Sổ tay văn phòng xanh','office',55000,'cuốn',96,'Bã mía 80% + Lá cây 20%','fas fa-book','img-4','','Sổ tay bìa cứng tái chế, ruột giấy sinh thái 80 trang, kẻ dòng tinh tế. Thiết kế tối giản, sang trọng cho môi trường văn phòng hiện đại.',120],
  ['Bộ văn phòng phẩm xanh','office',185000,'bộ',96,'Bã mía + Lá cây + Tái chế','fas fa-pencil-ruler','img-8','Combo','Bộ văn phòng phẩm hoàn chỉnh gồm: sổ tay, bút chì tái chế, kẹp giấy sinh thái, phong bì kraft. Quà tặng doanh nghiệp ý nghĩa.',60],
  ['Giấy tái chế đa năng','recycle',28000,'kg',100,'Giấy tái chế 100%','fas fa-recycle','img-7','100% Tái chế','Giấy từ 100% nguyên liệu tái chế, phù hợp in ấn nội bộ, ghi chú, bản nháp. Giải pháp kinh tế và bền vững nhất.',300],
  // Thiệp
  ['Thiệp sinh nhật sinh thái','card',25000,'chiếc',97,'Bã mía 80% + Hoa khô tự nhiên','fas fa-birthday-cake','img-card-1','Hot','Thiệp sinh nhật handcraft từ giấy bã mía, ép hoa khô tự nhiên, mỗi chiếc là một tác phẩm độc đáo. Kèm phong bì kraft sang trọng.',200],
  ['Thiệp cưới cao cấp EPei','card',45000,'chiếc',96,'Bã mía 70% + Lá cây 30%','fas fa-heart','img-card-2','Sang trọng','Thiệp cưới cao cấp từ giấy sinh thái, thiết kế tối giản hiện đại, in chữ nhũ vàng/bạc theo yêu cầu. Phân hủy sinh học 100%.',150],
  ['Thiệp cảm ơn doanh nghiệp','card',15000,'chiếc',98,'Bã mía 90% + Lá cây 10%','fas fa-envelope-open-text','img-card-3','','Thiệp cảm ơn chuyên nghiệp cho doanh nghiệp, in logo và thông điệp theo yêu cầu. Đặt số lượng lớn giảm giá đặc biệt.',300],
  ['Bộ thiệp 4 mùa EPei','card',85000,'bộ 8 chiếc',97,'Bã mía + Hoa lá tự nhiên','fas fa-leaf','img-card-4','Bộ sưu tập','Bộ 8 thiệp theo 4 mùa xuân-hạ-thu-đông, mỗi chiếc ép hoa lá đặc trưng của mùa. Hộp đựng kraft sang trọng, quà tặng ý nghĩa.',80],
  // Bookmark
  ['Bookmark lá cây ép khô','bookmark',12000,'chiếc',99,'Lá cây tự nhiên 100%','fas fa-bookmark','img-bm-1','Độc đáo','Bookmark từ lá cây thật được ép khô và phủ bảo vệ sinh thái. Mỗi chiếc là một lá cây thật, không có hai chiếc giống nhau.',400],
  ['Bookmark giấy bã mía in họa tiết','bookmark',8000,'chiếc',96,'Bã mía 100%','fas fa-bookmark','img-bm-2','','Bookmark giấy bã mía dày dặn, in họa tiết thiên nhiên: hoa, lá, chim. Kích thước 5x15cm, có lỗ xỏ dây ruy băng.',500],
  ['Bộ bookmark nghệ thuật 5 chiếc','bookmark',35000,'bộ',97,'Bã mía + Lá cây + Hoa khô','fas fa-bookmark','img-bm-3','Bộ sưu tập','Bộ 5 bookmark nghệ thuật với 5 thiết kế khác nhau: rừng, biển, núi, đồng quê, thành phố xanh. Hộp đựng kraft mini.',200],
  ['Bookmark từ tính sinh thái','bookmark',18000,'chiếc',95,'Bã mía 85% + Lá cây 15%','fas fa-magnet','img-bm-4','Thực dụng','Bookmark từ tính tiện lợi, không cần kẹp vào trang sách. Thiết kế mỏng nhẹ, in hình động vật rừng dễ thương.',250],
];

$ps = $conn->prepare("INSERT INTO `products` (name,category,price,unit,eco_score,ingredient,icon,img_class,badge,description,stock) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
foreach ($products as $p) {
    $name=$p[0]; $cat=$p[1]; $price=(int)$p[2]; $unit=$p[3]; $eco=(int)$p[4];
    $ing=$p[5]; $icon=$p[6]; $img=$p[7]; $badge=$p[8]; $desc=$p[9]; $stock=(int)$p[10];
    $ps->bind_param('ssisssssssi', $name,$cat,$price,$unit,$eco,$ing,$icon,$img,$badge,$desc,$stock);
    if (!$ps->execute()) $errors[] = "Lỗi sản phẩm '{$name}': ".$conn->error;
}
$success[] = count($products).' sản phẩm đã được thêm (giấy, thiệp, bookmark)';

// ── Payment ───────────────────────────────────────────────────────────────────
$conn->query("INSERT INTO `payment_codes` (bank_name,account_number,account_name,qr_content,description) VALUES
  ('Vietcombank','1234567890','CONG TY EPEI',
   'https://img.vietqr.io/image/VCB-1234567890-compact2.png?amount=0&addInfo=EPei&accountName=CONG%20TY%20EPEI',
   'Nội dung chuyển khoản: [Mã đơn hàng] - [Tên khách hàng]')");
$success[] = 'Thông tin thanh toán QR đã cài đặt';

$conn->close();

// ── Verify passwords ──────────────────────────────────────────────────────────
$verifyAdmin = password_verify('admin123', $adminPw);
$verifyUser  = password_verify('user123',  $userPw);
?>
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>EPei – Cài đặt</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#0a160a,#1e3a1e);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
  .card{background:#fff;border-radius:20px;padding:40px;max-width:600px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3)}
  .logo{display:flex;align-items:center;gap:10px;margin-bottom:24px}
  .logo-icon{width:44px;height:44px;background:linear-gradient(135deg,#A3B18A,#4A7C59);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:#fff}
  .logo span{font-size:1.6rem;font-weight:700;color:#3A3A3A}
  h2{color:#4A7C59;margin-bottom:6px;font-size:1.4rem}
  .subtitle{color:#6B705C;font-size:.9rem;margin-bottom:24px}
  .check-list{list-style:none;margin-bottom:24px}
  .check-list li{padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:.9rem;display:flex;align-items:center;gap:8px;color:#3A3A3A}
  .check-list li:last-child{border:none}
  .ok{color:#27ae60}
  .err{color:#c0392b}
  .accounts{background:#f8fdf8;border-radius:12px;padding:16px;margin-bottom:24px;border:1px solid rgba(74,124,89,.2)}
  .accounts h4{color:#4A7C59;margin-bottom:12px;font-size:.9rem;text-transform:uppercase;letter-spacing:.05em}
  .account-row{display:flex;justify-content:space-between;padding:6px 0;font-size:.88rem;border-bottom:1px solid rgba(163,177,138,.2)}
  .account-row:last-child{border:none}
  .account-row span:first-child{color:#6B705C}
  .account-row strong{color:#3A3A3A}
  .btn{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#4A7C59,#6B705C);color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:.95rem;transition:all .2s}
  .btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(74,124,89,.4)}
  .btn-secondary{background:linear-gradient(135deg,#2980b9,#1a5276);margin-left:10px}
  .warn{background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:12px 16px;font-size:.82rem;color:#795548;margin-top:16px;display:flex;align-items:flex-start;gap:8px}
  .error-box{background:#fdf0f0;border:1px solid #f5c6cb;border-radius:10px;padding:12px 16px;font-size:.82rem;color:#c0392b;margin-bottom:16px}
  .pw-verify{font-size:.78rem;color:#27ae60;margin-left:4px}
</style>
</head>
<body>
<div class="card">
  <div class="logo">
    <div class="logo-icon">🌿</div>
    <span>EPei</span>
  </div>

  <?php if (!empty($errors)): ?>
  <div class="error-box">
    <strong>⚠ Có lỗi xảy ra:</strong><br>
    <?= implode('<br>', array_map('htmlspecialchars', $errors)) ?>
  </div>
  <?php endif; ?>

  <h2>✅ Cài đặt hoàn tất!</h2>
  <p class="subtitle">Database EPei đã được tạo thành công với đầy đủ dữ liệu.</p>

  <ul class="check-list">
    <?php foreach ($success as $s): ?>
    <li><span class="ok">✓</span> <?= htmlspecialchars($s) ?></li>
    <?php endforeach; ?>
    <li>
      <span class="ok">✓</span>
      Password hash kiểm tra:
      <span class="pw-verify"><?= $verifyAdmin ? '✅ admin123 OK' : '❌ admin123 FAIL' ?></span>
      <span class="pw-verify"><?= $verifyUser  ? '✅ user123 OK'  : '❌ user123 FAIL'  ?></span>
    </li>
  </ul>

  <div class="accounts">
    <h4>🔑 Tài khoản đăng nhập</h4>
    <div class="account-row"><span>Admin</span><strong>admin@epei.vn / admin123</strong></div>
    <div class="account-row"><span>Khách hàng</span><strong>user@epei.vn / user123</strong></div>
  </div>

  <div>
    <a href="/EPei/frontend/index.html" class="btn">🌐 Vào trang web EPei</a>
    <a href="debug.php" class="btn btn-secondary">🔍 Chạy Debug</a>
  </div>

  <div class="warn">
    ⚠️ <span>Hãy xóa hoặc đổi tên file <code>install.php</code> sau khi cài đặt xong để bảo mật hệ thống.</span>
  </div>
</div>
</body>
</html>
