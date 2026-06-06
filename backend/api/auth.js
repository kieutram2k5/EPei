'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('./_db');

const JWT_SECRET = process.env.JWT_SECRET || 'epei_secret';

function signUser(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await getDB();

  // =========================
  // GET ME
  // =========================
  if (req.method === 'GET') {
    const token = (req.headers.authorization || '').replace('Bearer ', '');

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return res.json({ success: true, user: decoded });
    } catch {
      return res.json({ success: false, message: 'Chưa đăng nhập' });
    }
  }

  // =========================
  // LOGIN
  // =========================
  if (req.method === 'POST') {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.json({ success: false, message: 'Thiếu dữ liệu' });
    }

    const [rows] = await db.query(
      'SELECT * FROM users WHERE email=? LIMIT 1',
      [email.trim()]
    );

    const user = rows[0];

    if (!user) {
      return res.json({ success: false, message: 'Sai tài khoản' });
    }

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      return res.json({ success: false, message: 'Sai mật khẩu' });
    }

    const token = signUser(user);

    return res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  }

  return res.status(405).json({ success: false });
};