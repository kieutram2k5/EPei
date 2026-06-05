'use strict';
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host:               'localhost',
  user:               'root',
  password:           '',
  database:           'epei_db',
  charset:            'utf8mb4',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
};

let pool = null;

async function getDB() {
  // Nếu pool chưa có thì tạo mới
  if (!pool) {
    pool = mysql.createPool(DB_CONFIG);
  }

  // Ping để kiểm tra còn kết nối không
  try {
    await pool.query('SELECT 1');
  } catch (pingErr) {
    // Pool bị chết — tạo lại
    console.log('⚡ Reconnecting to MySQL...');
    pool = mysql.createPool(DB_CONFIG);
  }

  return pool;
}

async function autoInstallCheck() {
  // Đảm bảo DB tồn tại trước
  const temp = await mysql.createConnection({
    host: DB_CONFIG.host,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
  });
  await temp.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await temp.end();

  const db = await getDB();

  const [rows] = await db.query("SHOW TABLES LIKE 'users'");
  if (rows.length === 0) {
    console.log('⚡ Auto installing database...');
    const autoInstall = require('./auto_install');
    await autoInstall(db);
    console.log('✅ Database installed');
  } else {
    console.log('✅ Database OK');
  }
}

module.exports = { getDB, autoInstallCheck };
