const List = require('../models/listModel');

const createList = async (req, res) => {
  console.log(req.body);

  // destructure the request
  const { name, index, projectId } = req.body;

  // validate the request
  if (!name || !index || !projectId) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
    });
  }

  // validate the index
  if (index < 0 || index > 100) {
    return res.status(400).json({
      success: false,
      message: 'Index must be between 0 and 100',
    });
  }

  try {
    const list = new List({
      name: name,
      index,
      project: projectId,
    });

    await list.save();

    res.status(201).json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const getLists = async (req, res) => {
  try {
    const lists = await List.find({ project: req.params.projectId })
      .populate('tasks')
      .sort('index');
    res.status(200).json({
      success: true,
      data: lists,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const getList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const addTaskToList = async (listId, taskId) => {
  try {
    const list = await List.findById(listId);
    list.tasks.push(taskId);
    await list.save();
  } catch (error) {
    console.log(error);
  }
};

const moveTask = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    const taskIndex = list.tasks.indexOf(req.body.taskId);
    list.tasks.splice(taskIndex, 1);
    list.tasks.splice(req.body.index, 0, req.body.taskId);
    await list.save();
    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const removeTaskFromList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    const taskIndex = list.tasks.indexOf(req.body.taskId);
    list.tasks.splice(taskIndex, 1);
    await list.save();
    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  createList,
  getLists,
  getList,
  addTaskToList,
  moveTask,
  removeTaskFromList,
};
