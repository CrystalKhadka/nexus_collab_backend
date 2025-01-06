const router = require('express').Router();
const taskController = require('../controllers/taskController');
const { authGuard } = require('../middleware/authGuard');

router.post('/create', authGuard, taskController.createTask);

router.get('/get/:id', authGuard, taskController.getTaskById);

// changeTaskName
router.put('/change_name/:id', authGuard, taskController.changeTaskName);

module.exports = router;
