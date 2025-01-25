const router = require('express').Router();
const { authGuard } = require('../middleware/authGuard');
const notificationController = require('../controllers/notificationController');

router.get('/get', authGuard, notificationController.getAllNotifications);
router.get('/unread', authGuard, notificationController.getUnreadNotifications);
// markAsRead
router.put('/mark_as_read', authGuard, notificationController.markAsRead);

module.exports = router;
