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

// ✅ GET SINGLE ARTICLE BY SLUG + INCREMENT VIEWS
router.get('/:slug', async (req, res) => {
  try {
    const article = await Article.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views: 1 } }, // 🔥 FIX: auto increase views
      { new: true }
    );

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

    const slug = slugify(title);

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
      status,
      views: 0,      // 🔥 ensure default
      likes: 0
    });

    await article.save();
    res.json(article);

  } catch (err) {
    console.error(err);
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

// ✅ DELETE ARTICLE USING SLUG (FIX RESPONSE)
router.delete('/slug/:slug', admin, async (req, res) => {
  try {
    const deleted = await Article.findOneAndDelete({ slug: req.params.slug });

    if (!deleted) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json({ message: 'Deleted successfully' }); // 🔥 FIX
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;