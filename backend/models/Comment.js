const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  article_id: {
    type: String, // article slug
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  guest_name: {
    type: String,
    trim: true
  },
  guest_email: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  is_approved: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema);