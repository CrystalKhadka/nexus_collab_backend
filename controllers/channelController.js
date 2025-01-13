const channelModel = require('../models/channelModel');
const Project = require('../models/projectModel');
const { checkPermissions } = require('./projectController');

const createChannel = async (req, res) => {
  const { name, projectId } = req.body;

  // Validate required fields
  if (!name || !projectId) {
    return res.status(400).json({
      success: false,
      message: 'Channel name and project ID are required',
    });
  }

  try {
    // Check project existence and permissions
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const role = checkPermissions(project, req.user);
    if (role === 'none') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this project',
      });
    }

    // Check channel creation permission
    const channelPermission = project.permissions.channelCreation;
    if (channelPermission === 'Admin' && role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create channels',
      });
    }

    const channel = new channelModel({
      name,
      project: projectId,
    });

    await channel.save();

    res.status(201).json({
      success: true,
      data: channel,
      message: 'Channel created successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

const getChannels = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const role = checkPermissions(project, req.user);
    if (role === 'none') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view channels in this project',
      });
    }

    const channels = await channelModel
      .find({ project: req.params.projectId })
      .populate('project');

    res.status(200).json({
      success: true,
      channels: channels,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

const updateChannel = async (req, res) => {
  const { name } = req.body;

  try {
    const channel = await channelModel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    const project = await Project.findById(channel.project);
    const role = checkPermissions(project, req.user);
    if (role === 'none') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this channel',
      });
    }

    // Only allow creator, admin, or owner to update channel
    if (
      channel.creator.toString() !== req.user.id &&
      role !== 'admin' &&
      role !== 'owner'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this channel',
      });
    }

    if (name) channel.name = name;

    await channel.save();

    res.status(200).json({
      success: true,
      data: channel,
      message: 'Channel updated successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

const deleteChannel = async (req, res) => {
  try {
    const channel = await channelModel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    const project = await Project.findById(channel.project);
    const role = checkPermissions(project, req.user);
    if (role === 'none') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this channel',
      });
    }

    // Only allow admin or owner to delete channel
    if (role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete channels',
      });
    }

    await channel.remove();

    res.status(200).json({
      success: true,
      message: 'Channel deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

module.exports = {
  createChannel,
  getChannels,
  updateChannel,
  deleteChannel,
};
