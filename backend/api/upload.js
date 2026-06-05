'use strict';
const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { requireAdmin } = require('../config/session');

const uploadDir = path.join(__dirname, '../../frontend/uploads/qr');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    // Xóa ảnh cũ trước
    const old = fs.readdirSync(uploadDir).filter(f => f.startsWith('qr_') && f !== '.gitkeep');
    old.forEach(f => fs.unlinkSync(path.join(uploadDir, f)));
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, 'qr_' + Date.now() + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png','image/jpeg','image/jpg','image/webp','image/gif'];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Chỉ chấp nhận PNG, JPG, WEBP, GIF'));
  },
});

/* POST /api/upload/qr  (admin) */
router.post('/qr', requireAdmin, (req, res) => {
  upload.single('qr_image')(req, res, (err) => {
    if (err) return res.json({ success: false, message: err.message });
    if (!req.file) return res.json({ success: false, message: 'Không có file' });
    const url = '/uploads/qr/' + req.file.filename;
    res.json({ success: true, url, filename: req.file.filename, message: 'Upload thành công' });
  });
});

module.exports = router;
