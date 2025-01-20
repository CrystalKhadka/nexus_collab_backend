const userController = require('../controllers/userControllers');
const router = require('express').Router();
const { authGuard } = require('../middleware/authGuard');
router.post('/register', userController.createUser);

router.post('/send_verification_email', userController.sentVerificationEmail);

router.post('/verify_otp', userController.verifyOTP);

router.post('/login', userController.loginUser);

router.get('/search', authGuard, userController.searchUser);

router.get('/me', authGuard, userController.getMe);

// upload profile pic
router.post('/upload_profile_pic', authGuard, userController.uploadProfilePic);

// update user
router.put('/update', authGuard, userController.updateUser);

// sendForgotPasswordEmail
router.put(
  '/send_forgot_password_email',
  userController.sendForgotPasswordEmail
);

// verifyForgotPasswordOTP
router.put(
  '/verify_forgot_password_otp',
  userController.verifyForgotPasswordOTP
);

// resetPassword
router.put('/reset_password', userController.resetPassword);

module.exports = router;
