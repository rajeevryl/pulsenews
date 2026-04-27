const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { auth } = require('../middleware/auth');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const id = uuidv4();
  const hashed = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)').run(id, name, email, hashed);
  const user = db.prepare('SELECT id, name, email, role, avatar FROM users WHERE id = ?').get(id);
  res.status(201).json({ token: sign(id), user });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  const { password: _, ...safe } = user;
  res.json({ token: sign(user.id), user: safe });
});

// Get profile
router.get('/me', auth, (req, res) => {
  const saved = db.prepare('SELECT COUNT(*) as c FROM saved_articles WHERE user_id = ?').get(req.user.id);
  res.json({ ...req.user, saved_count: saved.c });
});

// Update profile
router.put('/me', auth, (req, res) => {
  const { name, bio } = req.body;
  db.prepare('UPDATE users SET name = ?, bio = ? WHERE id = ?').run(name || req.user.name, bio || '', req.user.id);
  res.json({ message: 'Profile updated' });
});

// Change password
router.put('/password', auth, (req, res) => {
  const { current, newPassword } = req.body;
  const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(current, user.password)) return res.status(400).json({ error: 'Current password incorrect' });
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.user.id);
  res.json({ message: 'Password changed' });
});

module.exports = router;