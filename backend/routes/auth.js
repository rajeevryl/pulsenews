const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const hashed = bcrypt.hashSync(password, 10);
  const user = new User({ name, email, password: hashed });
  await user.save();
  const { password: _, ...safe } = user.toObject();
  res.status(201).json({ token: sign(user._id), user: safe });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = await User.findOne({ email, is_active: true });
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  const { password: _, ...safe } = user.toObject();
  res.json({ token: sign(user._id), user: safe });
});

// Get profile
router.get('/me', auth, async (req, res) => {
  const saved = req.user.saved_articles?.length || 0;
  res.json({ ...req.user.toObject(), saved_count: saved });
});

// Update profile
router.put('/me', auth, async (req, res) => {
  const { name, bio } = req.body;
  req.user.name = name || req.user.name;
  req.user.bio = bio || req.user.bio;
  await req.user.save();
  res.json({ message: 'Profile updated' });
});

// Change password
router.put('/password', auth, async (req, res) => {
  const { current, newPassword } = req.body;
  if (!bcrypt.compareSync(current, req.user.password)) return res.status(400).json({ error: 'Current password incorrect' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  req.user.password = bcrypt.hashSync(newPassword, 10);
  await req.user.save();
  res.json({ message: 'Password updated' });
});

module.exports = router;
  const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(current, user.password)) return res.status(400).json({ error: 'Current password incorrect' });
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.user.id);
  res.json({ message: 'Password changed' });
});

module.exports = router;