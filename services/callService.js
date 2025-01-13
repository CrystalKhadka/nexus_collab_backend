const jwt = require('jsonwebtoken');
const axios = require('axios');

// Updated configuration constants with correct video permissions
const CONFIG = {
  API_BASE_URL: 'https://api.videosdk.live/v2',
  TOKEN_EXPIRY: '120m',
  JWT_ALGORITHM: 'HS256',
  // Updated permissions for video calls
  DEFAULT_PERMISSIONS: [
    'allow_join',
    'allow_mod',
    'ask_join',
    'allow_webcam',
    'allow_mic',
    'allow_screen_share',
  ],
  // Updated roles for participants
  DEFAULT_ROLES: ['participant'],
  WEBHOOK_EVENTS: [
    'participant-joined',
    'participant-left',
    'session-started',
    'session-ended',
    'recording-started',
    'recording-stopped',
    'livestream-started',
    'livestream-stopped',
    'hls-started',
    'hls-stopped',
  ],
};

class VideoCallError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = 'VideoCallError';
    this.code = code;
    this.details = details;
  }
}

const requiredEnvVars = [
  'VIDEOSDK_API_KEY',
  'VIDEOSDK_SECRET',
  'WEBHOOK_BASE_URL',
  'WEBHOOK_SECRET',
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

const generateToken = ({ roomId, participantId, permissions, roles }) => {
  try {
    if (!roomId || !participantId) {
      throw new VideoCallError(
        'Missing required parameters',
        'INVALID_PARAMS',
        {
          required: ['roomId', 'participantId'],
        }
      );
    }

    // Ensure we have all required permissions for video calls
    const finalPermissions = new Set([
      ...(permissions || []),
      ...CONFIG.DEFAULT_PERMISSIONS,
    ]);

    const payload = {
      apikey: process.env.VIDEOSDK_API_KEY,
      permissions: Array.from(finalPermissions),
      version: 2,
      roomId,
      participantId,
      roles: roles || CONFIG.DEFAULT_ROLES,
      webhook: {
        endPoint: `${process.env.WEBHOOK_BASE_URL}`,
        secret: process.env.WEBHOOK_SECRET,
      },
      // Add additional claims required for video
      type: 'app',
      businessId: participantId, // Optional: replace with your business ID if needed
    };

    const options = {
      algorithm: CONFIG.JWT_ALGORITHM,
      expiresIn: CONFIG.TOKEN_EXPIRY,
    };

    return jwt.sign(payload, process.env.VIDEOSDK_SECRET, options);
  } catch (error) {
    if (error instanceof VideoCallError) throw error;
    throw new VideoCallError(
      'Token generation failed',
      'TOKEN_GENERATION_ERROR',
      error.message
    );
  }
};

const createRoom = async (customRoomId, token, options = {}) => {
  try {
    if (!customRoomId || !token) {
      throw new VideoCallError(
        'Missing required parameters',
        'INVALID_PARAMS',
        {
          required: ['customRoomId', 'token'],
        }
      );
    }

    const response = await axios.post(
      `${CONFIG.API_BASE_URL}/rooms`,
      {
        customRoomId: `channel-${customRoomId}-${Date.now()}`,
        // webhook: {
        //   endPoint: `${process.env.WEBHOOK_BASE_URL}`,
        //   events: options.webhookEvents || CONFIG.WEBHOOK_EVENTS,
        //   secret: process.env.WEBHOOK_SECRET,
        // },
        // Add required settings for video rooms
        settings: {
          mode: 'CONFERENCE',
          quality: 'high',
          layout: {
            type: 'GRID',
            priority: 'SPEAKER',
            gridSize: 4,
          },
          permissions: {
            askToJoin: false,
            toggleParticipantMic: true,
            toggleParticipantWebcam: true,
            toggleParticipantScreenshare: true,
            removeParticipant: true,
            endMeeting: true,
          },
          ...options.settings,
        },
        ...options,
      },
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new VideoCallError('Room creation failed', 'API_ERROR', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    throw new VideoCallError(
      'Room creation failed',
      'UNKNOWN_ERROR',
      error.message
    );
  }
};

//

const endRoom = async (roomId, token) => {
  try {
    if (!roomId || !token) {
      throw new VideoCallError(
        'Missing required parameters',
        'INVALID_PARAMS',
        {
          required: ['roomId', 'token'],
        }
      );
    }

    const response = await axios.post(
      `${CONFIG.API_BASE_URL}/rooms/deactivate`,

      {
        roomId: roomId,
      },

      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new VideoCallError('Failed to end room', 'API_ERROR', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    throw new VideoCallError(
      'Failed to end room',
      'UNKNOWN_ERROR',
      error.message
    );
  }
};

const getActiveParticipants = async (roomId, token) => {
  try {
    if (!roomId || !token) {
      throw new VideoCallError(
        'Missing required parameters',
        'INVALID_PARAMS',
        {
          required: ['roomId', 'token'],
        }
      );
    }

    const response = await axios.get(
      `${CONFIG.API_BASE_URL}/rooms/${roomId}/participants`,
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new VideoCallError('Failed to fetch participants', 'API_ERROR', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    throw new VideoCallError(
      'Failed to fetch participants',
      'UNKNOWN_ERROR',
      error.message
    );
  }
};

const startRecording = async (roomId, token, options = {}) => {
  try {
    if (!roomId || !token) {
      throw new VideoCallError(
        'Missing required parameters',
        'INVALID_PARAMS',
        {
          required: ['roomId', 'token'],
        }
      );
    }

    const response = await axios.post(
      `${CONFIG.API_BASE_URL}/rooms/${roomId}/recording/start`,
      {
        template: options.template || 'GRID',
        webhook: {
          endPoint: `${process.env.WEBHOOK_BASE_URL}/recording`,
          secret: process.env.WEBHOOK_SECRET,
        },
        ...options,
      },
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new VideoCallError('Failed to start recording', 'API_ERROR', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    throw new VideoCallError(
      'Failed to start recording',
      'UNKNOWN_ERROR',
      error.message
    );
  }
};

const stopRecording = async (roomId, token) => {
  try {
    if (!roomId || !token) {
      throw new VideoCallError(
        'Missing required parameters',
        'INVALID_PARAMS',
        {
          required: ['roomId', 'token'],
        }
      );
    }

    const response = await axios.post(
      `${CONFIG.API_BASE_URL}/rooms/${roomId}/recording/stop`,
      {},
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new VideoCallError('Failed to stop recording', 'API_ERROR', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    throw new VideoCallError(
      'Failed to stop recording',
      'UNKNOWN_ERROR',
      error.message
    );
  }
};

const startLivestream = async (roomId, token, options) => {
  try {
    if (!roomId || !token || !options.streamUrl) {
      throw new VideoCallError(
        'Missing required parameters',
        'INVALID_PARAMS',
        {
          required: ['roomId', 'token', 'streamUrl'],
        }
      );
    }

    const response = await axios.post(
      `${CONFIG.API_BASE_URL}/rooms/${roomId}/livestream/start`,
      {
        template: options.template || 'GRID',
        webhook: {
          endPoint: `${process.env.WEBHOOK_BASE_URL}/streaming`,
          secret: process.env.WEBHOOK_SECRET,
        },
        ...options,
      },
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new VideoCallError('Failed to start livestream', 'API_ERROR', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    throw new VideoCallError(
      'Failed to start livestream',
      'UNKNOWN_ERROR',
      error.message
    );
  }
};

const stopLivestream = async (roomId, token) => {
  try {
    if (!roomId || !token) {
      throw new VideoCallError(
        'Missing required parameters',
        'INVALID_PARAMS',
        {
          required: ['roomId', 'token'],
        }
      );
    }

    const response = await axios.post(
      `${CONFIG.API_BASE_URL}/rooms/${roomId}/livestream/stop`,
      {},
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new VideoCallError('Failed to stop livestream', 'API_ERROR', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    throw new VideoCallError(
      'Failed to stop livestream',
      'UNKNOWN_ERROR',
      error.message
    );
  }
};

module.exports = {
  generateToken,
  createRoom,
  endRoom,
  getActiveParticipants,
  startRecording,
  stopRecording,
  startLivestream,
  stopLivestream,
  VideoCallError,
  CONFIG,
};
