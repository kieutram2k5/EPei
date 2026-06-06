'use strict';
/**
 * EPei - server.js
 * Local: node server.js → http://localhost:3000
 * Deploy: Render.com
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin',      '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods',     'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers',     'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Static
const frontendDir = path.join(__dirname, 'frontend');
app.use(express.static(frontendDir));

const qrDir = path.join(frontendDir, 'uploads', 'qr');
if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

// API routes — dùng cùng serverless functions như Vercel
function wrap(fn) {
  return (req, res) => fn(req, res).catch(e => {
    console.error(e);
    res.status(500).json({ success: false, message: e.message });
  });
}

app.all('/api/auth',          wrap(require('./api/auth')));
app.all('/api/auth/*',        wrap(require('./api/auth')));
app.all('/api/products',      wrap(require('./api/products')));
app.all('/api/products/*',    wrap(require('./api/products')));
app.all('/api/orders',        wrap(require('./api/orders')));
app.all('/api/orders/*',      wrap(require('./api/orders')));
app.all('/api/messages',      wrap(require('./api/messages')));
app.all('/api/messages/*',    wrap(require('./api/messages')));
app.all('/api/payment',       wrap(require('./api/payment')));
app.all('/api/payment/*',     wrap(require('./api/payment')));
app.all('/api/users',         wrap(require('./api/users')));
app.all('/api/users/*',       wrap(require('./api/users')));

// Upload (multer — cần handle khác vì không phải serverless)
const multer  = require('multer');
const jwt     = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'epei_jwt_2025';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'frontend', 'uploads', 'qr');
    const old = fs.readdirSync(dir).filter(f => f.startsWith('qr_'));
    old.forEach(f => { try { fs.unlinkSync(path.join(dir, f)); } catch {} });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, 'qr_' + Date.now() + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    ['image/png','image/jpeg','image/jpg','image/webp','image/gif'].includes(file.mimetype)
      ? cb(null, true) : cb(new Error('Chỉ chấp nhận ảnh'));
  },
});

app.post('/api/upload', (req, res) => {
  const auth  = (req.headers.authorization || '').replace('Bearer ', '');
  let user;
  try { user = jwt.verify(auth, JWT_SECRET); } catch { return res.status(401).json({ success: false, message: 'Chưa đăng nhập' }); }
  if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Không có quyền' });

  upload.single('qr_image')(req, res, (err) => {
    if (err) return res.json({ success: false, message: err.message });
    if (!req.file) return res.json({ success: false, message: 'Không có file' });
    res.json({ success: true, url: '/uploads/qr/' + req.file.filename, filename: req.file.filename, message: 'Upload thành công' });
  });
});

// SPA fallback — Express v4 syntax
app.get('*', (_req, res) =>
  res.sendFile(path.join(frontendDir, 'index.html'))
);

// Error handler
app.use((err, _req, res, _next) => res.status(500).json({ success: false, message: err.message }));

// Start
async function start() {
  const { getDB } = require('./api/_db');
  try {
    await getDB(); // triggers auto-install
    app.listen(PORT, () => {
      console.log('');
      console.log('  ╔══════════════════════════════════╗');
      console.log('  ║   🌿 EPei Server đang chạy!       ║');
      console.log(`  ║   http://localhost:${PORT}          ║`);
      console.log('  ║   Admin: admin@epei.vn/admin123  ║');
      console.log('  ╚══════════════════════════════════╝');
      console.log('');
    });
  } catch (e) {
    console.error('❌ Lỗi:', e.message);
    console.error('→ Hãy bật MySQL trong XAMPP');
    process.exit(1);
  }
}
start();
