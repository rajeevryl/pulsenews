const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  slug: {
    type: String,
    required: true,
    unique: true
  },

  subheading: {
    type: String,
    trim: true,
    default: ''
  },

  content: {
    type: String,
    required: true,
    trim: true
  },

  cover_image: {
    type: String,
    default: ''
  },

  video: {
    type: String,
    default: ''
  },

  excerpt: {
    type: String,
    trim: true,
    default: ''
  },

  category_id: {
    type: String,
    default: ''
  },

  published_at: {
    type: Date,
    default: Date.now
  },

  tags: {
    type: [String],
    default: []
  },

  is_featured: {
    type: Boolean,
    default: false
  },

  is_breaking: {
    type: Boolean,
    default: false
  },

  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published'
  },

  views: {
    type: Number,
    default: 0
  },

  likes: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Article', articleSchema);