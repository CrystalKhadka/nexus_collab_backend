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
    default: null,
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
      text: String,
      completed: Boolean,
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
  taskLabel: [
    {
      name: String,
      color: String,
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
