const Task = require('../models/taskModel');
const Project = require('../models/projectModel');
const { addTaskToList, removeTaskFromList } = require('./listController');
const { checkPermissions } = require('./projectController');
const List = require('../models/listModel');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const notificationModel = require('../models/notificationModel');

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
      message: 'Task Desc is required',
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
      message: 'Task description updated successfully',
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

    // Send notification to the user
    const notification = new notificationModel({
      sender: req.user.id,
      text: `You have been assigned a task: ${task.name}`,
      recipient: userId,
      type: 'task',
    });

    await notification.save();

    // updated task
    const updatedTask = await Task.findById(req.params.id).populate('members');

    res.status(200).json({
      success: true,
      message: 'Task assigned successfully',
      data: updatedTask,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const assignDate = async (req, res) => {
  const { date, type } = req.body;

  if (!date || !type) {
    return res.status(400).json({
      success: false,
      message: 'Date and type are required',
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

    if (type === 'startDate') {
      task.startDate = date;
    } else if (type === 'endDate') {
      task.endDate = date;
    }

    await task.save();

    res.status(200).json({
      success: true,
      data: task,
      message: 'Date assigned successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const changeTaskPriority = async (req, res) => {
  const { priority } = req.body;

  if (!priority) {
    return res.status(400).json({
      success: false,
      message: 'Task Desc is required',
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

    task.priority = priority;
    await task.save();

    res.status(200).json({
      success: true,
      data: task,
      message: 'Priority changed successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
const changeTaskLabel = async (req, res) => {
  const { name, color, type, labelId } = req.body;

  if (!type) {
    return res.status(400).json({
      success: false,
      message: 'Type is required',
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

    // Check if the label name already exists in the task
    if (type === 'add') {
      if (!name || !color) {
        return res.status(400).json({
          success: false,
          message: 'Task Label and Color is required',
        });
      }
      // Add the new label and color to the task
      task.taskLabel.push({ name: name, color: color });
      await task.save();

      return res.status(200).json({
        success: true,
        data: task,
        message: 'Label added successfully',
      });
    }

    if (type === 'remove') {
      if (!labelId) {
        return res.status(400).json({
          success: false,
          message: 'LabelId is required',
        });
      }

      task.taskLabel.pull(labelId);
      await task.save();

      return res.status(200).json({
        success: true,
        data: task,
        message: 'Label Removed successfully',
      });
    }

    if (type === 'update') {
      if (!labelId || !name || !color) {
        return res.status(400).json({
          success: false,
          message: 'LabelId, Task Label and Color is required',
        });
      }

      task.taskLabel = task.taskLabel.map((label) => {
        if (label._id === labelId) {
          return { ...label, name: name, color: color };
        }
      });
      await task.save();
      return res.status(200).json({
        success: true,
        data: task,
        message: 'Label updated successfully',
      });
    }

    res.status(400).json({
      success: false,
      message: 'Invalid type',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const updateCoverImage = async (req, res) => {
  const { cover } = req.files;

  if (!cover) {
    return res.status(400).json({
      success: false,
      message: 'Cover image is required',
    });
  }

  if (!cover.mimetype.startsWith('image')) {
    return res.status(400).json({
      success: false,
      message: 'Please upload an image file',
    });
  }

  // if png image is uploaded
  if (cover.mimetype === 'image/png') {
    return res.status(400).json({
      success: false,
      message: 'Please upload a jpg or jpeg image file',
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

    // New cover image

    const imageName = `${Date.now()}-${task.name}-${cover.name}.jpg`;
    const imageUploadPath = path.join(
      __dirname,
      `../public/task/cover/${imageName}`
    );
    const directoryPath = path.dirname(imageUploadPath);

    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    await cover.mv(imageUploadPath);
    task.taskCover = imageName;

    await task.save();

    res.status(200).json({
      success: true,
      data: task,
      message: 'Cover Image changed successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const getTaskByProjectId = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.id });
    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const addTaskRequirement = async (req, res) => {
  const { text, completed, reqId, type } = req.body;

  if (!type) {
    return res.status(400).json({
      success: false,
      message: 'Type is required',
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

    if (type === 'add') {
      if (!text) {
        return res.status(400).json({
          success: false,
          message: 'Text is required',
        });
      }

      if (typeof completed !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Completed is required',
        });
      }
      task.taskRequirements.push({
        text,
        completed,
      });

      await task.save();
      return res.status(200).json({
        success: true,
        data: task,
        message: 'Task Requirement added successfully',
      });
    }

    if (type === 'remove') {
      if (!reqId) {
        return res.status(400).json({
          success: false,
          message: 'Requirement ID is required',
        });
      }

      task.taskRequirements.pull(reqId);

      await task.save();
      return res.status(200).json({
        success: true,
        data: task,
        message: 'Task Requirement removed successfully',
      });
    }

    if (type === 'toggle') {
      if (!reqId) {
        return res.status(400).json({
          success: false,
          message: 'Requirement ID is required',
        });
      }

      const requirement = task.taskRequirements.find(
        (req) => req._id.toString() === reqId
      );

      if (!requirement) {
        return res.status(404).json({
          success: false,
          message: 'Requirement not found',
        });
      }

      requirement.completed = !requirement.completed;

      // check the requirement progress
      const completedRequirements = task.taskRequirements.filter(
        (req) => req.completed === true
      ).length;
      const totalRequirements = task.taskRequirements.length;
      task.progress = (completedRequirements / totalRequirements) * 100;

      if (task.progress === 100) {
        task.status = 'Completed';
      }

      await task.save();
      return res.status(200).json({
        success: true,
        data: task,
        message: 'Task Requirement toggled successfully',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// change status
const changeTaskStatus = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    task.status = req.body.status;

    await task.save();

    res.status(200).json({
      success: true,
      data: task,
      message: 'Task status updated successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// handle move task
// const moveTask = async (req, res) => {};

const moveTaskFromList = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const list = await List.findById(req.body.listId);
    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found',
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
    const editPermission = project.permissions.taskMoving;
    if (editPermission === 'Admin' && role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit tasks',
      });
    }

    // remove task from current list
    const currentList = await List.findById(task.list);

    // check if the both list are in the same project
    if (currentList.project.toString() !== list.project.toString()) {
      return res.status(403).json({
        success: false,
        message:
          'You do not have permission to move tasks between different projects',
      });
    }

    currentList.tasks.pull(task._id);
    await currentList.save();

    // add task to new list
    list.tasks.push(task._id);
    await list.save();

    task.list = req.body.listId;

    await task.save();
    res.status(200).json({
      success: true,
      data: task,
      message: 'Task moved successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const joinOrLeaveTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (task.members.includes(req.user.id)) {
      console.log(task.members);
      task.members.pull(req.user.id);
      await task.save();
      const updatedTask = await Task.findById(req.params.id).populate(
        'members'
      );
      return res.status(200).json({
        success: true,
        data: updatedTask,
        message: 'You left the task',
      });
    }
    if (!task.members.includes(req.user.id)) {
      task.members.push(req.user.id);
      await task.save();
      const updatedTask = await Task.findById(req.params.id).populate(
        'members'
      );

      return res.status(200).json({
        success: true,
        data: updatedTask,
        message: 'You joined the task',
      });
    }

    res.status(200).json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully',
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
  assignDate,
  changeTaskPriority,
  changeTaskLabel,
  updateCoverImage,
  getTaskByProjectId,
  addTaskRequirement,
  changeTaskStatus,
  moveTaskFromList,
  joinOrLeaveTask,
};
