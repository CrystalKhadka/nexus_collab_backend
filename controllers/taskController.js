const Task = require('../models/taskModel');
const { addTaskToList } = require('./listController');

const createTask = async (req, res) => {
  // Check incoming data
  console.log(req.body);

  // destructure the request
  const { name, index, listId, projectId } = req.body;

  // validate the request
  if (!name || !index || !listId || !projectId) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
    });
  }

  try {
    const task = new Task({
      name: name,

      index,
      list: listId,
      project: projectId,
    });

    await task.save();

    await addTaskToList(listId, task._id);
    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// get by id
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('list')
      .populate('project')
      .populate('members');
    res.status(200).json({
      success: true,
      task: task,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const changeTaskName = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found' });
    }
    task.name = req.body.name;
    await task.save();
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createTask,
  getTaskById,
  changeTaskName,
};
