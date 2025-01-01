const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'projects',
  },
  name: {
    type: String,
    required: true,
  },
  tasks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'tasks',
    },
  ],
  index: {
    type: Number,
    required: true,
  },
});

const List = mongoose.model('lists', listSchema);

module.exports = List;
