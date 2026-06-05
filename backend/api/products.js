'use strict';
const router    = require('express').Router();
const { getDB } = require('../config/database');
const { requireAdmin } = require('../config/session');

function cast(row) {
  return { ...row, id: +row.id, price: +row.price, eco_score: +row.eco_score, stock: +row.stock, active: +row.active };
}

/* GET /api/products?category= */
router.get('/', async (req, res) => {
  try {
    const db  = await getDB();
    const cat = (req.query.category || '').trim();
    let sql    = 'SELECT * FROM products WHERE active=1';
    const args = [];
    if (cat && cat !== 'all') { sql += ' AND category=?'; args.push(cat); }
    sql += ' ORDER BY id ASC';
    const [rows] = await db.query(sql, args);
    res.json({ success: true, data: rows.map(cast) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* GET /api/products/:id */
router.get('/:id', async (req, res) => {
  try {
    const db = await getDB();
    const [[row]] = await db.query('SELECT * FROM products WHERE id=? AND active=1', [+req.params.id]);
    if (!row) return res.json({ success: false, message: 'Sản phẩm không tồn tại' });
    res.json({ success: true, data: cast(row) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* POST /api/products  (admin) */
router.post('/', requireAdmin, async (req, res) => {
  const d = req.body;
  if (!d.name || !d.category || !d.price)
    return res.json({ success: false, message: 'Thiếu thông tin bắt buộc' });
  try {
    const db = await getDB();
    const [r] = await db.query(
      `INSERT INTO products (name,category,price,unit,eco_score,ingredient,icon,img_class,badge,description,stock)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [d.name, d.category, +d.price, d.unit||'', +d.eco_score||95,
       d.ingredient||'', d.icon||'fas fa-leaf', d.img_class||'img-1',
       d.badge||'', d.description||'', +d.stock||100]
    );
    res.json({ success: true, id: r.insertId, message: 'Thêm sản phẩm thành công' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* PUT /api/products/:id  (admin) */
router.put('/:id', requireAdmin, async (req, res) => {
  const d      = req.body;
  const intCols = ['price','eco_score','stock','active'];
  const allowed = ['name','category','price','unit','eco_score','ingredient','icon','img_class','badge','description','stock','active'];
  const fields = [], vals = [];
  allowed.forEach(f => {
    if (d[f] !== undefined) {
      fields.push(`\`${f}\`=?`);
      vals.push(intCols.includes(f) ? +d[f] : d[f]);
    }
  });
  if (!fields.length) return res.json({ success: false, message: 'Không có dữ liệu' });
  vals.push(+req.params.id);
  try {
    const db = await getDB();
    await db.query(`UPDATE products SET ${fields.join(',')} WHERE id=?`, vals);
    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* DELETE /api/products/:id  (soft delete, admin) */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const db = await getDB();
    await db.query('UPDATE products SET active=0 WHERE id=?', [+req.params.id]);
    res.json({ success: true, message: 'Đã xóa sản phẩm' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
