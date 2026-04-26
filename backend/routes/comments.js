const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { auth, admin, optionalAuth } = require('../middleware/auth');

router.post('/', optionalAuth, (req, res) => {
  const { article_id, content, guest_name, guest_email } = req.body;
  if (!article_id || !content) return res.status(400).json({ error: 'article_id and content required' });
  if (!req.user && !guest_name) return res.status(400).json({ error: 'Name required for guest comments' });
  const id = uuidv4();
  const requireApproval = db.prepare("SELECT value FROM site_settings WHERE key = 'require_comment_approval'").get();
  const approved = requireApproval?.value === 'true' ? 0 : 1;
  db.prepare('INSERT INTO comments (id, article_id, user_id, guest_name, guest_email, content, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, article_id, req.user?.id || null, guest_name || null, guest_email || null, content, approved);
  res.status(201).json({ id, is_approved: approved });
});

router.delete('/:id', admin, (req, res) => {
  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

router.put('/:id/approve', admin, (req, res) => {
  db.prepare('UPDATE comments SET is_approved = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Approved' });
});

module.exports = router;
