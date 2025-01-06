const router = require('express').Router();
const projectController = require('../controllers/projectController');
const { authGuard } = require('../middleware/authGuard');

router.post('/create', authGuard, projectController.createProject);

router.post('/upload_image', authGuard, projectController.uploadImage);

// router.get('/get_all', authGuard, projectController.getAllProjects);

router.get('/get/:id', authGuard, projectController.getProjectById);

router.get('/get_my_projects', authGuard, projectController.getMyProjects);

router.get(
  '/get_joined_projects',
  authGuard,
  projectController.getJoinedProjects
);

router.put('/add_list/:id', authGuard, projectController.addListToProject);

module.exports = router;
