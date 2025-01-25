const projectModel = require('../models/projectModel');
const path = require('path');
const fs = require('fs');
const userModel = require('../models/userModel');
const sendProjectInviteEmail = require('../services/sentProjectInvite');
const jwt = require('jsonwebtoken');
const taskModel = require('../models/taskModel');

// Permission check helper function
const checkPermissions = async (project, user) => {
  if (project.owner.toString() === user.id) {
    return 'owner';
  } else if (project.admin.includes(user.id)) {
    return 'admin';
  } else if (project.members.includes(user.id)) {
    return 'all';
  }
  return 'none';
};

const uploadImage = async (req, res) => {
  try {
    const { projectImage } = req.files;
    if (!projectImage) {
      return res.status(400).json({
        success: false,
        message: 'File not found',
      });
    }

    if (!projectImage.mimetype.startsWith('image')) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file',
      });
    }

    if (projectImage.size > process.env.MAX_FILE_UPLOAD) {
      return res.status(400).json({
        success: false,
        message: `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
      });
    }

    const userId = req.user.id;
    const imageName = `${Date.now()}-${userId}-${projectImage.name}`;
    const imageUploadPath = path.join(
      __dirname,
      `../public/projects/${imageName}`
    );
    const directoryPath = path.dirname(imageUploadPath);

    fs.mkdirSync(directoryPath, { recursive: true });
    await projectImage.mv(imageUploadPath);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      image: imageName,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

const createProject = async (req, res) => {
  const { projectName, projectDescription, projectImage } = req.body;

  if (!projectName || !projectDescription) {
    return res.status(400).json({
      success: false,
      message: 'Project name and description are required',
    });
  }

  if (projectName.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Project name must be at least 3 characters',
    });
  }

  try {
    const project = await projectModel.create({
      name: projectName,
      description: projectDescription,
      image: projectImage,
      owner: req.user.id,
      members: [req.user.id],
      admin: [req.user.id],
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getMyProjects = async (req, res) => {
  try {
    const projects = await projectModel.find({ owner: req.user.id });
    res.status(200).json({
      success: true,
      message: 'Projects fetched',
      data: projects,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await projectModel
      .findById(req.params.id)
      .populate('members', 'firstName lastName email image')
      .populate('owner', 'firstName lastName email image')
      .populate('lists');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const role = checkPermissions(project, req.user);
    if (role === 'none' && project.isPrivate) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this project',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Project fetched',
      data: project,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getJoinedProjects = async (req, res) => {
  try {
    const projects = await projectModel.find({
      members: req.user.id,
      owner: { $ne: req.user.id },
    });

    res.status(200).json({
      success: true,
      message: 'Projects fetched',
      data: projects,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const addListToProject = async (req, res) => {
  try {
    const project = await projectModel.findById(req.params.id);
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
        message: 'You do not have permission to modify this project',
      });
    }

    const listPermission = project.permissions.listAdding;
    if (listPermission === 'Admin' && role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add lists',
      });
    }

    project.lists.push(req.body.listId);
    await project.save();
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const sendInvite = async (req, res) => {
  try {
    const project = await projectModel.findById(req.body.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const role = checkPermissions(project, req.user);
    if (
      role === 'none' ||
      (role === 'all' && project.permissions.inviteMembers === 'Admin')
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to invite members',
      });
    }

    if (project.members.includes(req.body.userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of the project',
      });
    }

    if (project.invited.includes(req.body.userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already invited to the project',
      });
    }

    const inviteUser = await userModel.findById(req.body.userId);
    if (!inviteUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const inviteToken = jwt.sign(
      { userId: inviteUser.id, projectId: project._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const emailResponse = await sendProjectInviteEmail({
      email: inviteUser.email,
      projectName: project.name,
      invitedBy: req.user.firstName,
      inviteLink: 'http://localhost:3000/invitations',
    });

    if (!emailResponse) {
      return res.status(400).json({
        success: false,
        message: 'Failed to send invite email',
      });
    }

    project.invited.push(req.body.userId);
    await project.save();

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const acceptInvite = async (req, res) => {
  try {
    const project = await projectModel.findById(req.body.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (project.members.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this project',
      });
    }

    if (!project.invited.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not invited to this project',
      });
    }

    project.members.push(req.user.id);
    project.invited.pull(req.user.id);
    await project.save();

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const removeMember = async (req, res) => {
  try {
    const project = await projectModel.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const role = checkPermissions(project, req.user);
    if (role !== 'owner' && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to remove members',
      });
    }

    // Prevent removing the owner
    if (project.owner.toString() === req.body.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the project owner',
      });
    }

    project.members.pull(req.body.userId);
    project.admin.pull(req.body.userId);
    await project.save();

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const updateProject = async (req, res) => {
  const { name, permissions, isPrivate } = req.body;

  try {
    const project = await projectModel.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const role = checkPermissions(project, req.user);
    if (role !== 'owner' && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this project',
      });
    }

    // Only owner can change permissions
    if (permissions && role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can change permissions',
      });
    }

    if (name) project.name = name;
    if (permissions) project.permissions = permissions;
    if (typeof isPrivate !== 'undefined') project.isPrivate = isPrivate;

    await project.save();
    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await projectModel.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const role = await checkPermissions(project, req.user);
    console.log(role);
    if (role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can delete the project',
      });
    }

    await projectModel.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Project deleted',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getInvitesByUserId = async (req, res) => {
  try {
    const invites = await projectModel.find({
      invited: req.user.id,
      owner: { $ne: req.user.id },
      members: { $ne: req.user.id },
      admin: { $ne: req.user.id },
    });
    res
      .status(200)
      .json({ success: true, message: 'Invites fetched', data: invites });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const rejectInvite = async (req, res) => {
  try {
    const project = await projectModel.findById(req.params.id);
    project.invited.pull(req.user.id);
    await project.save();
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const searchProjects = async (req, res) => {
  try {
    const search = req.query.search || '';
    const projects = await projectModel.find({
      name: { $regex: search, $options: 'i' },
    });
    res.status(200).json({ success: true, projects: projects });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// search_member
const searchMemberInProjectApi = async (req, res) => {
  const search = req.query.search || '';

  const projectId = req.query.id;
  try {
    const project = await projectModel.findById(projectId);
    const members = await userModel
      .find({
        email: { $regex: search, $options: 'i' },
        _id: { $in: (project.members || []).concat(project.admin) },
      })
      .select('-password');
    res.status(200).json({ success: true, data: members });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// get members
const getMembers = async (req, res) => {
  const projectId = req.params.id;

  try {
    const project = await projectModel
      .findById(projectId)
      .populate('members', 'firstName lastName email image')
      .populate('admin', 'firstName lastName email image');
    // Filter me
    const members = project.members;

    res.status(200).json({ success: true, data: members });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getMembersRoleAndTask = async (req, res) => {
  const projectId = req.params.id;

  try {
    // Fetch project with members' basic details
    const project = await projectModel
      .findById(projectId)
      .populate('members', 'firstName lastName email image');

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: 'Project not found' });
    }

    const members = project.members;

    // Fetch all tasks for this project in a single query
    const tasks = await taskModel.find({ project: projectId }).populate('list');

    // Map tasks to members
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const role = await getRole(project, member); // Get role
        const assignedTasks = tasks.filter((task) =>
          task.members.includes(member._id)
        ); // Filter tasks for this member

        return {
          ...member.toObject(),
          role,
          tasks: assignedTasks,
        };
      })
    );

    res.status(200).json({ success: true, data: membersWithDetails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getRole = async (project, member) => {
  if (project.admin.includes(member._id)) {
    return 'admin';
  }
  if (project.owner === member._id) {
    return 'owner';
  }
  //
  if (project.members.some((m) => m._id.equals(member._id))) {
    return 'member';
  }
  return 'none';
};

const requestAccess = async (req, res) => {
  try {
    const project = await projectModel.findById(req.params.id);

    // if the user is already a member
    if (project.members.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this project',
      });
    }

    // if the user is invited
    if (project.invited.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already invited to this project',
      });
    }

    //if the user is pending
    if (project.requests.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already pending for this project',
      });
    }
    project.requests.push(req.user.id);
    await project.save();
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const fetchRequestedMembers = async (req, res) => {
  try {
    const project = await projectModel
      .findById(req.params.id)
      .populate('requests');

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({ success: true, data: project.requests });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  createProject,
  uploadImage,
  getMyProjects,
  getProjectById,
  getJoinedProjects,
  addListToProject,
  removeMember,
  sendInvite,
  acceptInvite,
  updateProject,
  deleteProject,
  checkPermissions,
  getInvitesByUserId,
  rejectInvite,
  searchProjects,
  searchMemberInProjectApi,
  getMembers,
  getMembersRoleAndTask,
  requestAccess,
  fetchRequestedMembers,
};
