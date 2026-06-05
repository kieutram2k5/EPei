'use strict';
const router    = require('express').Router();
const { getDB } = require('../config/database');
const { requireAuth, requireAdmin } = require('../config/session');

function orderId() {
  return 'EPei-' + new Date().toISOString().slice(0,10).replace(/-/g,'') +
         '-' + Math.random().toString(36).slice(-6).toUpperCase();
}

/* POST /api/orders  — tạo đơn hàng */
router.post('/', async (req, res) => {
  const d = req.body;
  if (!d.customer_name)    return res.json({ success: false, message: 'Vui lòng nhập họ tên' });
  if (!d.customer_phone)   return res.json({ success: false, message: 'Vui lòng nhập số điện thoại' });
  if (!d.customer_address) return res.json({ success: false, message: 'Vui lòng nhập địa chỉ' });
  if (!Array.isArray(d.items) || !d.items.length)
    return res.json({ success: false, message: 'Giỏ hàng trống' });

  try {
    const db       = await getDB();
    let total      = 0;
    const itemsData = [];

    for (const item of d.items) {
      const pid = +item.id, qty = Math.max(1, +item.qty || 1);
      if (!pid) continue;
      const [[p]] = await db.query('SELECT id,name,price FROM products WHERE id=? AND active=1', [pid]);
      if (!p) continue;
      const pr  = +p.price;
      const sub = pr * qty;
      total    += sub;
      itemsData.push({ pid, pname: p.name, price: pr, qty, sub });
    }

    if (!itemsData.length)
      return res.json({ success: false, message: 'Không có sản phẩm hợp lệ' });

    const oid     = orderId();
    const userId  = req.session.user ? req.session.user.id : null;
    const email   = d.customer_email   || '';
    const note    = d.note             || '';
    const payment = d.payment_method   || 'cod';

    await db.query(
      `INSERT INTO orders (id,user_id,customer_name,customer_phone,customer_email,
       customer_address,note,payment_method,total) VALUES (?,?,?,?,?,?,?,?,?)`,
      [oid, userId, d.customer_name, d.customer_phone, email,
       d.customer_address, note, payment, total]
    );

    for (const item of itemsData) {
      await db.query(
        `INSERT INTO order_items (order_id,product_id,product_name,price,quantity,subtotal)
         VALUES (?,?,?,?,?,?)`,
        [oid, item.pid, item.pname, item.price, item.qty, item.sub]
      );
    }

    res.json({ success: true, order_id: oid, total, message: 'Đặt hàng thành công!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* GET /api/orders  — danh sách (admin) */
router.get('/', requireAdmin, async (req, res) => {
  const search = (req.query.search || '').trim();
  const status = (req.query.status || '').trim();
  let sql  = `SELECT o.*,COUNT(oi.id) AS item_count FROM orders o
              LEFT JOIN order_items oi ON o.id=oi.order_id WHERE 1=1`;
  const args = [];
  if (search) {
    sql += ' AND (o.id LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?)';
    const s = `%${search}%`;
    args.push(s, s, s);
  }
  if (status) { sql += ' AND o.order_status=?'; args.push(status); }
  sql += ' GROUP BY o.id ORDER BY o.created_at DESC';
  try {
    const db    = await getDB();
    const [rows] = await db.query(sql, args);
    res.json({ success: true, data: rows.map(r => ({ ...r, total: +r.total, item_count: +r.item_count })) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* GET /api/orders/mine  — đơn của tôi */
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const db   = await getDB();
    const uid  = req.session.user.id;
    const [rows] = await db.query(
      `SELECT o.*,COUNT(oi.id) AS item_count FROM orders o
       LEFT JOIN order_items oi ON o.id=oi.order_id
       WHERE o.user_id=? GROUP BY o.id ORDER BY o.created_at DESC`, [uid]
    );
    res.json({ success: true, data: rows.map(r => ({ ...r, total: +r.total, item_count: +r.item_count })) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* GET /api/orders/:id */
router.get('/:id', async (req, res) => {
  try {
    const db   = await getDB();
    const [[o]] = await db.query('SELECT * FROM orders WHERE id=?', [req.params.id]);
    if (!o) return res.json({ success: false, message: 'Không tìm thấy đơn hàng' });
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id=?', [req.params.id]);
    o.items = items;
    o.total = +o.total;
    res.json({ success: true, data: o });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* PATCH /api/orders/:id/status  (admin) */
router.patch('/:id/status', requireAdmin, async (req, res) => {
  const allowed = ['pending','confirmed','shipping','done','cancelled'];
  const status  = req.body.status || '';
  if (!allowed.includes(status))
    return res.json({ success: false, message: 'Trạng thái không hợp lệ' });
  try {
    const db = await getDB();
    await db.query('UPDATE orders SET order_status=? WHERE id=?', [status, req.params.id]);
    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* PATCH /api/orders/:id/payment  (admin) */
router.patch('/:id/payment', requireAdmin, async (req, res) => {
  try {
    const db = await getDB();
    await db.query("UPDATE orders SET payment_status='paid' WHERE id=?", [req.params.id]);
    res.json({ success: true, message: 'Đã xác nhận thanh toán' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
