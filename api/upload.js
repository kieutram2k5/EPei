'use strict';
/**
 * EPei - api/upload.js
 * Upload ảnh QR — hoạt động cả Vercel serverless lẫn local Express
 */
const { verifyToken, getTokenFromReq, setCORS } = require('./_db');

// Vercel cần tắt bodyParser để đọc multipart
module.exports.config = { api: { bodyParser: false } };

module.exports = async (req, res) => {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Auth check
  const user = verifyToken(getTokenFromReq(req));
  if (!user)              return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Không có quyền' });

  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    // Parse multipart dùng busboy (có sẵn trong Node)
    const busboy = require('busboy');
    const path   = require('path');
    const fs     = require('fs');
    const os     = require('os');

    const bb = busboy({ headers: req.headers, limits: { fileSize: 2 * 1024 * 1024 } });
    let savedUrl = null;
    let savedFilename = null;
    let uploadError = null;

    bb.on('file', (name, file, info) => {
      const { filename, mimeType } = info;
      const allowed = ['image/png','image/jpeg','image/jpg','image/webp','image/gif'];
      if (!allowed.includes(mimeType)) {
        uploadError = 'Chỉ chấp nhận PNG, JPG, WEBP, GIF';
        file.resume();
        return;
      }

      const ext     = path.extname(filename || '.png').toLowerCase() || '.png';
      const newName = 'qr_' + Date.now() + ext;

      // Vercel: dùng /tmp (writable), local: dùng frontend/uploads/qr
      const isVercel   = !!process.env.VERCEL;
      const uploadDir  = isVercel
        ? os.tmpdir()
        : path.join(process.cwd(), 'frontend', 'uploads', 'qr');

      if (!isVercel && !fs.existsSync(uploadDir))
        fs.mkdirSync(uploadDir, { recursive: true });

      // Xóa QR cũ (local only)
      if (!isVercel) {
        fs.readdirSync(uploadDir)
          .filter(f => f.startsWith('qr_'))
          .forEach(f => { try { fs.unlinkSync(path.join(uploadDir, f)); } catch {} });
      }

      const dest = path.join(uploadDir, newName);
      const out  = fs.createWriteStream(dest);
      file.pipe(out);

      out.on('finish', () => {
        savedFilename = newName;
        // Local: accessible via /uploads/qr/xxx
        // Vercel: không persist — cần lưu vào DB hoặc dùng URL
        savedUrl = isVercel
          ? `https://img.vietqr.io/placeholder` // Vercel serverless không persist file
          : '/uploads/qr/' + newName;
      });
    });

    bb.on('error', (err) => { uploadError = err.message; });

    bb.on('finish', () => {
      if (uploadError) {
        return res.status(400).json({ success: false, message: uploadError });
      }
      if (!savedFilename) {
        return res.status(400).json({ success: false, message: 'Không có file được upload' });
      }
      res.json({
        success:  true,
        url:      savedUrl,
        filename: savedFilename,
        message:  'Upload thành công' + (process.env.VERCEL ? ' (dùng URL thay vì file cho Vercel)' : ''),
      });
    });

    req.pipe(bb);
  } catch (e) {
    console.error('[upload]', e);
    res.status(500).json({ success: false, message: e.message });
  }
};
