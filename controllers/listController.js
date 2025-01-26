const List = require('../models/listModel');
const Project = require('../models/projectModel');
const Task = require('../models/taskModel');
const { checkPermissions } = require('./projectController');

const createList = async (req, res) => {
  const { name, index, projectId } = req.body;

  if (!name || !index || !projectId) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
    });
  }

  if (index < 0 || index > 100) {
    return res.status(400).json({
      success: false,
      message: 'Index must be between 0 and 100',
    });
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(400).json({
        success: false,
        message: 'Project not found',
      });
    }

    const role = await checkPermissions(project, req.user);
    console.log(role);
    if (role === 'none') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this project',
      });
    }

    const listPermission = project.permissions.listAdding;
    if (listPermission === 'Admin' && role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create a list',
      });
    }

    const list = new List({
      name: name,
      index,
      project: projectId,
    });

    await list.save();
    res.status(201).json({ success: true, data: list });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getLists = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const role = await checkPermissions(project, req.user);
    if (role === 'none') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view lists',
      });
    }

    const lists = await List.find({ project: req.params.projectId })
      .populate('tasks')
      .populate({
        path: 'tasks',
        populate: {
          path: 'members',
          select: 'firstName lastName email image',
        },
      })

      .sort('index');
    res.status(200).json({ success: true, data: lists });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found',
      });
    }

    const project = await Project.findById(list.project);
    const role = await checkPermissions(project, req.user);
    if (role === 'none') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this list',
      });
    }

    res.status(200).json({ success: true, data: list });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const moveTask = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found',
      });
    }

    const project = await Project.findById(list.project);
    const role = await checkPermissions(project, req.user);
    if (role === 'none') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this project',
      });
    }

    const movePermission = project.permissions.taskMoving;
    if (movePermission === 'Admin' && role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to move tasks',
      });
    }

    const taskIndex = list.tasks.indexOf(req.body.taskId);
    list.tasks.splice(taskIndex, 1);
    list.tasks.splice(req.body.index, 0, req.body.taskId);
    await list.save();

    res.status(200).json({ success: true, data: list });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const removeTaskFromList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found',
      });
    }

    const project = await Project.findById(list.project);
    const role = await checkPermissions(project, req.user);
    if (role === 'none') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this project',
      });
    }

    const taskPermission = project.permissions.taskDeleting;
    if (taskPermission === 'Admin' && role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to remove tasks',
      });
    }

    const taskIndex = list.tasks.indexOf(req.body.taskId);
    list.tasks.splice(taskIndex, 1);
    await list.save();

    res.status(200).json({ success: true, data: list });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const editList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found',
      });
    }

    const project = await Project.findById(list.project);
    const role = await checkPermissions(project, req.user);
    if (role === 'none') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this project',
      });
    }

    const editPermission = project.permissions.listEditing;
    if (editPermission === 'Admin' && role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit lists',
      });
    }

    list.name = req.body.name;
    await list.save();

    res.status(200).json({ success: true, data: list });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found',
      });
    }

    const project = await Project.findById(list.project);
    const role = checkPermissions(project, req.user);
    if (role === 'none') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this project',
      });
    }

    const deletePermission = project.permissions.listDeleting;
    if (deletePermission === 'Admin' && role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete lists',
      });
    }

    for (let i = 0; i < list.tasks.length; i++) {
      await Task.findByIdAndDelete(list.tasks[i]);
    }

    // Remove list from project
    project.lists.pull(list._id);
    await project.save();

    // Remove list
    await List.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, data: list });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Utility function for adding tasks to lists
const addTaskToList = async (listId, taskId) => {
  try {
    const list = await List.findById(listId);
    list.tasks.push(taskId);
    await list.save();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Move List index
const moveList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found',
      });
    }
    const listIndex = list.index;
    list.index = req.body.index;
    await list.save();
    res.status(200).json({
      success: true,
      data: list,
      message: `List moved from ${listIndex} to ${req.body.index}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const changeListName = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found',
      });
    }
    list.name = req.body.name;
    await list.save();
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createList,
  getLists,
  getList,
  addTaskToList,
  moveTask,
  removeTaskFromList,
  editList,
  deleteList,
  moveList,
  changeListName,
};
