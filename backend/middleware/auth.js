const jwt = require('jsonwebtoken');
const db = require('../database');

exports.auth = (req, res, next) => {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    const user = db.prepare('SELECT id, name, email, role, avatar FROM users WHERE id = ? AND is_active = 1').get(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

exports.admin = (req, res, next) => {
  exports.auth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  });
};

exports.optionalAuth = (req, res, next) => {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
      req.user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(decoded.id);
    } catch {}
  }
  next();
};
