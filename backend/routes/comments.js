const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const { auth, admin, optionalAuth } = require('../middleware/auth');

router.post('/', optionalAuth, async (req, res) => {
  const { article_id, content, guest_name, guest_email } = req.body;
  if (!article_id || !content) return res.status(400).json({ error: 'article_id and content required' });
  if (!req.user && !guest_name) return res.status(400).json({ error: 'Name required for guest comments' });
  const comment = new Comment({
    article_id,
    user_id: req.user?._id,
    guest_name,
    guest_email,
    content,
    is_approved: true // or check settings
  });
  await comment.save();
  res.status(201).json(comment);
});

router.get('/', async (req, res) => {
  const { article_slug } = req.query;
  if (!article_slug) return res.status(400).json({ error: 'article_slug required' });
  const comments = await Comment.find({ article_id: article_slug, is_approved: true }).populate('user_id', 'name').sort({ createdAt: -1 });
  res.json(comments);
});

router.delete('/:id', admin, async (req, res) => {
  const comment = await Comment.findByIdAndDelete(req.params.id);
  if (!comment) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

router.put('/:id/approve', admin, async (req, res) => {
  const comment = await Comment.findByIdAndUpdate(req.params.id, { is_approved: true }, { new: true });
  if (!comment) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Approved' });
});

module.exports = router;