'use strict';

const { getDB } = require('./_db');

function cast(row) {
  return {
    ...row,
    id: +row.id,
    price: +row.price,
    eco_score: +row.eco_score,
    stock: +row.stock,
    active: +row.active
  };
}

module.exports = async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const db = await getDB();

    // =========================
    // GET ALL PRODUCTS
    // =========================
    if (req.method === 'GET' && !req.query.id) {
      const cat = (req.query.category || '').trim();

      let sql = 'SELECT * FROM products WHERE active=1';
      const args = [];

      if (cat && cat !== 'all') {
        sql += ' AND category=?';
        args.push(cat);
      }

      sql += ' ORDER BY id ASC';

      const [rows] = await db.query(sql, args);

      return res.json({
        success: true,
        data: rows.map(cast)
      });
    }

    // =========================
    // GET BY ID
    // =========================
    if (req.method === 'GET' && req.query.id) {
      const [[row]] = await db.query(
        'SELECT * FROM products WHERE id=? AND active=1',
        [+req.query.id]
      );

      if (!row) {
        return res.json({ success: false, message: 'Không tồn tại' });
      }

      return res.json({
        success: true,
        data: cast(row)
      });
    }

    // =========================
    // POST (ADD)
    // =========================
    if (req.method === 'POST') {
      const d = req.body;

      const [r] = await db.query(
        `INSERT INTO products
        (name,category,price,unit,eco_score,ingredient,icon,img_class,badge,description,stock)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          d.name,
          d.category,
          +d.price,
          d.unit || '',
          +d.eco_score || 95,
          d.ingredient || '',
          d.icon || 'fas fa-leaf',
          d.img_class || 'img-1',
          d.badge || '',
          d.description || '',
          +d.stock || 100
        ]
      );

      return res.json({ success: true, id: r.insertId });
    }

    // =========================
    // PUT (UPDATE)
    // =========================
    if (req.method === 'PUT') {
      const d = req.body;

      const fields = [];
      const values = [];

      const allowed = [
        'name','category','price','unit','eco_score',
        'ingredient','icon','img_class','badge',
        'description','stock','active'
      ];

      allowed.forEach(f => {
        if (d[f] !== undefined) {
          fields.push(`${f}=?`);
          values.push(d[f]);
        }
      });

      values.push(req.query.id);

      await db.query(
        `UPDATE products SET ${fields.join(',')} WHERE id=?`,
        values
      );

      return res.json({ success: true });
    }

    // =========================
    // DELETE (SOFT DELETE)
    // =========================
    if (req.method === 'DELETE') {
      await db.query(
        'UPDATE products SET active=0 WHERE id=?',
        [+req.query.id]
      );

      return res.json({ success: true });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};