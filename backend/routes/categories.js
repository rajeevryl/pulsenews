const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Article = require('../models/Article');
const { admin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const categories = await Category.find().sort({ sort_order: 1 });
  // Update article counts
  for (let cat of categories) {
    cat.article_count = await Article.countDocuments({ category_id: cat.slug });
  }
  res.json(categories);
});

router.post('/', admin, async (req, res) => {
  const { name, color, icon, description } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const category = new Category({ name, slug, color: color || '#D92B2B', icon: icon || '📰', description: description || '' });
  await category.save();
  res.status(201).json(category);
});

router.put('/:id', admin, async (req, res) => {
  const { name, color, icon, description } = req.body;
  const category = await Category.findByIdAndUpdate(req.params.id, { name, color, icon, description }, { new: true });
  if (!category) return res.status(404).json({ error: 'Not found' });
  res.json(category);
});

router.delete('/:id', admin, async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;