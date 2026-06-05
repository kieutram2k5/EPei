'use strict';
const { getDB, verifyToken, getTokenFromReq, setCORS } = require('./_db');

const cast = r => ({ ...r, id:+r.id, price:+r.price, eco_score:+r.eco_score, stock:+r.stock, active:+r.active });

module.exports = async (req, res) => {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { category, id } = req.query;

  try {
    const db = await getDB();

    // GET list or single
    if (req.method === 'GET') {
      if (id) {
        const [rows] = await db.query('SELECT * FROM products WHERE id=? AND active=1', [+id]);
        return rows[0]
          ? res.json({ success: true, data: cast(rows[0]) })
          : res.json({ success: false, message: 'Không tìm thấy' });
      }
      let sql = 'SELECT * FROM products WHERE active=1', args = [];
      if (category && category !== 'all') { sql += ' AND category=?'; args.push(category); }
      const [rows] = await db.query(sql + ' ORDER BY id ASC', args);
      return res.json({ success: true, data: rows.map(cast) });
    }

    // Admin only
    const user = verifyToken(getTokenFromReq(req));
    if (!user || user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Không có quyền' });

    const d = req.body || {};

    if (req.method === 'POST') {
      if (!d.name||!d.category||!d.price) return res.json({success:false,message:'Thiếu thông tin'});
      const [r] = await db.query(
        'INSERT INTO products (name,category,price,unit,eco_score,ingredient,icon,img_class,badge,description,stock) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        [d.name,d.category,+d.price,d.unit||'',+d.eco_score||95,d.ingredient||'',d.icon||'fas fa-leaf',d.img_class||'img-1',d.badge||'',d.description||'',+d.stock||100]
      );
      return res.json({ success:true, id:r.insertId, message:'Thêm thành công' });
    }

    if (req.method === 'PUT' && id) {
      const intCols=['price','eco_score','stock','active'];
      const allowed=['name','category','price','unit','eco_score','ingredient','icon','img_class','badge','description','stock','active'];
      const fields=[],vals=[];
      allowed.forEach(f=>{if(d[f]!==undefined){fields.push(`\`${f}\`=?`);vals.push(intCols.includes(f)?+d[f]:d[f]);}});
      if(!fields.length) return res.json({success:false,message:'Không có dữ liệu'});
      await db.query(`UPDATE products SET ${fields.join(',')} WHERE id=?`, [...vals,+id]);
      return res.json({ success:true, message:'Cập nhật thành công' });
    }

    if (req.method === 'DELETE' && id) {
      await db.query('UPDATE products SET active=0 WHERE id=?', [+id]);
      return res.json({ success:true, message:'Đã xóa' });
    }

    res.json({ success:false, message:'Không hỗ trợ' });
  } catch(e) {
    console.error('[products]', e);
    res.status(500).json({ success:false, message:e.message });
  }
};
