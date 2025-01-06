const projectModel = require('../models/projectModel');
const path = require('path');
const fs = require('fs');

const uploadImage = async (req, res) => {
  // Check incoming data
  console.log(req.body);

  const { projectImage } = req.files;
  // Check if file is present
  if (!projectImage) {
    return res.status(400).json({
      success: false,
      message: 'File not found',
    });
  }

  // Check if file is an image
  if (!projectImage.mimetype.startsWith('image')) {
    return res.status(400).json({
      success: false,
      message: 'Please upload an image file',
    });
  }

  // Check file size
  if (projectImage.size > process.env.MAX_FILE_UPLOAD) {
    return res.status(400).json({
      success: false,
      message: `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
    });
  }

  //  Upload the image
  // 1. Generate new image name
  const userId = req.user.id;

  const imageName = `${Date.now()}-${userId}-${projectImage.name}`;

  // 2. Make a upload path (/path/upload - directory)
  const imageUploadPath = path.join(
    __dirname,
    `../public/projects/${imageName}`
  );

  // Ensure the directory exists
  const directoryPath = path.dirname(imageUploadPath);
  fs.mkdirSync(directoryPath, { recursive: true });

  try {
    // 3. Move the image to the upload path
    projectImage.mv(imageUploadPath);

    //  send image name to the user
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      image: imageName,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error,
    });
  }
};

const createProject = async (req, res) => {
  // Check incoming data
  console.log(req.body);

  // destructuring
  const { projectName, projectDescription, projectImage } = req.body;

  // Validate data
  if (!projectName || !projectDescription) {
    return res.status(400).json({
      success: false,
      message: 'Project name and description are required',
    });
  }

  // Project name length
  if (projectName.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Project name must be at least 3 characters',
    });
  }

  try {
    // Create project
    const project = await projectModel.create({
      name: projectName,
      description: projectDescription,
      image: projectImage,
      owner: req.user.id,
      members: [req.user.id],
      admin: [req.user.id],
    });

    // Send response
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getMyProjects = async (req, res) => {
  try {
    const projects = await projectModel.find({ owner: req.user.id });
    res
      .status(200)
      .json({ success: true, message: 'Projects fetched', data: projects });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await projectModel
      .findById(req.params.id)
      .populate('members', 'firstName lastName email')
      .populate('owner', 'firstName lastName email')
      .populate('lists');
    res
      .status(200)
      .json({ success: true, message: 'Project fetched', data: project });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getJoinedProjects = async (req, res) => {
  try {
    // Fetch projects where the user is a member but not the owner
    const projects = await projectModel.find({
      members: req.user.id,
      owner: { $ne: req.user.id }, // Exclude projects where the user is the owner
    });

    res
      .status(200)
      .json({ success: true, message: 'Projects fetched', data: projects });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const addListToProject = async (req, res) => {
  try {
    const project = await projectModel.findById(req.params.id);
    project.lists.push(req.body.listId);
    await project.save();
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const inviteMember = async (req, res) => {
  try {
    const project = await projectModel.findById(req.params.id);
    project.members.push(req.body.userId);
    await project.save();
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const removeMember = async (req, res) => {
  try {
    const project = await projectModel.findById(req.params.id);
    project.members.pull(req.body.userId);
    await project.save();
    res.status(200).json({ success: true, data: project });
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
};
