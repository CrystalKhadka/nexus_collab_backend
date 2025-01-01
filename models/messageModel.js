const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users', // Reference the 'users' collection for the sender
  },
  text: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    required: true,
  },
  isChannel: {
    type: Boolean,
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'receiverType', // Dynamic reference based on receiverType
  },
  receiverType: {
    type: String,
    required: true,
    enum: ['users', 'channels'], // Specifies the collections that `receiver` can reference
  },
  whoRead: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
    },
  ],
});

const Message = mongoose.model('messages', messageSchema);

module.exports = Message;
