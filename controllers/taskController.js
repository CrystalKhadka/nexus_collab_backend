const Task = require('../models/taskModel');
const Project = require('../models/projectModel');
const { addTaskToList, removeTaskFromList } = require('./listController');
const { checkPermissions } = require('./projectController');
const List = require('../models/listModel');

const createTask = async (req, res) => {
  const { name, index, listId, projectId } = req.body;

  // Validate required fields
  if (!name || !index || !listId || !projectId) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
    });
  }

  try {
    // Check project permissions
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

    // Check task creation permission
    const taskPermission = project.permissions.taskAdding;
    if (taskPermission === 'Admin' && role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create tasks',
      });
    }

    const task = new Task({
      name,
      index,
      list: listId,
      project: projectId,
      creator: req.user.id,
    });

    await task.save();
    await addTaskToList(listId, task._id);

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('list')
      .populate('project')
      .populate('members');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check project permissions
    const project = await Project.findById(task.project);
    const role = checkPermissions(project, req.user);
    if (role === 'none') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this task',
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const changeTaskName = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Task name is required',
    });
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check project permissions
    const project = await Project.findById(task.project);
    const role = checkPermissions(project, req.user);
    if (role === 'none') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this project',
      });
    }

    // Check task editing permission
    const editPermission = project.permissions.taskEditing;
    if (editPermission === 'Admin' && role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit tasks',
      });
    }

    task.name = name;
    await task.save();

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const changeTaskDesc = async (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({
      success: false,
      message: 'Task name is required',
    });
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check project permissions
    const project = await Project.findById(task.project);
    const role = checkPermissions(project, req.user);
    if (role === 'none') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this project',
      });
    }

    // Check task editing permission
    const editPermission = project.permissions.taskEditing;
    if (editPermission === 'Admin' && role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit tasks',
      });
    }

    task.description = description;
    await task.save();

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check project permissions
    const project = await Project.findById(task.project);
    const role = checkPermissions(project, req.user);
    if (role === 'none') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this project',
      });
    }

    // Check task deletion permission
    const deletePermission = project.permissions.taskDeleting;
    if (deletePermission === 'Admin' && role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete tasks',
      });
    }

    // remove task from list
    const list = await List.findById(task.list);

    await list.tasks.pull(task._id);

    await list.save();

    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const updateTaskDetails = async (req, res) => {
  const { description, dueDate, priority, status } = req.body;

  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check project permissions
    const project = await Project.findById(task.project);
    const role = checkPermissions(project, req.user);
    if (role === 'none') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this project',
      });
    }

    // Check task editing permission
    const editPermission = project.permissions.taskEditing;
    if (editPermission === 'Admin' && role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit tasks',
      });
    }

    // Update only provided fields
    if (description) task.description = description;
    if (dueDate) task.dueDate = dueDate;
    if (priority) task.priority = priority;
    if (status) task.status = status;

    await task.save();

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const assignTask = async (req, res) => {
  const { userId } = req.body;

  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check project permissions
    const project = await Project.findById(task.project);
    const role = checkPermissions(project, req.user);
    if (role === 'none') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this project',
      });
    }

    // Check if the user to be assigned is a project member
    if (!project.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Can only assign tasks to project members',
      });
    }

    // Add user to task members if not already assigned
    if (!task.members.includes(userId)) {
      task.members.push(userId);
      await task.save();
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  createTask,
  getTaskById,
  changeTaskName,
  deleteTask,
  updateTaskDetails,
  assignTask,
  changeTaskDesc,
};
