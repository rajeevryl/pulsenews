const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: String,
  slug: String,
  content: String,
  cover_image: String,
  video: String,
}, { timestamps: true });

module.exports = mongoose.model('Article', articleSchema);