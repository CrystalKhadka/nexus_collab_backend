const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users',
  },

  image: {
    type: String,
    default: null,
  },

  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
    },
  ],
  tasks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'tasks',
    },
  ],
  lists: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'lists',
    },
  ],
  admin: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
    },
  ],
  invited: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
    },
  ],
  requests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
    },
  ],

  chats: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'chats',
  },

  permissions: {
    commenting: {
      type: String,
      default: 'all',
    },
    taskEditing: {
      type: String,
      default: 'all',
    },
    taskDeleting: {
      type: String,
      default: 'all',
    },
    taskAdding: {
      type: String,
      default: 'all',
    },
    listEditing: {
      type: String,
      default: 'all',
    },
    listDeleting: {
      type: String,
      default: 'all',
    },
    listAdding: {
      type: String,
      default: 'all',
    },
    listMoving: {
      type: String,
      default: 'all',
    },
    taskMoving: {
      type: String,
      default: 'all',
    },
    changePermissions: {
      type: String,
      default: 'all',
    },
    chat: {
      type: String,
      default: 'all',
    },

    channelCreation: {
      type: String,
      default: 'all',
    },
    timeline: {
      type: String,
      default: 'all',
    },
    calendar: {
      type: String,
      default: 'all',
    },
  },
});

const Project = mongoose.model('projects', projectSchema);

module.exports = Project;
