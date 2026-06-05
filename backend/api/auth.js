'use strict';
const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const { getDB } = require('../config/database');

function handleErr(res, e) {
  const msg = (e && (e.message || e.sqlMessage || String(e))) || 'Lỗi server';
  console.error('[auth error]', e);
  res.status(500).json({ success: false, message: msg });
}

/* GET /api/auth/me */
router.get('/me', (req, res) => {
  if (req.session && req.session.user)
    res.json({ success: true, user: req.session.user });
  else
    res.json({ success: false, message: 'Chưa đăng nhập' });
});

/* POST /api/auth/login */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });

    const db = await getDB();
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ? LIMIT 1', [email.trim()]
    );
    const user = rows[0];

    if (!user)
      return res.json({ success: false, message: 'Email hoặc mật khẩu không đúng' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.json({ success: false, message: 'Email hoặc mật khẩu không đúng' });

    delete user.password;
    req.session.user = user;
    req.session.save((err) => {
      if (err) return handleErr(res, err);
      res.json({ success: true, user, message: 'Đăng nhập thành công' });
    });
  } catch (e) { handleErr(res, e); }
});

/* POST /api/auth/register */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body || {};
    if (!name || !email || !password)
      return res.json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
    if (password.length < 6)
      return res.json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });

    const db = await getDB();
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
    if (existing.length)
      return res.json({ success: false, message: 'Email đã được sử dụng' });

    const hashed  = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (name,email,password,phone,role) VALUES (?,?,?,?,'customer')",
      [name.trim(), email.trim(), hashed, (phone || '').trim()]
    );

    const user = {
      id: result.insertId, name: name.trim(), email: email.trim(),
      phone: (phone || '').trim(), address: '', role: 'customer',
    };
    req.session.user = user;
    req.session.save((err) => {
      if (err) return handleErr(res, err);
      res.json({ success: true, user, message: 'Đăng ký thành công' });
    });
  } catch (e) { handleErr(res, e); }
});

/* POST /api/auth/logout */
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true, message: 'Đã đăng xuất' }));
});

module.exports = router;
