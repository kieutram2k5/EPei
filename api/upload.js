'use strict';
const { verifyToken, getTokenFromReq, setCORS } = require('./_db');

module.exports = async (req, res) => {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyToken(getTokenFromReq(req));
  if (!user)             return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Không có quyền' });

  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  // Trên Render serverless không lưu file được — trả về thông báo dùng URL
  res.json({
    success: false,
    message: 'Upload file không khả dụng trên môi trường serverless. Hãy dùng tab "Nhập URL" hoặc "Tạo VietQR" để thêm ảnh QR.',
  });
};
