<?php
/**
 * auto_install.php — Tự động tạo DB + tables + data nếu chưa có
 * Được gọi từ database.php khi phát hiện DB trống
 */
function autoInstall($conn) {
    // Tables
    $conn->query("CREATE TABLE IF NOT EXISTS `users` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        `email` VARCHAR(150) NOT NULL UNIQUE,
        `password` VARCHAR(255) NOT NULL,
        `phone` VARCHAR(20) DEFAULT NULL,
        `address` TEXT DEFAULT NULL,
        `role` ENUM('admin','customer') DEFAULT 'customer',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $conn->query("CREATE TABLE IF NOT EXISTS `products` (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $conn->query("CREATE TABLE IF NOT EXISTS `orders` (
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
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $conn->query("CREATE TABLE IF NOT EXISTS `order_items` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `order_id` VARCHAR(30) NOT NULL,
        `product_id` INT NOT NULL,
        `product_name` VARCHAR(200) NOT NULL,
        `price` DECIMAL(12,0) NOT NULL,
        `quantity` INT NOT NULL,
        `subtotal` DECIMAL(15,0) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $conn->query("CREATE TABLE IF NOT EXISTS `messages` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        `email` VARCHAR(150) NOT NULL,
        `organization` VARCHAR(150) DEFAULT NULL,
        `subject` VARCHAR(200) DEFAULT NULL,
        `content` TEXT NOT NULL,
        `is_read` TINYINT(1) DEFAULT 0,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $conn->query("CREATE TABLE IF NOT EXISTS `payment_codes` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `bank_name` VARCHAR(100) NOT NULL,
        `account_number` VARCHAR(50) NOT NULL,
        `account_name` VARCHAR(100) NOT NULL,
        `qr_content` TEXT DEFAULT NULL,
        `description` TEXT DEFAULT NULL,
        `active` TINYINT(1) DEFAULT 1,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Seed users nếu chưa có
    $uc = $conn->query("SELECT COUNT(*) c FROM users")->fetch_assoc()['c'];
    if ($uc == 0) {
        $ap = password_hash('admin123', PASSWORD_BCRYPT);
        $up = password_hash('user123',  PASSWORD_BCRYPT);
        $conn->query("INSERT INTO users (name,email,password,phone,address,role) VALUES
            ('Admin EPei','admin@epei.vn','$ap','0981175522','Hà Nội','admin'),
            ('Nguyễn Văn A','user@epei.vn','$up','0900000001','TP.HCM','customer')");
    }

    // Seed products nếu chưa có
    $pc = $conn->query("SELECT COUNT(*) c FROM products")->fetch_assoc()['c'];
    if ($pc == 0) {
        $products = [
            ['Giấy viết sinh thái A4','writing',45000,'ream (500 tờ)',95,'Bã mía 70% + Lá cây 30%','fas fa-file-alt','img-1','Bán chạy','Giấy viết cao cấp từ bã mía và lá cây.',200],
            ['Giấy in sinh thái A4','writing',52000,'ream (500 tờ)',94,'Bã mía 65% + Lá cây 35%','fas fa-print','img-5','','Giấy in chất lượng cao.',180],
            ['Giấy đóng gói Kraft','packaging',38000,'kg',98,'Bã mía 100%','fas fa-box','img-2','Mới','Giấy kraft bền vững.',150],
            ['Túi giấy cao cấp','packaging',8000,'chiếc',99,'Bã mía 100%','fas fa-shopping-bag','img-6','Eco 99%','Túi giấy kraft cao cấp.',500],
            ['Giấy nghệ thuật','art',65000,'tập 50 tờ',97,'Lá cây 60% + Bã mía 40%','fas fa-paint-brush','img-3','Cao cấp','Giấy nghệ thuật texture tự nhiên.',80],
            ['Sổ tay văn phòng xanh','office',55000,'cuốn',96,'Bã mía 80% + Lá cây 20%','fas fa-book','img-4','','Sổ tay bìa cứng tái chế.',120],
            ['Bộ văn phòng phẩm xanh','office',185000,'bộ',96,'Bã mía + Lá cây + Tái chế','fas fa-pencil-ruler','img-8','Combo','Bộ văn phòng phẩm hoàn chỉnh.',60],
            ['Giấy tái chế đa năng','recycle',28000,'kg',100,'Giấy tái chế 100%','fas fa-recycle','img-7','100% Tái chế','Giấy từ 100% nguyên liệu tái chế.',300],
            ['Thiệp sinh nhật sinh thái','card',25000,'chiếc',97,'Bã mía 80% + Hoa khô','fas fa-birthday-cake','img-card-1','Hot','Thiệp sinh nhật handcraft.',200],
            ['Thiệp cưới cao cấp EPei','card',45000,'chiếc',96,'Bã mía 70% + Lá cây 30%','fas fa-heart','img-card-2','Sang trọng','Thiệp cưới cao cấp.',150],
            ['Thiệp cảm ơn doanh nghiệp','card',15000,'chiếc',98,'Bã mía 90% + Lá cây 10%','fas fa-envelope-open-text','img-card-3','','Thiệp cảm ơn chuyên nghiệp.',300],
            ['Bộ thiệp 4 mùa EPei','card',85000,'bộ 8 chiếc',97,'Bã mía + Hoa lá','fas fa-leaf','img-card-4','Bộ sưu tập','Bộ 8 thiệp theo 4 mùa.',80],
            ['Bookmark lá cây ép khô','bookmark',12000,'chiếc',99,'Lá cây tự nhiên 100%','fas fa-bookmark','img-bm-1','Độc đáo','Bookmark từ lá cây thật.',400],
            ['Bookmark giấy bã mía','bookmark',8000,'chiếc',96,'Bã mía 100%','fas fa-bookmark','img-bm-2','','Bookmark giấy bã mía dày dặn.',500],
            ['Bộ bookmark nghệ thuật','bookmark',35000,'bộ',97,'Bã mía + Lá cây + Hoa khô','fas fa-bookmark','img-bm-3','Bộ sưu tập','Bộ 5 bookmark nghệ thuật.',200],
            ['Bookmark từ tính sinh thái','bookmark',18000,'chiếc',95,'Bã mía 85% + Lá cây 15%','fas fa-magnet','img-bm-4','Thực dụng','Bookmark từ tính tiện lợi.',250],
        ];
        $ps = $conn->prepare("INSERT INTO products (name,category,price,unit,eco_score,ingredient,icon,img_class,badge,description,stock) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
        foreach ($products as $p) {
            $n=$p[0];$c=$p[1];$pr=(int)$p[2];$u=$p[3];$e=(int)$p[4];
            $i=$p[5];$ic=$p[6];$im=$p[7];$b=$p[8];$d=$p[9];$s=(int)$p[10];
            $ps->bind_param('ssisssssssi',$n,$c,$pr,$u,$e,$i,$ic,$im,$b,$d,$s);
            $ps->execute();
        }
    }

    // Seed payment nếu chưa có
    $payc = $conn->query("SELECT COUNT(*) c FROM payment_codes")->fetch_assoc()['c'];
    if ($payc == 0) {
        $conn->query("INSERT INTO payment_codes (bank_name,account_number,account_name,qr_content,description) VALUES
            ('Vietcombank','1234567890','CONG TY EPEI',
             'https://img.vietqr.io/image/VCB-1234567890-compact2.png?amount=0&addInfo=EPei&accountName=CONG%20TY%20EPEI',
             'Nội dung: [Mã đơn hàng] - [Tên khách hàng]')");
    }
}
