const notificationModel = require('../models/notificationModel');
const userModel = require('../models/userModel');
const { checkPermissions } = require('./projectController');

const getAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }
    const notifications = await notificationModel
      .find({ recipient: userId })

      .sort({ date: -1 });
    res
      .status(200)
      .json({ success: true, notifications, count: notifications.length });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const notifications = await notificationModel
      .find({ recipient: userId, isRead: false })
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      notifications: notifications,
      count: notifications.length,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }
    const notifications = await notificationModel
      .find({ recipient: userId })
      .sort({ date: -1 });
    notifications.forEach(async (notification) => {
      notification.isRead = true;
      await notification.save();
    });
    res.status(200).json({ success: true, data: notifications });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getAllNotifications, getUnreadNotifications, markAsRead };
