const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users',
  },
  text: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  // notification type can be 'message' or 'task'
  type: {
    type: String,
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users',
  },
  readAt: {
    type: Date,
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
});

const Notification = mongoose.model('notifications', notificationSchema);

module.exports = Notification;
