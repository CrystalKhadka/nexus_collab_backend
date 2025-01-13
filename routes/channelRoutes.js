const router = require('express').Router();
const channelController = require('../controllers/channelController');
const { authGuard } = require('../middleware/authGuard');

router.post('/create', authGuard, channelController.createChannel);

router.get('/get_all/:projectId', authGuard, channelController.getChannels);

module.exports = router;
