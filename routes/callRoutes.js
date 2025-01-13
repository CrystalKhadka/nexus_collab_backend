// callRoutes.js
const router = require('express').Router();
const { authGuard } = require('../middleware/authGuard');
const {
  // Call management endpoints
  beginCall,
  joinCall,
  leaveCall,
  endCall,
  getCallDetails,
  getActiveChannelCalls,
} = require('../controllers/callController');

// Call Management Routes (Protected by authGuard)
router.post('/start', authGuard, beginCall);
router.put('/join/:callId', authGuard, joinCall);
router.put('/leave/:callId', authGuard, leaveCall);
router.put('/end/:callId', authGuard, endCall);
router.get('/:callId', authGuard, getCallDetails);
router.get('/channel/:channelId', authGuard, getActiveChannelCalls);

// Webhook Routes (Protected by webhook secret)
// router.post('/webhooks/session', validateWebhookSecret, handleSessionWebhook);
// router.post(
//   '/webhooks/participant',
//   validateWebhookSecret,
//   handleParticipantWebhook
// );
// router.post(
//   '/webhooks/recording',
//   validateWebhookSecret,
//   handleRecordingWebhook
// );
// router.post(
//   '/webhooks/streaming',
//   validateWebhookSecret,
//   handleStreamingWebhook
// );

module.exports = router;
