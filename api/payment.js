'use strict';
const { getDB, verifyToken, getTokenFromReq, setCORS } = require('./_db');

module.exports = async (req, res) => {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const db = await getDB();
    if (req.method === 'GET') {
      const [[row]] = await db.query('SELECT * FROM payment_codes WHERE active=1 ORDER BY id DESC LIMIT 1');
      return res.json({success:true,data:row||null});
    }
    const user = verifyToken(getTokenFromReq(req));
    if (!user||user.role!=='admin') return res.status(403).json({success:false,message:'Không có quyền'});
    if (req.method === 'PUT') {
      const { bank_name,account_number,account_name,qr_content,description } = req.body||{};
      if (!bank_name||!account_number||!account_name) return res.json({success:false,message:'Thiếu thông tin'});
      const [[ex]] = await db.query('SELECT id FROM payment_codes WHERE active=1 LIMIT 1');
      if (ex) {
        await db.query('UPDATE payment_codes SET bank_name=?,account_number=?,account_name=?,qr_content=?,description=? WHERE id=?',
          [bank_name,account_number,account_name,qr_content||'',description||'',ex.id]);
      } else {
        await db.query('INSERT INTO payment_codes (bank_name,account_number,account_name,qr_content,description) VALUES (?,?,?,?,?)',
          [bank_name,account_number,account_name,qr_content||'',description||'']);
      }
      return res.json({success:true,message:'Đã lưu thông tin thanh toán'});
    }
    if (req.method === 'PATCH' && req.query.order_id) {
      await db.query("UPDATE orders SET payment_status='paid' WHERE id=?",[req.query.order_id]);
      return res.json({success:true,message:'Đã xác nhận thanh toán'});
    }
    res.json({success:false,message:'Không hỗ trợ'});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
