'use strict';
const { getDB, verifyToken, getTokenFromReq, setCORS } = require('./_db');

module.exports = async (req, res) => {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const db = await getDB();
    if (req.method === 'POST') {
      const { name, email, organization, subject, content } = req.body||{};
      if (!name||!email||!content) return res.json({success:false,message:'Điền đầy đủ thông tin'});
      await db.query('INSERT INTO messages (name,email,organization,subject,content) VALUES (?,?,?,?,?)',
        [name,email,organization||'',subject||'',content]);
      return res.json({success:true,message:'Tin nhắn đã gửi! Chúng tôi sẽ phản hồi trong 24 giờ.'});
    }
    const user = verifyToken(getTokenFromReq(req));
    if (!user||user.role!=='admin') return res.status(403).json({success:false,message:'Không có quyền'});
    if (req.method === 'GET') {
      const [rows] = await db.query('SELECT * FROM messages ORDER BY created_at DESC');
      return res.json({success:true,data:rows});
    }
    if (req.method === 'PATCH' && req.query.id) {
      await db.query('UPDATE messages SET is_read=1 WHERE id=?',[+req.query.id]);
      return res.json({success:true});
    }
    res.json({success:false,message:'Không hỗ trợ'});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
