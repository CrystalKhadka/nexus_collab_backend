const userController = require('../controllers/userControllers');
const router = require('express').Router();

router.post('/register', userController.createUser);

router.post('/send_verification_email', userController.sentVerificationEmail);

router.post('/verify_otp', userController.verifyOTP);

router.post('/login', userController.loginUser);

module.exports = router;
