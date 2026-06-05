'use strict';
const { getDB, verifyToken, getTokenFromReq, setCORS } = require('./_db');

function oid() {
  return 'EPei-' + new Date().toISOString().slice(0,10).replace(/-/g,'') +
    '-' + Math.random().toString(36).slice(-6).toUpperCase();
}

module.exports = async (req, res) => {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user   = verifyToken(getTokenFromReq(req));
  const { id, action } = req.query;

  try {
    const db = await getDB();

    // POST create
    if (req.method === 'POST' && !action) {
      const d = req.body || {};
      if (!d.customer_name)    return res.json({success:false,message:'Nhập họ tên'});
      if (!d.customer_phone)   return res.json({success:false,message:'Nhập số điện thoại'});
      if (!d.customer_address) return res.json({success:false,message:'Nhập địa chỉ'});
      if (!Array.isArray(d.items)||!d.items.length) return res.json({success:false,message:'Giỏ hàng trống'});

      let total=0; const items=[];
      for (const it of d.items) {
        const [rows] = await db.query('SELECT id,name,price FROM products WHERE id=? AND active=1',[+it.id]);
        if (!rows[0]) continue;
        const qty=Math.max(1,+it.qty||1), pr=+rows[0].price;
        total+=pr*qty;
        items.push({pid:+it.id,pname:rows[0].name,price:pr,qty,sub:pr*qty});
      }
      if (!items.length) return res.json({success:false,message:'Không có sản phẩm hợp lệ'});

      const orderId = oid();
      await db.query(
        'INSERT INTO orders (id,user_id,customer_name,customer_phone,customer_email,customer_address,note,payment_method,total) VALUES (?,?,?,?,?,?,?,?,?)',
        [orderId,user?.id||null,d.customer_name,d.customer_phone,d.customer_email||'',d.customer_address,d.note||'',d.payment_method||'cod',total]
      );
      for (const it of items)
        await db.query('INSERT INTO order_items (order_id,product_id,product_name,price,quantity,subtotal) VALUES (?,?,?,?,?,?)',
          [orderId,it.pid,it.pname,it.price,it.qty,it.sub]);

      return res.json({ success:true, order_id:orderId, total, message:'Đặt hàng thành công!' });
    }

    // GET my orders
    if (req.method === 'GET' && action === 'mine') {
      if (!user) return res.status(401).json({success:false,message:'Chưa đăng nhập'});
      const [rows] = await db.query(
        'SELECT o.*,COUNT(oi.id) item_count FROM orders o LEFT JOIN order_items oi ON o.id=oi.order_id WHERE o.user_id=? GROUP BY o.id ORDER BY o.created_at DESC',
        [user.id]
      );
      return res.json({ success:true, data: rows.map(r=>({...r,total:+r.total,item_count:+r.item_count})) });
    }

    // GET single
    if (req.method === 'GET' && id) {
      const [rows] = await db.query('SELECT * FROM orders WHERE id=?', [id]);
      if (!rows[0]) return res.json({success:false,message:'Không tìm thấy'});
      const [items] = await db.query('SELECT * FROM order_items WHERE order_id=?',[id]);
      return res.json({ success:true, data:{...rows[0],total:+rows[0].total,items} });
    }

    // Admin only below
    if (!user||user.role!=='admin') return res.status(403).json({success:false,message:'Không có quyền'});

    // GET list
    if (req.method === 'GET') {
      const { search='', status='' } = req.query;
      let sql='SELECT o.*,COUNT(oi.id) item_count FROM orders o LEFT JOIN order_items oi ON o.id=oi.order_id WHERE 1=1',args=[];
      if (search) { sql+=' AND (o.id LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?)'; const s=`%${search}%`;args.push(s,s,s); }
      if (status) { sql+=' AND o.order_status=?'; args.push(status); }
      sql+=' GROUP BY o.id ORDER BY o.created_at DESC';
      const [rows] = await db.query(sql,args);
      return res.json({ success:true, data:rows.map(r=>({...r,total:+r.total,item_count:+r.item_count})) });
    }

    // PATCH status
    if (req.method === 'PATCH' && id && action==='status') {
      const allowed=['pending','confirmed','shipping','done','cancelled'];
      const status=(req.body||{}).status||'';
      if (!allowed.includes(status)) return res.json({success:false,message:'Trạng thái không hợp lệ'});
      await db.query('UPDATE orders SET order_status=? WHERE id=?',[status,id]);
      return res.json({success:true,message:'Cập nhật thành công'});
    }

    // PATCH payment confirm
    if (req.method === 'PATCH' && id && action==='payment') {
      await db.query("UPDATE orders SET payment_status='paid' WHERE id=?",[id]);
      return res.json({success:true,message:'Đã xác nhận thanh toán'});
    }

    res.json({success:false,message:'Không hỗ trợ'});
  } catch(e) {
    console.error('[orders]',e);
    res.status(500).json({success:false,message:e.message});
  }
};
