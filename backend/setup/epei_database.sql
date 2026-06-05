-- ============================================================
-- EPei Database — Import file này vào phpMyAdmin
-- Hướng dẫn: phpMyAdmin → Import → Chọn file này → Go
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Tạo database
CREATE DATABASE IF NOT EXISTS `epei_db`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `epei_db`;

-- ── Xóa bảng cũ nếu có ──────────────────────────────────────────────────────
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `payment_codes`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `users`;

-- ── Bảng users ───────────────────────────────────────────────────────────────
CREATE TABLE `users` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `name`       VARCHAR(100)  NOT NULL,
  `email`      VARCHAR(150)  NOT NULL UNIQUE,
  `password`   VARCHAR(255)  NOT NULL,
  `phone`      VARCHAR(20)   DEFAULT NULL,
  `address`    TEXT          DEFAULT NULL,
  `role`       ENUM('admin','customer') DEFAULT 'customer',
  `created_at` TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Bảng products ────────────────────────────────────────────────────────────
CREATE TABLE `products` (
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
  `created_at`  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Bảng orders ──────────────────────────────────────────────────────────────
CREATE TABLE `orders` (
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
  `created_at`       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Bảng order_items ─────────────────────────────────────────────────────────
CREATE TABLE `order_items` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `order_id`     VARCHAR(30)   NOT NULL,
  `product_id`   INT           NOT NULL,
  `product_name` VARCHAR(200)  NOT NULL,
  `price`        DECIMAL(12,0) NOT NULL,
  `quantity`     INT           NOT NULL,
  `subtotal`     DECIMAL(15,0) NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Bảng messages ────────────────────────────────────────────────────────────
CREATE TABLE `messages` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `name`         VARCHAR(100) NOT NULL,
  `email`        VARCHAR(150) NOT NULL,
  `organization` VARCHAR(150) DEFAULT NULL,
  `subject`      VARCHAR(200) DEFAULT NULL,
  `content`      TEXT         NOT NULL,
  `is_read`      TINYINT(1)   DEFAULT 0,
  `created_at`   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Bảng payment_codes ───────────────────────────────────────────────────────
CREATE TABLE `payment_codes` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `bank_name`      VARCHAR(100) NOT NULL,
  `account_number` VARCHAR(50)  NOT NULL,
  `account_name`   VARCHAR(100) NOT NULL,
  `qr_content`     TEXT         DEFAULT NULL,
  `description`    TEXT         DEFAULT NULL,
  `active`         TINYINT(1)   DEFAULT 1,
  `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- DỮ LIỆU MẪU
-- ============================================================

-- ── Users (password đã hash bcrypt) ─────────────────────────────────────────
-- admin123 → hash thật từ PHP password_hash()
-- user123  → hash thật từ PHP password_hash()
INSERT INTO `users` (`name`,`email`,`password`,`phone`,`address`,`role`) VALUES
('Admin EPei',   'admin@epei.vn', '$2y$10$QJ.UWOVs.91ZsJFz.3ZxMuwmAGOdEbCIHyP.nm8HXgiQBeKrur/CK', '0981175522', 'Hà Nội, Việt Nam', 'admin'),
('Nguyễn Văn A', 'user@epei.vn',  '$2y$10$X7k/MVUW3WBgQc.5UOSeqOdD6VJodsiNlw2HEiNSbKETVXrbtLJu6', '0900000001', 'TP.HCM, Việt Nam', 'customer');

-- ── Products ─────────────────────────────────────────────────────────────────
INSERT INTO `products` (`name`,`category`,`price`,`unit`,`eco_score`,`ingredient`,`icon`,`img_class`,`badge`,`description`,`stock`) VALUES

-- Giấy viết
('Giấy viết sinh thái A4',       'writing',  45000, 'ream (500 tờ)', 95, 'Bã mía 70% + Lá cây 30%',       'fas fa-file-alt',        'img-1', 'Bán chạy',
 'Giấy viết cao cấp từ bã mía và lá cây, độ trắng tự nhiên 92%, không tẩy trắng hóa học. Phù hợp cho văn phòng, học sinh, sinh viên.', 200),

('Giấy in sinh thái A4',         'writing',  52000, 'ream (500 tờ)', 94, 'Bã mía 65% + Lá cây 35%',       'fas fa-print',           'img-5', '',
 'Giấy in chất lượng cao, tương thích mọi loại máy in laser và inkjet. Độ trắng 90%, không bị kẹt giấy, thân thiện môi trường.', 180),

-- Đóng gói
('Giấy đóng gói Kraft sinh thái','packaging',38000, 'kg',            98, 'Bã mía 100%',                    'fas fa-box',             'img-2', 'Mới',
 'Giấy kraft bền vững từ 100% bã mía, độ bền kéo cao, chống ẩm tốt. Lý tưởng cho đóng gói thực phẩm và quà tặng.', 150),

('Túi giấy đóng gói cao cấp',    'packaging', 8000, 'chiếc',         99, 'Bã mía 100%',                    'fas fa-shopping-bag',    'img-6', 'Eco 99%',
 'Túi giấy kraft cao cấp, quai xách chắc chắn, in logo theo yêu cầu. Thay thế hoàn toàn túi nilon, phân hủy sinh học trong 3 tháng.', 500),

-- Nghệ thuật
('Giấy nghệ thuật sinh thái',    'art',       65000, 'tập 50 tờ',    97, 'Lá cây 60% + Bã mía 40%',       'fas fa-paint-brush',     'img-3', 'Cao cấp',
 'Giấy nghệ thuật texture tự nhiên, bề mặt mịn đặc biệt, phù hợp vẽ màu nước, in ấn nghệ thuật và thiết kế sáng tạo.', 80),

-- Văn phòng phẩm
('Sổ tay văn phòng xanh',        'office',    55000, 'cuốn',          96, 'Bã mía 80% + Lá cây 20%',       'fas fa-book',            'img-4', '',
 'Sổ tay bìa cứng tái chế, ruột giấy sinh thái 80 trang, kẻ dòng tinh tế. Thiết kế tối giản, sang trọng cho môi trường văn phòng hiện đại.', 120),

('Bộ văn phòng phẩm xanh',       'office',   185000, 'bộ',            96, 'Bã mía + Lá cây + Tái chế',     'fas fa-pencil-ruler',    'img-8', 'Combo',
 'Bộ văn phòng phẩm hoàn chỉnh gồm: sổ tay, bút chì tái chế, kẹp giấy sinh thái, phong bì kraft. Quà tặng doanh nghiệp ý nghĩa.', 60),

-- Tái chế
('Giấy tái chế đa năng',         'recycle',   28000, 'kg',           100, 'Giấy tái chế 100%',              'fas fa-recycle',         'img-7', '100% Tái chế',
 'Giấy từ 100% nguyên liệu tái chế, phù hợp in ấn nội bộ, ghi chú, bản nháp. Giải pháp kinh tế và bền vững nhất.', 300),

-- Thiệp
('Thiệp sinh nhật sinh thái',    'card',      25000, 'chiếc',         97, 'Bã mía 80% + Hoa khô tự nhiên', 'fas fa-birthday-cake',   'img-card-1', 'Hot',
 'Thiệp sinh nhật handcraft từ giấy bã mía, ép hoa khô tự nhiên, mỗi chiếc là một tác phẩm độc đáo. Kèm phong bì kraft sang trọng.', 200),

('Thiệp cưới cao cấp EPei',      'card',      45000, 'chiếc',         96, 'Bã mía 70% + Lá cây 30%',       'fas fa-heart',           'img-card-2', 'Sang trọng',
 'Thiệp cưới cao cấp từ giấy sinh thái, thiết kế tối giản hiện đại, in chữ nhũ vàng/bạc theo yêu cầu. Phân hủy sinh học 100%.', 150),

('Thiệp cảm ơn doanh nghiệp',   'card',      15000, 'chiếc',         98, 'Bã mía 90% + Lá cây 10%',       'fas fa-envelope-open-text','img-card-3', '',
 'Thiệp cảm ơn chuyên nghiệp cho doanh nghiệp, in logo và thông điệp theo yêu cầu. Đặt số lượng lớn giảm giá đặc biệt.', 300),

('Bộ thiệp 4 mùa EPei',          'card',      85000, 'bộ 8 chiếc',   97, 'Bã mía + Hoa lá tự nhiên',      'fas fa-leaf',            'img-card-4', 'Bộ sưu tập',
 'Bộ 8 thiệp theo 4 mùa xuân-hạ-thu-đông, mỗi chiếc ép hoa lá đặc trưng của mùa. Hộp đựng kraft sang trọng, quà tặng ý nghĩa.', 80),

-- Bookmark
('Bookmark lá cây ép khô',       'bookmark',  12000, 'chiếc',         99, 'Lá cây tự nhiên 100%',           'fas fa-bookmark',        'img-bm-1', 'Độc đáo',
 'Bookmark từ lá cây thật được ép khô và phủ bảo vệ sinh thái. Mỗi chiếc là một lá cây thật, không có hai chiếc giống nhau.', 400),

('Bookmark giấy bã mía in họa tiết','bookmark', 8000, 'chiếc',        96, 'Bã mía 100%',                    'fas fa-bookmark',        'img-bm-2', '',
 'Bookmark giấy bã mía dày dặn, in họa tiết thiên nhiên: hoa, lá, chim. Kích thước 5x15cm, có lỗ xỏ dây ruy băng.', 500),

('Bộ bookmark nghệ thuật 5 chiếc','bookmark', 35000, 'bộ',            97, 'Bã mía + Lá cây + Hoa khô',     'fas fa-bookmark',        'img-bm-3', 'Bộ sưu tập',
 'Bộ 5 bookmark nghệ thuật với 5 thiết kế khác nhau: rừng, biển, núi, đồng quê, thành phố xanh. Hộp đựng kraft mini.', 200),

('Bookmark từ tính sinh thái',   'bookmark',  18000, 'chiếc',         95, 'Bã mía 85% + Lá cây 15%',       'fas fa-magnet',          'img-bm-4', 'Thực dụng',
 'Bookmark từ tính tiện lợi, không cần kẹp vào trang sách. Thiết kế mỏng nhẹ, in hình động vật rừng dễ thương.', 250);

-- ── Payment ───────────────────────────────────────────────────────────────────
INSERT INTO `payment_codes` (`bank_name`,`account_number`,`account_name`,`qr_content`,`description`) VALUES
('Vietcombank', '1234567890', 'CONG TY EPEI',
 'https://img.vietqr.io/image/VCB-1234567890-compact2.png?amount=0&addInfo=EPei&accountName=CONG%20TY%20EPEI',
 'Nội dung chuyển khoản: [Mã đơn hàng] - [Tên khách hàng]. Ví dụ: EPei-20250101-ABC123 - Nguyen Van A');
