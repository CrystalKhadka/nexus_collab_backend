const mongoose = require('mongoose');

const callSchema = new mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'channels',
      required: true,
      index: true,
    },

    callType: {
      type: String,
      enum: ['audio', 'video'],
      required: true,
    },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },

    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'users',
          required: true,
        },
        joinedAt: {
          type: Date,
          required: true,
        },
        leftAt: {
          type: Date,
        },
        status: {
          type: String,
          enum: ['active', 'left'],
          default: 'active',
        },
      },
    ],

    status: {
      type: String,
      enum: ['ongoing', 'ended'],
      default: 'ongoing',
      index: true,
    },

    metadata: {
      sessionId: {
        type: String,
        required: true,
        unique: true,
      },
      roomId: {
        type: String,
        required: true,
      },
      token: {
        type: String,
        required: true,
      },
      startedAt: {
        type: Date,
        required: true,
      },
    },

    endedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
callSchema.index({ channel: 1, status: 1 });
callSchema.index({ host: 1 });
callSchema.index({ 'participants.user': 1 });

callSchema.methods.isHost = function (userId) {
  return this.host.toString() === userId.toString();
};

callSchema.methods.isParticipant = function (userId) {
  return this.participants.some(
    (p) => p.user.toString() === userId.toString() && p.status === 'active'
  );
};

callSchema.methods.getActiveParticipants = function () {
  return this.participants.filter((p) => p.status === 'active');
};

callSchema.methods.getDuration = function () {
  const start = new Date(this.metadata.startedAt);
  const end = this.endedAt ? new Date(this.endedAt) : new Date();
  return end - start;
};

module.exports = mongoose.model('calls', callSchema);
