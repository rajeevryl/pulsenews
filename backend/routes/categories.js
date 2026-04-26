const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { admin } = require('../middleware/auth');

router.get('/', (req, res) => {
  const cats = db.prepare(`
    SELECT c.*, COUNT(a.id) as article_count
    FROM categories c
    LEFT JOIN articles a ON a.category_id = c.id AND a.status = 'published'
    GROUP BY c.id ORDER BY c.sort_order ASC
  `).all();
  res.json(cats);
});

router.post('/', admin, (req, res) => {
  const { name, color, icon, description } = req.body;
  const id = uuidv4();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  db.prepare('INSERT INTO categories (id, name, slug, color, icon, description) VALUES (?, ?, ?, ?, ?, ?)').run(id, name, slug, color || '#D92B2B', icon || '📰', description || '');
  res.status(201).json({ id, slug });
});

router.put('/:id', admin, (req, res) => {
  const { name, color, icon, description } = req.body;
  db.prepare('UPDATE categories SET name=?, color=?, icon=?, description=? WHERE id=?').run(name, color, icon, description, req.params.id);
  res.json({ message: 'Updated' });
});

router.delete('/:id', admin, (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
