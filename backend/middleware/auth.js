const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.auth = async (req, res, next) => {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.is_active) return res.status(401).json({ error: 'User not found' });
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

exports.optionalAuth = async (req, res, next) => {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
      req.user = await User.findById(decoded.id).select('-password');
    } catch {}
  }
  next();
};
