'use strict';
const router    = require('express').Router();
const { getDB } = require('../config/database');
const { requireAdmin } = require('../config/session');

/* POST /api/messages */
router.post('/', async (req, res) => {
  const { name, email, organization, subject, content } = req.body;
  if (!name || !email || !content)
    return res.json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
  try {
    const db = await getDB();
    await db.query(
      'INSERT INTO messages (name,email,organization,subject,content) VALUES (?,?,?,?,?)',
      [name, email, organization||'', subject||'', content]
    );
    res.json({ success: true, message: 'Tin nhắn đã được gửi! Chúng tôi sẽ phản hồi trong 24 giờ.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* GET /api/messages  (admin) */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const db    = await getDB();
    const [rows] = await db.query('SELECT * FROM messages ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* PATCH /api/messages/:id/read  (admin) */
router.patch('/:id/read', requireAdmin, async (req, res) => {
  try {
    const db = await getDB();
    await db.query('UPDATE messages SET is_read=1 WHERE id=?', [+req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
