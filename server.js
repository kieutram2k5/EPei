'use strict';
/**
 * EPei - server.js
 * Local: node server.js → http://localhost:3000
 * Deploy: Render.com / Railway / bất kỳ Node host nào
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin',      origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods',     'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers',     'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Static frontend ───────────────────────────────────────────────────────────
const frontendDir = path.join(__dirname, 'frontend');
app.use(express.static(frontendDir));

// Tạo thư mục uploads nếu chưa có
const qrDir = path.join(frontendDir, 'uploads', 'qr');
if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

// ── Wrap async handlers ───────────────────────────────────────────────────────
function wrap(fn) {
  return (req, res) => Promise.resolve(fn(req, res)).catch(e => {
    console.error('[Error]', e.message);
    if (!res.headersSent)
      res.status(500).json({ success: false, message: e.message });
  });
}

// ── API routes ────────────────────────────────────────────────────────────────
app.all('/api/auth',       wrap(require('./api/auth')));
app.all('/api/auth/*',     wrap(require('./api/auth')));
app.all('/api/products',   wrap(require('./api/products')));
app.all('/api/products/*', wrap(require('./api/products')));
app.all('/api/orders',     wrap(require('./api/orders')));
app.all('/api/orders/*',   wrap(require('./api/orders')));
app.all('/api/messages',   wrap(require('./api/messages')));
app.all('/api/messages/*', wrap(require('./api/messages')));
app.all('/api/payment',    wrap(require('./api/payment')));
app.all('/api/payment/*',  wrap(require('./api/payment')));
app.all('/api/users',      wrap(require('./api/users')));
app.all('/api/users/*',    wrap(require('./api/users')));
app.all('/api/upload',     wrap(require('./api/upload')));
app.all('/api/upload/*',   wrap(require('./api/upload')));

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get('*', (_req, res) =>
  res.sendFile(path.join(frontendDir, 'index.html'))
);

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Unhandled]', err.message);
  res.status(500).json({ success: false, message: err.message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  // Kiểm tra và cài DB nếu cần
  try {
    const { getDB } = require('./api/_db');
    const db = await getDB();
    const [rows] = await db.query("SHOW TABLES LIKE 'users'");
    if (rows.length === 0) {
      console.log('⚡ Installing database...');
      const autoInstall = require('./backend/config/auto_install');
      await autoInstall(db);
      console.log('✅ Database installed');
    } else {
      console.log('✅ Database OK');
    }
  } catch (e) {
    // Không exit — deploy vẫn chạy, DB sẽ retry khi có request
    console.error('⚠️  DB not ready:', e.message);
    console.error('   Set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE env vars');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  🌿 EPei running on port ${PORT}`);
    console.log(`  http://localhost:${PORT}\n`);
  });
}

start();
