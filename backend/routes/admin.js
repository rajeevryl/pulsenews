const express = require('express');
const router = express.Router();
const db = require('../database');
const { admin } = require('../middleware/auth');

// Dashboard stats
router.get('/stats', admin, (req, res) => {
  const totalArticles = db.prepare("SELECT COUNT(*) as c FROM articles").get().c;
  const publishedArticles = db.prepare("SELECT COUNT(*) as c FROM articles WHERE status='published'").get().c;
  const totalUsers = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
  const totalComments = db.prepare("SELECT COUNT(*) as c FROM comments").get().c;
  const totalViews = db.prepare("SELECT SUM(views) as c FROM articles").get().c || 0;
  const totalLikes = db.prepare("SELECT SUM(likes) as c FROM articles").get().c || 0;
  const recentArticles = db.prepare(`
    SELECT a.title, a.views, a.likes, a.published_at, c.name as category_name
    FROM articles a LEFT JOIN categories c ON a.category_id = c.id
    ORDER BY a.published_at DESC LIMIT 5
  `).all();
  const topArticles = db.prepare(`
    SELECT a.title, a.views, a.slug FROM articles a ORDER BY a.views DESC LIMIT 5
  `).all();
  const pendingComments = db.prepare("SELECT COUNT(*) as c FROM comments WHERE is_approved = 0").get().c;

  res.json({ totalArticles, publishedArticles, totalUsers, totalComments, totalViews, totalLikes, recentArticles, topArticles, pendingComments });
});

// All articles for admin
router.get('/articles', admin, (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;
  const cond = status ? `WHERE a.status = '${status}'` : '';
  const articles = db.prepare(`
    SELECT a.id, a.title, a.slug, a.status, a.is_featured, a.is_breaking, a.views, a.likes, a.published_at,
           c.name as category_name, u.name as author_name
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN users u ON a.author_id = u.id
    ${cond} ORDER BY a.created_at DESC LIMIT ? OFFSET ?
  `).all(parseInt(limit), offset);
  const total = db.prepare(`SELECT COUNT(*) as c FROM articles a ${cond}`).get().c;
  res.json({ articles, total });
});

// All users
router.get('/users', admin, (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, created_at, is_active FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

router.put('/users/:id/toggle', admin, (req, res) => {
  const user = db.prepare('SELECT is_active FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(user.is_active ? 0 : 1, req.params.id);
  res.json({ is_active: !user.is_active });
});

// Pending comments
router.get('/comments', admin, (req, res) => {
  const { approved } = req.query;
  const cond = approved !== undefined ? `WHERE c.is_approved = ${approved}` : '';
  const comments = db.prepare(`
    SELECT c.*, a.title as article_title, u.name as user_name
    FROM comments c
    LEFT JOIN articles a ON c.article_id = a.id
    LEFT JOIN users u ON c.user_id = u.id
    ${cond} ORDER BY c.created_at DESC LIMIT 50
  `).all();
  res.json(comments);
});

// Settings
router.get('/settings', admin, (req, res) => {
  const rows = db.prepare('SELECT key, value FROM site_settings').all();
  const settings = {};
  rows.forEach(r => settings[r.key] = r.value);
  res.json(settings);
});

router.put('/settings', admin, (req, res) => {
  const insert = db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)');
  Object.entries(req.body).forEach(([key, value]) => insert.run(key, value));
  res.json({ message: 'Settings saved' });
});

module.exports = router;
