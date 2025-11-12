const { Router } = require('express');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/chat.controller');

const router = Router();

// Chat endpoint requires authentication
router.post('/', auth, ctrl.chatMessage);

module.exports = router;
