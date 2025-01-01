const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users',
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'tasks',
  },
  text: {
    type: String,
    required: true,
  },
});

const Comment = mongoose.model('comments', commentSchema);

module.exports = Comment;
