'use strict';
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT || 3306,
  charset: 'utf8mb4',

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

let pool = null;

async function getDB() {
  if (!pool) {
    pool = mysql.createPool(DB_CONFIG);
  }

  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.log('⚡ Reconnecting DB...');
    pool = mysql.createPool(DB_CONFIG);
  }

  return pool;
}

async function autoInstallCheck() {
  const temp = await mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    port: process.env.MYSQLPORT || 3306,
  });

  await temp.query(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.MYSQLDATABASE}\`
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