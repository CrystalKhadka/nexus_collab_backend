const router = require('express').Router();
const listController = require('../controllers/listController');
const { authGuard } = require('../middleware/authGuard');

router.post('/create', authGuard, listController.createList);

router.get('/get_all/:projectId', authGuard, listController.getLists);

// moveList
router.put('/move/:id', authGuard, listController.moveList);

module.exports = router;
