const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: String,
  subheading: String,
  content: String,
  cover_image: String,
  video: String,   // ✅ store normal youtube link
  slug: String
}, { timestamps: true });

module.exports = mongoose.model('Article', articleSchema);