-- ============================================================
-- EPei Database (Supabase PostgreSQL version)
-- Copy toàn bộ và chạy trong Supabase SQL Editor
-- ============================================================

-- USERS
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('admin','customer')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCTS
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  price NUMERIC(12,0) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  eco_score INT DEFAULT 95,
  ingredient VARCHAR(200),
  icon VARCHAR(100),
  img_class VARCHAR(50),
  badge VARCHAR(50),
  description TEXT,
  stock INT DEFAULT 100,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ORDERS
CREATE TABLE orders (
  id VARCHAR(30) PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(150),
  customer_address TEXT NOT NULL,
  note TEXT,
  payment_method VARCHAR(50) DEFAULT 'cod',
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','failed')),
  order_status TEXT DEFAULT 'pending'
    CHECK (order_status IN ('pending','confirmed','shipping','done','cancelled')),
  total NUMERIC(15,0) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ORDER ITEMS
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(30) REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT,
  product_name VARCHAR(200) NOT NULL,
  price NUMERIC(12,0) NOT NULL,
  quantity INT NOT NULL,
  subtotal NUMERIC(15,0) NOT NULL
);

-- MESSAGES
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  organization VARCHAR(150),
  subject VARCHAR(200),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PAYMENT CODES
CREATE TABLE payment_codes (
  id SERIAL PRIMARY KEY,
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_name VARCHAR(100) NOT NULL,
  qr_content TEXT,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);