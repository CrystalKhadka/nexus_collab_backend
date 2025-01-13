const messageModel = require('../models/messageModel');
const userModel = require('../models/userModel');
const channelModel = require('../models/channelModel');
const path = require('path');
const fs = require('fs');

const sendMessage = async (req, res) => {
  // Check the incoming data
  console.log(req.body);

  // sender
  const sender = req.user.id;

  // destructure the request
  const { text, type, recipient } = req.body;

  // validate the request
  if (!text || !type || !recipient) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
    });
  }

  try {
    //   check if the user exists
    const user = await userModel.findById(recipient);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    //   check if the message text is in the enum
    if (!['text', 'image', 'video', 'file'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message type',
      });
    }

    var message = new messageModel({
      sender,
      text,
      type,
      recipient,
      isChannel: false,
      whoRead: [sender],
    });
    await message.save();

    message = await messageModel
      .findById(message._id)
      .populate('sender', 'firstName lastName email image')
      .populate('channel', 'name');

    res.status(200).json({
      success: true,
      data: message,
      message: 'Message sent successfully',
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
};

const sendMessageToChannel = async (req, res) => {
  // Check the incoming data
  console.log(req.body);

  // sender
  const sender = req.user.id;

  // destructure the request
  const { text, type, channelId } = req.body;

  // validate the request
  if (!text || !type || !channelId) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
    });
  }

  try {
    //   check if the channel exists
    const channel = await channelModel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    //   check if the message text is in the enum
    if (!['text', 'image', 'video', 'file'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message type',
      });
    }

    var message = new messageModel({
      sender,
      text,
      type,
      channel: channel._id,
      isChannel: true,
      whoRead: [sender],
    });
    await message.save();

    message = await messageModel
      .findById(message._id)
      .populate('sender', 'firstName lastName email image')
      .populate('channel', 'name');

    //   update the latest message in the channel
    channel.messages.push(message._id);
    channel.newMessageReadBy.push(sender);
    await channel.save();

    res.status(200).json({
      success: true,
      data: message,
      message: 'Message sent successfully',
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
};

// upload file
const uploadFile = async (req, res) => {
  // Check incoming data
  console.log(req.body);

  const { file } = req.files;

  // Check if file is present
  if (!file) {
    return res.status(400).json({
      success: false,
      message: 'File not found',
    });
  }

  // Check the file type for images
  const fileType = file.mimetype.split('/')[0];

  console.log(fileType);

  if (fileType !== 'image' || fileType !== 'video' || fileType !== 'file') {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type',
    });
  }

  try {
    //   get new file name
    const fileName = `${Date.now()}-${req.user.id}-${file.name}`;

    const uploadPath = path.join(
      `${__dirname}/../public/message/${fileType}`,
      fileName
    );

    // Ensure the directory exists
    const directoryPath = path.dirname(uploadPath);
    fs.mkdirSync(directoryPath, { recursive: true });

    file.mv(uploadPath);

    res.status(200).json({
      success: true,
      fileName: fileName,
      fileType: fileType,
      message: 'File uploaded successfully',
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
};

const getMessageByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    //   check if the user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    //   the sender can be the user or the recipient
    const messages = await messageModel
      .find({
        $or: [
          { sender: req.user.id, recipient: req.params.id },
          { sender: req.params.id, recipient: req.user.id },
        ],
      })
      .populate('sender', 'firstName lastName email')
      .populate('recipient', 'firstName lastName email');
    res.status(200).json({
      success: true,
      data: messages,
      message: 'Messages fetched successfully',
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
};

const getMessageByChannel = async (req, res) => {
  try {
    const messages = await messageModel
      .find({ channel: req.params.id })
      .populate('sender', 'firstName lastName email image')
      .populate('channel', 'name')
      .sort({ updatedAt: 1 });
    res.status(200).json({
      success: true,
      data: messages,
      message: 'Messages fetched successfully',
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
};

module.exports = {
  sendMessage,
  sendMessageToChannel,
  uploadFile,
  getMessageByUser,
  getMessageByChannel,
};
