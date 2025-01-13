const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'projects',
  },
  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'messages', // References the messages sent in the channel
    },
  ],
  newMessageReadBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users', // References the users who have read the latest message
    },
  ],
});

const Channel = mongoose.model('channels', channelSchema);

module.exports = Channel;
