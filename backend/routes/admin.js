const express = require('express');
const router = express.Router();
const { admin } = require('../middleware/auth');
const User = require('../models/User');
const Comment = require('../models/Comment');

const Article = require('../models/Article');

// ✅ DASHBOARD STATS
router.get('/stats', admin, async (req, res) => {
  try {
    const totalArticles = await Article.countDocuments();
    const publishedArticles = totalArticles;

    const articles = await Article.find();

    const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);
    const totalLikes = articles.reduce((sum, a) => sum + (a.likes || 0), 0);

    const recentArticles = await Article.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const topArticles = await Article.find()
      .sort({ views: -1 })
      .limit(5);

    const totalUsers = await User.countDocuments({ is_active: true });
    const totalComments = await Comment.countDocuments();
    const pendingComments = await Comment.countDocuments({ is_approved: false });

    res.json({
      totalArticles,
      publishedArticles,
      totalUsers,
      totalComments,
      totalViews,
      totalLikes,
      recentArticles,
      topArticles,
      pendingComments
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ADMIN ARTICLES
router.get('/articles', admin, async (req, res) => {
  try {
    const articles = await Article.find()
      .sort({ createdAt: -1 });

    res.json({
      articles,
      total: articles.length
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ADMIN USERS
router.get('/users', admin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/toggle', admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    user.is_active = !user.is_active;
    await user.save();
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ADMIN COMMENTS
router.get('/comments', admin, async (req, res) => {
  try {
    const comments = await Comment.find().populate('user_id', 'name').sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// KEEP SETTINGS SIMPLE
router.get('/settings', (req, res) => {
  res.json({});
});

router.put('/settings', (req, res) => {
  res.json({ message: 'Settings saved' });
});

module.exports = router;