const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users', // Reference the 'users' collection for the sender
    },
    text: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      required: true,
    },
    isChannel: {
      type: Boolean,

      default: false,
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'channels', // Reference the 'chats' collection
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users', // Reference the 'users' collection for the recipient
    },

    whoRead: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
      },
    ],
  },
  { timestamps: true }
  // Timestamps are automatically added by Mongoose
);

const Message = mongoose.model('messages', messageSchema);

module.exports = Message;
