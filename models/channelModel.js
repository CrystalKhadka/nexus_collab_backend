const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users', // References the users who are members of the channel
    },
  ],
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

const Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;
