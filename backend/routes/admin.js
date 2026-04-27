const express = require('express');
const router = express.Router();
const { admin } = require('../middleware/auth');

const Article = require('../models/Article');

// ✅ DASHBOARD STATS (ONLY ARTICLES)
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

    res.json({
      totalArticles,
      publishedArticles,
      totalUsers: 1,
      totalComments: 0,
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

// KEEP SETTINGS SIMPLE
router.get('/settings', (req, res) => {
  res.json({});
});

router.put('/settings', (req, res) => {
  res.json({ message: 'Settings saved' });
});

module.exports = router;