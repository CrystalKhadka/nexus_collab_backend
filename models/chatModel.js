const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
    },
  ],
  channel: {
    type: String,
    required: true,
  },
});

const Chat = mongoose.model('chats', chatSchema);

module.exports = Chat;
