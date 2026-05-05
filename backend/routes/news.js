const express = require('express');
const router = express.Router();
const { admin, auth } = require('../middleware/auth');
const Article = require('../models/Article');
const User = require('../models/User');

// 🔹 SLUG FUNCTION
function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Date.now();
}

// 🔹 REMOVE HTML TAGS (IMPORTANT)
function cleanText(text) {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '').trim();
}

// ✅ GET ALL ARTICLES
router.get('/', async (req, res) => {
  try {
    const { category, search, featured, breaking, sort, limit = 12, page = 1 } = req.query;
    const filter = { status: 'published' };

    if (category) {
      filter.category_id = { $regex: `^${category}$`, $options: 'i' };
    }

    if (search) {
      const query = search.trim();
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { excerpt: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } }
      ];
    }

    if (featured === 'true' || featured === true) {
      filter.is_featured = true;
    }

    if (breaking === 'true' || breaking === true) {
      filter.is_breaking = true;
    }

    let sortOptions = { published_at: -1 };
    if (sort === 'popular') sortOptions = { views: -1 };

    const perPage = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));
    const currentPage = Math.max(1, parseInt(page, 10) || 1);

    const total = await Article.countDocuments(filter);
    const articles = await Article.find(filter)
      .sort(sortOptions)
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.json({
      articles,
      pagination: {
        total,
        page: currentPage,
        limit: perPage,
        pages: Math.ceil(total / perPage)
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});// ✅ GET SINGLE ARTICLE
router.get('/:slug', async (req, res) => {
  try {
    const article = await Article.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views: 1 } },
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

// ✅ CREATE ARTICLE (FIXED)
router.post('/', async (req, res) => {
  try {
    let {
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

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content required" });
    }

    // 🔥 CLEAN CONTENT (NO HTML)
    content = cleanText(content);
    excerpt = cleanText(excerpt);

    const slug = slugify(title);

    const article = new Article({
      title: cleanText(title),
      slug,
      subheading: cleanText(subheading),
      content,
      cover_image,
      video,
      excerpt,
      category_id,
      tags,
      is_featured: !!is_featured,
      is_breaking: !!is_breaking,
      status: status || "published",
      views: 0,
      likes: 0
    });

    await article.save();
    res.json(article);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE ARTICLE (FIXED FOR EDIT)
router.put('/slug/:slug', admin, async (req, res) => {
  try {
    let updates = { ...req.body };

    // 🔥 CLEAN TEXT FIELDS
    if (updates.title) updates.title = cleanText(updates.title);
    if (updates.subheading) updates.subheading = cleanText(updates.subheading);
    if (updates.content) updates.content = cleanText(updates.content);
    if (updates.excerpt) updates.excerpt = cleanText(updates.excerpt);

    const updated = await Article.findOneAndUpdate(
      { slug: req.params.slug },
      updates,
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

// ✅ DELETE ARTICLE
router.delete('/slug/:slug', admin, async (req, res) => {
  try {
    const deleted = await Article.findOneAndDelete({ slug: req.params.slug });

    if (!deleted) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json({ message: 'Deleted successfully' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ LIKE ARTICLE
router.post('/:slug/like', auth, async (req, res) => {
  try {
    const article = await Article.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { likes: 1 } },
      { new: true }
    );
    if (!article) return res.status(404).json({ error: 'Not found' });
    res.json({ liked: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ SAVE ARTICLE
router.post('/:slug/save', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const slug = req.params.slug;
    const index = user.saved_articles.indexOf(slug);
    let saved = false;
    if (index > -1) {
      user.saved_articles.splice(index, 1);
    } else {
      user.saved_articles.push(slug);
      saved = true;
    }
    await user.save();
    res.json({ saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET SAVED ARTICLES
router.get('/user/saved', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const articles = await Article.find({ slug: { $in: user.saved_articles } });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;