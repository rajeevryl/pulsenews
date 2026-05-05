const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  is_active: {
    type: Boolean,
    default: true
  },
  saved_articles: [{
    type: String // article slugs
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);