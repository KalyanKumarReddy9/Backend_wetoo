const { Router } = require('express');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/senior.controller');

const router = Router();

// profile
router.get('/profile', auth, ctrl.getProfile);
router.put('/profile', auth, ctrl.updateProfile);
router.post('/push-token', auth, ctrl.savePushToken);
router.get('/profile/:id', ctrl.getProfile); // Allow fetching by ID for public access

module.exports = router;