'use strict';
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const { getDB } = require('../config/database');

/* GET /api/auth/me */
router.get('/me', (req, res) => {
  if (req.session.user)
    res.json({ success: true, user: req.session.user });
  else
    res.json({ success: false, message: 'Chưa đăng nhập' });
});

/* POST /api/auth/login */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });

  try {
    const db = await getDB();
    const [[user]] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    if (!user)
      return res.json({ success: false, message: 'Email hoặc mật khẩu không đúng' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.json({ success: false, message: 'Email hoặc mật khẩu không đúng' });

    delete user.password;
    req.session.user = user;
    res.json({ success: true, user, message: 'Đăng nhập thành công' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Lỗi server: ' + e.message });
  }
});

/* POST /api/auth/register */
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password)
    return res.json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
  if (password.length < 6)
    return res.json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });

  try {
    const db = await getDB();
    const [[existing]] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing)
      return res.json({ success: false, message: 'Email đã được sử dụng' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO users (name,email,password,phone,role) VALUES (?,?,?,?,'customer')`,
      [name, email, hashed, phone || '']
    );
    const user = { id: result.insertId, name, email, phone: phone || '', address: '', role: 'customer' };
    req.session.user = user;
    res.json({ success: true, user, message: 'Đăng ký thành công' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Lỗi server: ' + e.message });
  }
});

/* POST /api/auth/logout */
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: 'Đã đăng xuất' });
  });
});

module.exports = router;
