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

// send invite
router.put('/send_invite', authGuard, projectController.sendInvite);

// accept invite
router.put('/accept_invite', authGuard, projectController.acceptInvite);

// get invited projects
router.get(
  '/get_invited_projects',
  authGuard,
  projectController.getInvitesByUserId
);

// reject invite
router.put('/reject_invite/:id', authGuard, projectController.rejectInvite);

// search projects
router.get('/search', authGuard, projectController.searchProjects);

// update project
router.put('/update/:id', authGuard, projectController.updateProject);

// delete project
router.delete('/delete/:id', authGuard, projectController.deleteProject);

// searchMemberInProjectApi
router.get(
  '/search_member',
  authGuard,
  projectController.searchMemberInProjectApi
);

// getMembers
router.get('/get_members/:id', authGuard, projectController.getMembers);

// getMembersRoleAndTask
router.get(
  '/get_members_role_task/:id',
  authGuard,
  projectController.getMembersRoleAndTask
);

// requestAccess
router.put('/request_access/:id', authGuard, projectController.requestAccess);

// fetchRequestedMembers
router.get(
  '/fetch_requested_members/:id',
  authGuard,
  projectController.fetchRequestedMembers
);

module.exports = router;
