const { Router } = require('express');
const ctrl = require('../controllers/otp.controller');

const router = Router();

// Registration OTP routes
router.post('/request', ctrl.requestOtp);
router.post('/verify', ctrl.verifyOtp);

// Password reset OTP routes (legacy)
router.post('/forgot', ctrl.requestOtp);
router.post('/forgot/verify', ctrl.verifyOtp);
router.post('/forgot/reset', ctrl.resetPassword);

module.exports = router;

