'use strict';
/**
 * EPei - backend/config/database.js
 * MySQL2 connection pool với auto-install
 */
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host:     'localhost',
  user:     'root',
  password: '',
  database: 'epei_db',
  charset:  'utf8mb4',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
};

let pool = null;

async function getDB() {
  if (pool) return pool;

  // Tạo DB nếu chưa có
  const temp = await mysql.createConnection({
    host: DB_CONFIG.host, user: DB_CONFIG.user, password: DB_CONFIG.password,
  });
  await temp.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await temp.end();

  pool = mysql.createPool(DB_CONFIG);
  return pool;
}

async function autoInstallCheck() {
  const db = await getDB();
  const [rows] = await db.query("SHOW TABLES LIKE 'users'");
  if (rows.length === 0) {
    console.log('⚡ Auto installing database...');
    const autoInstall = require('./auto_install');
    await autoInstall(db);
    console.log('✅ Database ready');
  } else {
    console.log('✅ Database OK');
  }
}

module.exports = { getDB, autoInstallCheck };
