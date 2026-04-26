const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { auth, admin, optionalAuth } = require('../middleware/auth');

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
}

const ARTICLE_SELECT = `
  SELECT a.*, c.name as category_name, c.slug as category_slug, c.color as category_color, c.icon as category_icon,
         u.name as author_name, u.avatar as author_avatar
  FROM articles a
  LEFT JOIN categories c ON a.category_id = c.id
  LEFT JOIN users u ON a.author_id = u.id
`;

// List articles with filters, search, pagination
router.get('/', optionalAuth, (req, res) => {
  const { category, search, page = 1, limit = 12, featured, breaking, sort = 'newest' } = req.query;
  const offset = (page - 1) * limit;
  const conditions = ["a.status = 'published'"];
  const params = [];

  if (category) { conditions.push('c.slug = ?'); params.push(category); }
  if (featured === 'true') { conditions.push('a.is_featured = 1'); }
  if (breaking === 'true') { conditions.push('a.is_breaking = 1'); }
  if (search) { conditions.push("(a.title LIKE ? OR a.excerpt LIKE ?)"); params.push(`%${search}%`, `%${search}%`); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const orderMap = { newest: 'a.published_at DESC', oldest: 'a.published_at ASC', popular: 'a.views DESC', trending: 'a.likes DESC' };
  const orderBy = orderMap[sort] || 'a.published_at DESC';

  const total = db.prepare(`SELECT COUNT(*) as count FROM articles a LEFT JOIN categories c ON a.category_id = c.id ${where}`).get(...params);
  const articles = db.prepare(`${ARTICLE_SELECT} ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`).all(...params, parseInt(limit), offset);

  articles.forEach(a => { try { a.tags = JSON.parse(a.tags); } catch { a.tags = []; } });

  res.json({
    articles,
    pagination: {
      total: total.count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total.count / limit)
    }
  });
});

// Get single article by slug
router.get('/:slug', optionalAuth, (req, res) => {
  const article = db.prepare(`${ARTICLE_SELECT} WHERE a.slug = ? AND a.status = 'published'`).get(req.params.slug);
  if (!article) return res.status(404).json({ error: 'Article not found' });

  // Increment views
  db.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').run(article.id);
  article.views++;

  try { article.tags = JSON.parse(article.tags); } catch { article.tags = []; }

  // Comments
  article.comments = db.prepare(`
    SELECT c.*, u.name as user_name, u.avatar as user_avatar
    FROM comments c LEFT JOIN users u ON c.user_id = u.id
    WHERE c.article_id = ? AND c.is_approved = 1
    ORDER BY c.created_at DESC
  `).all(article.id);

  // Related articles
  article.related = db.prepare(`
    ${ARTICLE_SELECT}
    WHERE a.category_id = ? AND a.id != ? AND a.status = 'published'
    ORDER BY a.published_at DESC LIMIT 4
  `).all(article.category_id, article.id);

  // Liked by current user
  if (req.user) {
    article.liked_by_user = !!db.prepare('SELECT 1 FROM article_likes WHERE user_id = ? AND article_id = ?').get(req.user.id, article.id);
    article.saved_by_user = !!db.prepare('SELECT 1 FROM saved_articles WHERE user_id = ? AND article_id = ?').get(req.user.id, article.id);
  }

  res.json(article);
});

// Like/unlike article
router.post('/:id/like', auth, (req, res) => {
  const existing = db.prepare('SELECT 1 FROM article_likes WHERE user_id = ? AND article_id = ?').get(req.user.id, req.params.id);
  if (existing) {
    db.prepare('DELETE FROM article_likes WHERE user_id = ? AND article_id = ?').run(req.user.id, req.params.id);
    db.prepare('UPDATE articles SET likes = MAX(0, likes - 1) WHERE id = ?').run(req.params.id);
    return res.json({ liked: false });
  }
  db.prepare('INSERT INTO article_likes (user_id, article_id) VALUES (?, ?)').run(req.user.id, req.params.id);
  db.prepare('UPDATE articles SET likes = likes + 1 WHERE id = ?').run(req.params.id);
  res.json({ liked: true });
});

// Save/unsave article
router.post('/:id/save', auth, (req, res) => {
  const existing = db.prepare('SELECT 1 FROM saved_articles WHERE user_id = ? AND article_id = ?').get(req.user.id, req.params.id);
  if (existing) {
    db.prepare('DELETE FROM saved_articles WHERE user_id = ? AND article_id = ?').run(req.user.id, req.params.id);
    return res.json({ saved: false });
  }
  db.prepare('INSERT INTO saved_articles (user_id, article_id) VALUES (?, ?)').run(req.user.id, req.params.id);
  res.json({ saved: true });
});

// Get saved articles
router.get('/user/saved', auth, (req, res) => {
  const saved = db.prepare(`${ARTICLE_SELECT}
    INNER JOIN saved_articles sa ON a.id = sa.article_id
    WHERE sa.user_id = ? ORDER BY sa.created_at DESC`).all(req.user.id);
  saved.forEach(a => { try { a.tags = JSON.parse(a.tags); } catch { a.tags = []; } });
  res.json(saved);
});

// Admin: Create article
router.post('/', admin, (req, res) => {
  const { title, excerpt, content, cover_image, category_id, is_featured, is_breaking, tags, status } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  const id = uuidv4();
  const slug = slugify(title);
  db.prepare(`
    INSERT INTO articles (id, title, slug, excerpt, content, cover_image, category_id, author_id, is_featured, is_breaking, tags, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, slug, excerpt || '', content, cover_image || '', category_id || null, req.user.id,
    is_featured ? 1 : 0, is_breaking ? 1 : 0, JSON.stringify(tags || []), status || 'published');
  res.status(201).json({ id, slug });
});

// Admin: Update article
router.put('/:id', admin, (req, res) => {
  const { title, excerpt, content, cover_image, category_id, is_featured, is_breaking, tags, status } = req.body;
  db.prepare(`
    UPDATE articles SET title=?, excerpt=?, content=?, cover_image=?, category_id=?,
    is_featured=?, is_breaking=?, tags=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).run(title, excerpt || '', content, cover_image || '', category_id, is_featured ? 1 : 0,
    is_breaking ? 1 : 0, JSON.stringify(tags || []), status || 'published', req.params.id);
  res.json({ message: 'Updated' });
});

// Admin: Delete article
router.delete('/:id', admin, (req, res) => {
  db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
