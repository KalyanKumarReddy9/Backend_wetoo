const { Router } = require('express');
const ctrl = require('../controllers/auth.controller');

const router = Router();

// Register routes with base64 image support
router.post('/student/register', ctrl.registerStudent);
router.post('/student/login', ctrl.loginStudent);
router.post('/senior/register', ctrl.registerSenior);
router.post('/senior/login', ctrl.loginSenior);

module.exports = router;

