'use strict';
/**
 * EPei - auto_install.js
 * Tạo bảng + seed data tự động
 */
const bcrypt = require('bcryptjs');

module.exports = async function autoInstall(db) {
  // ── Tables ──────────────────────────────────────────────────────────────────
  await db.query(`CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    phone      VARCHAR(20),
    address    TEXT,
    role       ENUM('admin','customer') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await db.query(`CREATE TABLE IF NOT EXISTS products (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    category    VARCHAR(50)  NOT NULL,
    price       DECIMAL(12,0) NOT NULL,
    unit        VARCHAR(50)  NOT NULL,
    eco_score   INT DEFAULT 95,
    ingredient  VARCHAR(200),
    icon        VARCHAR(100),
    img_class   VARCHAR(50),
    badge       VARCHAR(50),
    description TEXT,
    stock       INT DEFAULT 100,
    active      TINYINT(1) DEFAULT 1,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await db.query(`CREATE TABLE IF NOT EXISTS orders (
    id               VARCHAR(30) PRIMARY KEY,
    user_id          INT,
    customer_name    VARCHAR(100) NOT NULL,
    customer_phone   VARCHAR(20)  NOT NULL,
    customer_email   VARCHAR(150),
    customer_address TEXT NOT NULL,
    note             TEXT,
    payment_method   VARCHAR(50) DEFAULT 'cod',
    payment_status   ENUM('pending','paid','failed') DEFAULT 'pending',
    order_status     ENUM('pending','confirmed','shipping','done','cancelled') DEFAULT 'pending',
    total            DECIMAL(15,0) NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await db.query(`CREATE TABLE IF NOT EXISTS order_items (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    order_id     VARCHAR(30) NOT NULL,
    product_id   INT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    price        DECIMAL(12,0) NOT NULL,
    quantity     INT NOT NULL,
    subtotal     DECIMAL(15,0) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await db.query(`CREATE TABLE IF NOT EXISTS messages (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    email        VARCHAR(150) NOT NULL,
    organization VARCHAR(150),
    subject      VARCHAR(200),
    content      TEXT NOT NULL,
    is_read      TINYINT(1) DEFAULT 0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await db.query(`CREATE TABLE IF NOT EXISTS payment_codes (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    bank_name      VARCHAR(100) NOT NULL,
    account_number VARCHAR(50)  NOT NULL,
    account_name   VARCHAR(100) NOT NULL,
    qr_content     TEXT,
    description    TEXT,
    active         TINYINT(1) DEFAULT 1,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  // ── Seed users ───────────────────────────────────────────────────────────────
  const [[uc]] = await db.query('SELECT COUNT(*) AS c FROM users');
  if (uc.c === 0) {
    const adminPw = await bcrypt.hash('admin123', 10);
    const userPw  = await bcrypt.hash('user123',  10);
    await db.query(
      `INSERT INTO users (name,email,password,phone,address,role) VALUES
       ('Admin EPei','admin@epei.vn',?,  '0981175522','Hà Nội','admin'),
       ('Nguyễn Văn A','user@epei.vn',?,'0900000001','TP.HCM','customer')`,
      [adminPw, userPw]
    );
  }

  // ── Seed products ─────────────────────────────────────────────────────────────
  const [[pc]] = await db.query('SELECT COUNT(*) AS c FROM products');
  if (pc.c === 0) {
    const products = [
      ['Giấy viết sinh thái A4','writing',45000,'ream (500 tờ)',95,'Bã mía 70% + Lá cây 30%','fas fa-file-alt','img-1','Bán chạy','Giấy viết cao cấp từ bã mía và lá cây, độ trắng tự nhiên 92%.',200],
      ['Giấy in sinh thái A4','writing',52000,'ream (500 tờ)',94,'Bã mía 65% + Lá cây 35%','fas fa-print','img-5','','Giấy in chất lượng cao, tương thích mọi loại máy in.',180],
      ['Giấy đóng gói Kraft','packaging',38000,'kg',98,'Bã mía 100%','fas fa-box','img-2','Mới','Giấy kraft bền vững từ 100% bã mía.',150],
      ['Túi giấy cao cấp','packaging',8000,'chiếc',99,'Bã mía 100%','fas fa-shopping-bag','img-6','Eco 99%','Túi giấy kraft cao cấp, in logo theo yêu cầu.',500],
      ['Giấy nghệ thuật sinh thái','art',65000,'tập 50 tờ',97,'Lá cây 60% + Bã mía 40%','fas fa-paint-brush','img-3','Cao cấp','Giấy nghệ thuật texture tự nhiên.',80],
      ['Sổ tay văn phòng xanh','office',55000,'cuốn',96,'Bã mía 80% + Lá cây 20%','fas fa-book','img-4','','Sổ tay bìa cứng tái chế, 80 trang.',120],
      ['Bộ văn phòng phẩm xanh','office',185000,'bộ',96,'Bã mía + Lá cây + Tái chế','fas fa-pencil-ruler','img-8','Combo','Bộ văn phòng phẩm hoàn chỉnh.',60],
      ['Giấy tái chế đa năng','recycle',28000,'kg',100,'Giấy tái chế 100%','fas fa-recycle','img-7','100% Tái chế','Giấy từ 100% nguyên liệu tái chế.',300],
      ['Thiệp sinh nhật sinh thái','card',25000,'chiếc',97,'Bã mía 80% + Hoa khô','fas fa-birthday-cake','img-card-1','Hot','Thiệp sinh nhật handcraft từ giấy bã mía.',200],
      ['Thiệp cưới cao cấp EPei','card',45000,'chiếc',96,'Bã mía 70% + Lá cây 30%','fas fa-heart','img-card-2','Sang trọng','Thiệp cưới cao cấp từ giấy sinh thái.',150],
      ['Thiệp cảm ơn doanh nghiệp','card',15000,'chiếc',98,'Bã mía 90% + Lá cây 10%','fas fa-envelope-open-text','img-card-3','','Thiệp cảm ơn chuyên nghiệp.',300],
      ['Bộ thiệp 4 mùa EPei','card',85000,'bộ 8 chiếc',97,'Bã mía + Hoa lá','fas fa-leaf','img-card-4','Bộ sưu tập','Bộ 8 thiệp theo 4 mùa.',80],
      ['Bookmark lá cây ép khô','bookmark',12000,'chiếc',99,'Lá cây tự nhiên 100%','fas fa-bookmark','img-bm-1','Độc đáo','Bookmark từ lá cây thật ép khô.',400],
      ['Bookmark giấy bã mía','bookmark',8000,'chiếc',96,'Bã mía 100%','fas fa-bookmark','img-bm-2','','Bookmark giấy bã mía in họa tiết.',500],
      ['Bộ bookmark nghệ thuật','bookmark',35000,'bộ',97,'Bã mía + Lá cây + Hoa','fas fa-bookmark','img-bm-3','Bộ sưu tập','Bộ 5 bookmark nghệ thuật.',200],
      ['Bookmark từ tính sinh thái','bookmark',18000,'chiếc',95,'Bã mía 85% + Lá cây 15%','fas fa-magnet','img-bm-4','Thực dụng','Bookmark từ tính tiện lợi.',250],
    ];
    for (const p of products) {
      await db.query(
        `INSERT INTO products (name,category,price,unit,eco_score,ingredient,icon,img_class,badge,description,stock)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`, p
      );
    }
  }

  // ── Seed payment ──────────────────────────────────────────────────────────────
  const [[payc]] = await db.query('SELECT COUNT(*) AS c FROM payment_codes');
  if (payc.c === 0) {
    await db.query(
      `INSERT INTO payment_codes (bank_name,account_number,account_name,qr_content,description)
       VALUES (?,?,?,?,?)`,
      ['Vietcombank','1234567890','CONG TY EPEI',
       'https://img.vietqr.io/image/VCB-1234567890-compact2.png?amount=0&addInfo=EPei&accountName=CONG%20TY%20EPEI',
       'Nội dung: [Mã đơn hàng] - [Tên khách hàng]']
    );
  }
};
