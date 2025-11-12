const { Router } = require('express');
const ctrl = require('../controllers/auth.controller');
const otp = require('../controllers/otp.controller');

const router = Router();

// Register routes with base64 image support
router.post('/student/register', ctrl.registerStudent);
router.post('/student/login', ctrl.loginStudent);
router.post('/senior/register', ctrl.registerSenior);
router.post('/senior/login', ctrl.loginSenior);

// Password reset (forgot) aliases under /api/auth to match frontend calls
// These map to the OTP controller handlers
router.post('/forgot', otp.requestOtp);
router.post('/forgot/verify', otp.verifyOtp);
router.post('/forgot/reset', otp.resetPassword);

module.exports = router;

