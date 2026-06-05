'use strict';
/**
 * EPei - server.js  v2.0
 * ─────────────────────
 * Chạy: node server.js
 * URL:  http://localhost:3000
 */
const express = require('express');
const session = require('express-session');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── 1. JSON + form body ───────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── 2. Session ────────────────────────────────────────────────────────────────
app.use(session({
  name:              'epei_sid',
  secret:            'epei_2025_secret',
  resave:            false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 },
}));

// ── 3. CORS ───────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin || `http://localhost:${PORT}`;
  res.header('Access-Control-Allow-Origin',      origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods',     'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers',     'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── 4. Static: frontend + uploads ────────────────────────────────────────────
const frontendDir = path.join(__dirname, 'frontend');
app.use(express.static(frontendDir));

// Uploads accessible at /uploads/...
const uploadsDir = path.join(frontendDir, 'uploads');
if (!fs.existsSync(path.join(uploadsDir, 'qr')))
  fs.mkdirSync(path.join(uploadsDir, 'qr'), { recursive: true });

// ── 5. API routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./backend/api/auth'));
app.use('/api/products', require('./backend/api/products'));
app.use('/api/orders',   require('./backend/api/orders'));
app.use('/api/messages', require('./backend/api/messages'));
app.use('/api/payment',  require('./backend/api/payment'));
app.use('/api/upload',   require('./backend/api/upload'));
app.use('/api/users',    require('./backend/api/users'));

// ── 6. SPA fallback ───────────────────────────────────────────────────────────
app.get('/{*path}', (_req, res) =>
  res.sendFile(path.join(frontendDir, 'index.html'))
);

// ── 7. Error handler ──────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ success: false, message: err.message });
});

// ── 8. Start ──────────────────────────────────────────────────────────────────
async function start() {
  const { autoInstallCheck } = require('./backend/config/database');
  try {
    await autoInstallCheck();
    app.listen(PORT, () => {
      console.log('');
      console.log('  ╔══════════════════════════════════╗');
      console.log('  ║   🌿 EPei Server đang chạy!       ║');
      console.log(`  ║   http://localhost:${PORT}          ║`);
      console.log('  ║   Admin: admin@epei.vn/admin123  ║');
      console.log('  ╚══════════════════════════════════╝');
      console.log('');
    });
  } catch (err) {
    console.error('❌ Lỗi khởi động:', err.message);
    console.error('  → Hãy bật MySQL trong XAMPP Control Panel');
    process.exit(1);
  }
}

start();
