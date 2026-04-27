const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { auth, admin, optionalAuth } = require('../middleware/auth');
const Article = require('../models/Article');

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
}

// ✅ GET ALL ARTICLES
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.json({ articles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET SINGLE ARTICLE
router.get('/:slug', async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug });

    if (!article) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ✅ CREATE ARTICLE
router.post('/', async (req, res) => {
  try {
    const { title, content, cover_image, video } = req.body;

    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();

    const article = new Article({
      title,
      slug,
      content,
      cover_image,
      video
    });

    await article.save();

    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE ARTICLE
router.put('/:id', admin, async (req, res) => {
  try {
    await Article.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE ARTICLE
router.delete('/:id', admin, async (req, res) => {
  try {
    await Article.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;