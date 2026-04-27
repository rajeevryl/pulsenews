const express = require('express');
const router = express.Router();
const { admin } = require('../middleware/auth');
const Article = require('../models/Article');

// 🔹 SLUG FUNCTION
function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Date.now();
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

// ✅ GET SINGLE ARTICLE BY SLUG
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
    const {
      title,
      subheading,
      content,
      cover_image,
      video,
      excerpt,
      category_id,
      tags,
      is_featured,
      is_breaking,
      status
    } = req.body;

    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();

    const article = new Article({
      title,
      slug,
      subheading,
      content,
      cover_image,
      video,
      excerpt,
      category_id,
      tags,
      is_featured,
      is_breaking,
      status
    });

    await article.save();

    res.json(article);
  } catch (err) {
    console.error(err); // 👈 IMPORTANT
    res.status(500).json({ error: err.message });
  }
});
// ✅ UPDATE ARTICLE USING SLUG
router.put('/slug/:slug', admin, async (req, res) => {
  try {
    const updated = await Article.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE ARTICLE USING SLUG
router.delete('/slug/:slug', admin, async (req, res) => {
  try {
    await Article.findOneAndDelete({ slug: req.params.slug });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;