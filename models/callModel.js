const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  callType: {
    type: String,
    required: true,
    enum: ['audio', 'video', 'screen-sharing'], // Add screen-sharing as a valid type
  },
  participants: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users', // References the users participating in the call
      },
      joinedAt: {
        type: Date, // Timestamp when the participant joined the call
      },
      leftAt: {
        type: Date, // Timestamp when the participant left the call
      },
    },
  ],
  host: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users', // The user who initiated the call
  },
  sharedScreenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users', // References the user currently sharing their screen
  },
  status: {
    type: String,
    required: true,
    enum: ['ongoing', 'completed', 'missed', 'cancelled'], // Call statuses
    default: 'ongoing',
  },
  startedAt: {
    type: Date,
    default: Date.now, // Timestamp when the call started
  },
  endedAt: {
    type: Date, // Timestamp when the call ended
  },
  metadata: {
    sessionId: {
      type: String, // WebRTC session identifier
      required: true,
    },
    signalingServer: {
      type: String, // URL of the WebRTC signaling server
    },
  },
});

const Call = mongoose.model('Call', callSchema);

module.exports = Call;
