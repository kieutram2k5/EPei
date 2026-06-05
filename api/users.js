'use strict';
const { getDB, verifyToken, getTokenFromReq, setCORS } = require('./_db');

module.exports = async (req, res) => {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const user = verifyToken(getTokenFromReq(req));
  if (!user) return res.status(401).json({success:false,message:'Chưa đăng nhập'});
  try {
    const db = await getDB();
    const { action } = req.query;

    if (action === 'stats') {
      if (user.role !== 'admin') return res.status(403).json({success:false,message:'Không có quyền'});
      const [[{total_orders}]]   = await db.query('SELECT COUNT(*) total_orders FROM orders');
      const [[{revenue}]]        = await db.query("SELECT COALESCE(SUM(total),0) revenue FROM orders WHERE order_status!='cancelled'");
      const [[{customers}]]      = await db.query("SELECT COUNT(*) customers FROM users WHERE role='customer'");
      const [[{pending_orders}]] = await db.query("SELECT COUNT(*) pending_orders FROM orders WHERE order_status='pending'");
      const [[{unread_messages}]]= await db.query('SELECT COUNT(*) unread_messages FROM messages WHERE is_read=0');
      return res.json({success:true,data:{total_orders:+total_orders,revenue:+revenue,customers:+customers,pending_orders:+pending_orders,unread_messages:+unread_messages}});
    }

    if (req.method === 'GET' && !action) {
      if (user.role !== 'admin') return res.status(403).json({success:false,message:'Không có quyền'});
      const [rows] = await db.query('SELECT id,name,email,phone,address,role,created_at FROM users ORDER BY created_at DESC');
      return res.json({success:true,data:rows});
    }

    if (req.method === 'PATCH' && action === 'profile') {
      const { name, phone, address } = req.body||{};
      if (!name) return res.json({success:false,message:'Tên không được trống'});
      await db.query('UPDATE users SET name=?,phone=?,address=? WHERE id=?',[name,phone||'',address||'',user.id]);
      const updated = {...user,name,phone:phone||'',address:address||''};
      const {signToken} = require('./_db');
      return res.json({success:true,message:'Cập nhật thành công',user:updated,token:signToken(updated)});
    }

    res.json({success:false,message:'Không hỗ trợ'});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
