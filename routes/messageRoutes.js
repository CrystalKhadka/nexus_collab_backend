const router = require('express').Router();

const messageController = require('../controllers/messageController');
const { authGuard } = require('../middleware/authGuard');

router.post('/send_message', authGuard, messageController.sendMessage);

router.post(
  '/send_message_to_channel',
  authGuard,
  messageController.sendMessageToChannel
);

router.post('/upload_file', authGuard, messageController.uploadFile);

router.get(
  '/get_message_by_user/:id',
  authGuard,
  messageController.getMessageByUser
);

router.get(
  '/get_message_by_channel/:id',
  authGuard,
  messageController.getMessageByChannel
);

module.exports = router;
