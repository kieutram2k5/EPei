'use strict';
const router    = require('express').Router();
const { getDB } = require('../config/database');
const { requireAdmin } = require('../config/session');

/* GET /api/payment */
router.get('/', async (req, res) => {
  try {
    const db    = await getDB();
    const [[row]] = await db.query('SELECT * FROM payment_codes WHERE active=1 ORDER BY id DESC LIMIT 1');
    res.json({ success: true, data: row || null });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* PUT /api/payment  (admin) */
router.put('/', requireAdmin, async (req, res) => {
  const { bank_name, account_number, account_name, qr_content, description } = req.body;
  if (!bank_name || !account_number || !account_name)
    return res.json({ success: false, message: 'Thiếu thông tin ngân hàng' });
  try {
    const db = await getDB();
    const [[existing]] = await db.query('SELECT id FROM payment_codes WHERE active=1 LIMIT 1');
    if (existing) {
      await db.query(
        'UPDATE payment_codes SET bank_name=?,account_number=?,account_name=?,qr_content=?,description=? WHERE id=?',
        [bank_name, account_number, account_name, qr_content||'', description||'', existing.id]
      );
    } else {
      await db.query(
        'INSERT INTO payment_codes (bank_name,account_number,account_name,qr_content,description) VALUES (?,?,?,?,?)',
        [bank_name, account_number, account_name, qr_content||'', description||'']
      );
    }
    res.json({ success: true, message: 'Đã lưu thông tin thanh toán' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* PATCH /api/payment/confirm/:orderId  (admin) */
router.patch('/confirm/:orderId', requireAdmin, async (req, res) => {
  try {
    const db = await getDB();
    await db.query("UPDATE orders SET payment_status='paid' WHERE id=?", [req.params.orderId]);
    res.json({ success: true, message: 'Đã xác nhận thanh toán' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
