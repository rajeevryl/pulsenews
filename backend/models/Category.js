const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  color: {
    type: String,
    default: '#D92B2B'
  },
  icon: {
    type: String,
    default: '📰'
  },
  description: {
    type: String,
    default: ''
  },
  sort_order: {
    type: Number,
    default: 0
  },
  article_count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);