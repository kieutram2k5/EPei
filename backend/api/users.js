'use strict';
const router    = require('express').Router();
const { getDB } = require('../config/database');
const { requireAuth, requireAdmin } = require('../config/session');

/* GET /api/users  (admin) */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const db    = await getDB();
    const [rows] = await db.query(
      'SELECT id,name,email,phone,address,role,created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* PATCH /api/users/profile  (auth) */
router.patch('/profile', requireAuth, async (req, res) => {
  const { name, phone, address } = req.body;
  if (!name) return res.json({ success: false, message: 'Tên không được để trống' });
  try {
    const db  = await getDB();
    const uid = req.session.user.id;
    await db.query('UPDATE users SET name=?,phone=?,address=? WHERE id=?',
      [name, phone||'', address||'', uid]);
    req.session.user = { ...req.session.user, name, phone: phone||'', address: address||'' };
    res.json({ success: true, message: 'Cập nhật thành công', user: req.session.user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* GET /api/users/stats  (admin) */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const db = await getDB();
    const [[{ total_orders }]]  = await db.query('SELECT COUNT(*) AS total_orders FROM orders');
    const [[{ revenue }]]       = await db.query("SELECT COALESCE(SUM(total),0) AS revenue FROM orders WHERE order_status!='cancelled'");
    const [[{ customers }]]     = await db.query("SELECT COUNT(*) AS customers FROM users WHERE role='customer'");
    const [[{ pending_orders }]]= await db.query("SELECT COUNT(*) AS pending_orders FROM orders WHERE order_status='pending'");
    const [[{ unread_messages }]]= await db.query('SELECT COUNT(*) AS unread_messages FROM messages WHERE is_read=0');
    res.json({ success: true, data: {
      total_orders:    +total_orders,
      revenue:         +revenue,
      customers:       +customers,
      pending_orders:  +pending_orders,
      unread_messages: +unread_messages,
    }});
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
