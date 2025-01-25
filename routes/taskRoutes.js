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

// assignDate
router.put('/assign_date/:id', authGuard, taskController.assignDate);

// changeTaskPriority
router.put(
  '/change_priority/:id',
  authGuard,
  taskController.changeTaskPriority
);

// changeTaskLabel
router.put('/change_label/:id', authGuard, taskController.changeTaskLabel);

// updateCoverImage
router.put(
  '/update_cover_image/:id',
  authGuard,
  taskController.updateCoverImage
);

// getTaskByProjectId
router.get('/get_by_project/:id', authGuard, taskController.getTaskByProjectId);

// addTaskRequirement
router.put(
  '/add_requirement/:id',
  authGuard,
  taskController.addTaskRequirement
);

// changeTaskStatus
router.put('/change_status/:id', authGuard, taskController.changeTaskStatus);

// moveTaskFromList
router.put('/move/:id', authGuard, taskController.moveTaskFromList);

// joinOrLeaveTask
router.put('/join_or_leave/:id', authGuard, taskController.joinOrLeaveTask);

module.exports = router;
