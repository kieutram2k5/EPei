'use strict';
const bcrypt = require('bcryptjs');
const { getDB, signToken, verifyToken, getTokenFromReq, setCORS } = require('./_db');

module.exports = async (req, res) => {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action
    || (req.url && req.url.match(/\/login/) ? 'login' : '')
    || (req.url && req.url.match(/\/register/) ? 'register' : '')
    || (req.url && req.url.match(/\/logout/) ? 'logout' : '')
    || (req.url && req.url.match(/\/me/) ? 'me' : '')
    || (req.method === 'GET' ? 'me' : '')
    || (req.method === 'POST' && req.body?.email && req.body?.password ? 'login' : '');

  try {
    // GET /api/auth?action=me
    if (action === 'me') {
      const user = verifyToken(getTokenFromReq(req));
      return user
        ? res.json({ success: true, user })
        : res.json({ success: false, message: 'Chưa đăng nhập' });
    }

    const db = await getDB();

    // POST login
    if (action === 'login') {
      const { email, password } = req.body || {};
      if (!email || !password)
        return res.json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });

      const [rows] = await db.query('SELECT * FROM users WHERE email=? LIMIT 1', [email.trim()]);
      const user = rows[0];
      if (!user || !await bcrypt.compare(password, user.password))
        return res.json({ success: false, message: 'Email hoặc mật khẩu không đúng' });

      delete user.password;
      return res.json({ success: true, user, token: signToken(user), message: 'Đăng nhập thành công' });
    }

    // POST register
    if (action === 'register') {
      const { name, email, password, phone } = req.body || {};
      if (!name || !email || !password)
        return res.json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
      if (password.length < 6)
        return res.json({ success: false, message: 'Mật khẩu ít nhất 6 ký tự' });

      const [ex] = await db.query('SELECT id FROM users WHERE email=?', [email.trim()]);
      if (ex.length) return res.json({ success: false, message: 'Email đã được sử dụng' });

      const hashed = await bcrypt.hash(password, 10);
      const [r] = await db.query(
        "INSERT INTO users (name,email,password,phone,role) VALUES (?,?,?,?,'customer')",
        [name.trim(), email.trim(), hashed, (phone||'').trim()]
      );
      const user = { id: r.insertId, name: name.trim(), email: email.trim(), phone: (phone||'').trim(), address: '', role: 'customer' };
      return res.json({ success: true, user, token: signToken(user), message: 'Đăng ký thành công' });
    }

    // POST logout (stateless JWT — client xóa token)
    if (action === 'logout')
      return res.json({ success: true, message: 'Đã đăng xuất' });

    res.json({ success: false, message: 'Action không hợp lệ' });
  } catch (e) {
    console.error('[auth]', e);
    res.status(500).json({ success: false, message: e.message || 'Lỗi server' });
  }
};
