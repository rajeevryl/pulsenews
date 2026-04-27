const express = require('express');
const router = express.Router();
const { admin } = require('../middleware/auth');

// ✅ IMPORT MONGODB MODELS
const Article = require('../models/Article');
const User = require('../models/User');
const Comment = require('../models/Comment');

// ✅ DASHBOARD STATS (MONGODB)
router.get('/stats', admin, async (req, res) => {
  try {
    const totalArticles = await Article.countDocuments();
    const publishedArticles = await Article.countDocuments();

    const totalUsers = await User.countDocuments();
    const totalComments = await Comment.countDocuments();

    const allArticles = await Article.find();

    const totalViews = allArticles.reduce((sum, a) => sum + (a.views || 0), 0);
    const totalLikes = allArticles.reduce((sum, a) => sum + (a.likes || 0), 0);

    const recentArticles = await Article.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const topArticles = await Article.find()
      .sort({ views: -1 })
      .limit(5);

    res.json({
      totalArticles,
      publishedArticles,
      totalUsers,
      totalComments,
      totalViews,
      totalLikes,
      recentArticles,
      topArticles,
      pendingComments: 0
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ADMIN ARTICLES (MONGODB)
router.get('/articles', admin, async (req, res) => {
  try {
    const articles = await Article.find()
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({
      articles,
      total: articles.length
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ USERS
router.get('/users', admin, async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
});

// ✅ COMMENTS
router.get('/comments', admin, async (req, res) => {
  const comments = await Comment.find().sort({ createdAt: -1 });
  res.json(comments);
});

// ✅ SETTINGS (keep simple)
router.get('/settings', (req, res) => {
  res.json({});
});

router.put('/settings', (req, res) => {
  res.json({ message: 'Settings saved' });
});

module.exports = router;