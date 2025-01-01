const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'projects',
  },
  list: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'lists',
  },

  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
    },
  ],

  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    default: 'pending',
  },
  priority: {
    type: String,
    default: 'low',
  },
  taskRequirements: [
    {
      type: String,
    },
  ],
  taskProgress: {
    type: Number,
    default: 0,
  },
  taskCover: {
    type: String,
    default: null,
  },
  taskAttachments: [
    {
      type: String,
    },
  ],
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'comments',
    },
  ],
});

const Task = mongoose.model('tasks', taskSchema);

module.exports = Task;
