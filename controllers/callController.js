// callController.js
const Call = require('../models/callModel');
const Channel = require('../models/channelModel');
const {
  generateToken,
  createRoom,
  endRoom,
  VideoCallError,
} = require('../services/callService');
const userModel = require('../models/userModel');
// Original call management functions

const beginCall = async (req, res) => {
  try {
    const { channelId, callType } = req.body;
    const userId = req.user.id;

    if (!channelId || !['audio', 'video'].includes(callType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid channel ID or call type',
      });
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    // Check existing call first
    const existingCall = await Call.findOne({
      channel: channelId,
      status: 'ongoing',
    })
      .populate('host', 'firstName lastName email image')
      .populate('participants.user', 'firstName lastName email image')
      .populate('channel', 'name');

    if (existingCall) {
      return res.status(200).json({
        success: true,
        data: {
          callId: existingCall._id,
          token: existingCall.metadata.token,
          roomId: existingCall.metadata.roomId,
          callDetails: existingCall,
        },
      });
    }

    const existingUser = await userModel.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const token = generateToken({ roomId: channelId, participantId: userId });
    const room = await createRoom(channelId, token);

    const call = new Call({
      channel: channelId,
      callType,
      host: userId,
      participants: [
        {
          user: userId,
          joinedAt: new Date(),
        },
      ],
      metadata: {
        sessionId: `session-${Date.now()}`,
        roomId: room.roomId,
        token,
        startedAt: new Date(),
      },
    });

    await call.save();

    // Populate the saved call instead of making a new query
    const populatedCall = await Call.findById(call._id)
      .populate('host', 'firstName lastName email image')
      .populate('participants.user', 'firstName lastName email image')
      .populate('channel', 'name');

    return res.status(200).json({
      success: true,
      data: {
        callId: call._id,
        token,
        roomId: room.roomId,
        callDetails: populatedCall,
      },
    });
  } catch (error) {
    console.error('Call start error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start call',
    });
  }
};

// joinCall function fix - use atomic operation
const joinCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    // Find call and update participant atomically
    const call = await Call.findOneAndUpdate(
      {
        _id: callId,
        status: 'ongoing',
        // Make sure user isn't already an active participant
        'participants.user': { $ne: userId },
      },
      {
        $push: {
          participants: {
            user: userId,
            joinedAt: new Date(),
            status: 'active',
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('host', 'firstName lastName email image')
      .populate('participants.user', 'firstName lastName email image')
      .populate('channel', 'name');

    if (!call) {
      // Check if user is already in call
      const existingCall = await Call.findOne({
        _id: callId,
        status: 'ongoing',
        'participants.user': userId,
        'participants.status': 'active',
      });

      if (existingCall) {
        return res.status(400).json({
          success: false,
          message: 'Already in call',
        });
      }

      return res.status(404).json({
        success: false,
        message: 'Active call not found',
      });
    }

    const token = generateToken({
      roomId: call.channel.toString(),
      participantId: userId,
    });

    return res.status(200).json({
      success: true,
      data: {
        token,
        roomId: call.metadata.roomId,
        callId: callId,
        callDetails: call,
      },
    });
  } catch (error) {
    console.error('Call join error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to join call',
    });
  }
};

const leaveCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    const call = await Call.findOne({ _id: callId, status: 'ongoing' });
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Active call not found',
      });
    }

    const participantIndex = call.participants.findIndex(
      (p) => p.user.toString() === userId && p.status === 'active'
    );

    if (participantIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Not in call',
      });
    }

    if (call.isHost(userId)) {
      await endCall(req, res);
      return;
    }

    await Call.updateOne(
      { _id: callId, 'participants.user': userId },
      {
        $set: {
          'participants.$.leftAt': new Date(),
          'participants.$.status': 'left',
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Left call successfully',
    });
  } catch (error) {
    console.error('Call leave error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to leave call',
    });
  }
};

const endCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    const call = await Call.findOne({ _id: callId, status: 'ongoing' });
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Active call not found',
      });
    }

    if (!call.isHost(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Only host can end call',
      });
    }

    await endRoom(call.metadata.roomId, call.metadata.token);

    await Call.updateOne(
      { _id: callId },
      {
        $set: {
          status: 'ended',
          endedAt: new Date(),
          'participants.$[].leftAt': new Date(),
          'participants.$[].status': 'left',
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Call ended successfully',
    });
  } catch (error) {
    console.error('Call end error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to end call',
    });
  }
};

const getCallDetails = async (req, res) => {
  try {
    const { callId } = req.params;

    const call = await Call.findById(callId)
      .populate('host', 'name avatar')
      .populate('participants.user', 'name avatar')
      .populate('channel', 'name');

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }

    const callDetails = {
      ...call.toObject(),
      duration: call.getDuration(),
      activeParticipants: call.getActiveParticipants().length,
    };

    delete callDetails.metadata.token;

    res.status(200).json({
      success: true,
      data: callDetails,
    });
  } catch (error) {
    console.error('Call details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch call details',
    });
  }
};

const getActiveChannelCalls = async (req, res) => {
  try {
    const { channelId } = req.params;

    const calls = await Call.find({
      channel: channelId,
      status: 'ongoing',
    })
      .populate('host', 'name avatar')
      .populate('participants.user', 'name avatar')
      .select('-metadata.token');

    const callsWithStats = calls.map((call) => ({
      ...call.toObject(),
      duration: call.getDuration(),
      activeParticipants: call.getActiveParticipants().length,
    }));

    res.status(200).json({
      success: true,
      data: callsWithStats,
      isCallActive: calls.length > 0,
    });
  } catch (error) {
    console.error('Active calls error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch active calls',
    });
  }
};

// Webhook handling functions

const validateWebhookSecret = (req, res, next) => {
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({
      success: false,
      message: 'Invalid webhook secret',
    });
  }
  next();
};

const handleSessionWebhook = async (req, res) => {
  try {
    const { event, roomId, sessionId, timestamp } = req.body;

    const call = await Call.findOne({
      'metadata.roomId': roomId,
      status: 'ongoing',
    });

    if (!call) {
      console.warn(`Call not found for room ${roomId}`);
      return res.status(200).json({ success: true });
    }

    switch (event) {
      case 'session-started':
        await Call.updateOne(
          { _id: call._id },
          {
            $set: {
              'metadata.sessionStarted': timestamp,
            },
          }
        );
        break;

      case 'session-ended':
        await Call.updateOne(
          { _id: call._id },
          {
            $set: {
              status: 'ended',
              endedAt: timestamp,
              'participants.$[].status': 'left',
              'participants.$[].leftAt': timestamp,
            },
          }
        );
        break;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Session webhook error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Webhook processing failed' });
  }
};

const handleParticipantWebhook = async (req, res) => {
  try {
    const { event, roomId, participantId, timestamp } = req.body;

    const call = await Call.findOne({
      'metadata.roomId': roomId,
      status: 'ongoing',
    });

    if (!call) {
      console.warn(`Call not found for room ${roomId}`);
      return res.status(200).json({ success: true });
    }

    switch (event) {
      case 'participant-joined':
        await Call.updateOne(
          {
            _id: call._id,
            'participants.user': participantId,
          },
          {
            $set: {
              'participants.$.status': 'active',
              'participants.$.joinedAt': timestamp,
            },
          }
        );
        break;

      case 'participant-left':
        await Call.updateOne(
          {
            _id: call._id,
            'participants.user': participantId,
          },
          {
            $set: {
              'participants.$.status': 'left',
              'participants.$.leftAt': timestamp,
            },
          }
        );

        if (call.host.toString() === participantId) {
          await Call.updateOne(
            { _id: call._id },
            {
              $set: {
                status: 'ended',
                endedAt: timestamp,
                'participants.$[].status': 'left',
                'participants.$[].leftAt': timestamp,
              },
            }
          );
        }
        break;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Participant webhook error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Webhook processing failed' });
  }
};

const handleRecordingWebhook = async (req, res) => {
  try {
    const { event, roomId, timestamp, recordingId } = req.body;

    const call = await Call.findOne({
      'metadata.roomId': roomId,
      status: 'ongoing',
    });

    if (!call) {
      console.warn(`Call not found for room ${roomId}`);
      return res.status(200).json({ success: true });
    }

    switch (event) {
      case 'recording-started':
        await Call.updateOne(
          { _id: call._id },
          {
            $set: {
              'metadata.recording': {
                status: 'active',
                startedAt: timestamp,
                recordingId,
              },
            },
          }
        );
        break;

      case 'recording-stopped':
        await Call.updateOne(
          { _id: call._id },
          {
            $set: {
              'metadata.recording.status': 'completed',
              'metadata.recording.endedAt': timestamp,
            },
          }
        );
        break;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Recording webhook error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Webhook processing failed' });
  }
};

const handleStreamingWebhook = async (req, res) => {
  try {
    const { event, roomId, timestamp, streamId } = req.body;

    const call = await Call.findOne({
      'metadata.roomId': roomId,
      status: 'ongoing',
    });

    if (!call) {
      console.warn(`Call not found for room ${roomId}`);
      return res.status(200).json({ success: true });
    }

    const isHLS = event.startsWith('hls-');
    const streamType = isHLS ? 'hls' : 'livestream';
    const streamStatus = event.endsWith('started') ? 'active' : 'ended';

    await Call.updateOne(
      { _id: call._id },
      {
        $set: {
          [`metadata.streaming.${streamType}`]: {
            status: streamStatus,
            [streamStatus === 'active' ? 'startedAt' : 'endedAt']: timestamp,
            streamId,
          },
        },
      }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Streaming webhook error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Webhook processing failed' });
  }
};

module.exports = {
  // Call management endpoints
  beginCall,
  joinCall,
  leaveCall,
  endCall,
  getCallDetails,
  getActiveChannelCalls,

  // Webhook handlers
  validateWebhookSecret,
  handleSessionWebhook,
  handleParticipantWebhook,
  handleRecordingWebhook,
  handleStreamingWebhook,
};
