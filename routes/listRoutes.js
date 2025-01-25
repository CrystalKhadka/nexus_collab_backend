const router = require('express').Router();
const listController = require('../controllers/listController');
const { authGuard } = require('../middleware/authGuard');

router.post('/create', authGuard, listController.createList);

router.get('/get_all/:projectId', authGuard, listController.getLists);

// moveList
router.put('/move/:id', authGuard, listController.moveList);

// updateList
router.put('/update/:id', authGuard, listController.editList);

// deleteList
router.delete('/delete/:id', authGuard, listController.deleteList);

module.exports = router;
