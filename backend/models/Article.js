const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: String,
  slug: String,
  subheading: String,   // ✅ add this
  content: String,
  cover_image: String,
  video: String,        // ✅ add this
  excerpt: String,

  category_id: String,
  tags: [String],

  is_featured: Boolean,
  is_breaking: Boolean,
  status: String,

  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Article', articleSchema);