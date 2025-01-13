const router = require('express').Router();
const taskController = require('../controllers/taskController');
const { authGuard } = require('../middleware/authGuard');

router.post('/create', authGuard, taskController.createTask);

router.get('/get/:id', authGuard, taskController.getTaskById);

// changeTaskName
router.put('/change_name/:id', authGuard, taskController.changeTaskName);

// deleteTask
router.delete('/delete/:id', authGuard, taskController.deleteTask);

// description
router.put('/change_desc/:id', authGuard, taskController.changeTaskDesc);

// assignTask
router.put('/assign/:id', authGuard, taskController.assignTask);

module.exports = router;
