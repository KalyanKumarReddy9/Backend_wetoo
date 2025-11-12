const { Router } = require('express');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/student.controller');

const router = Router();

// profile
router.get('/profile', auth, ctrl.getProfile);
router.put('/profile', auth, ctrl.updateProfile);
router.post('/profile/avatar', auth, upload.single('file'), ctrl.uploadAvatar);
router.get('/profile/avatar', auth, ctrl.getAvatar);

// interests
router.get('/interests', auth, ctrl.listInterests);
router.post('/interests', auth, ctrl.addInterest);
router.delete('/interests/:id', auth, ctrl.deleteInterest);

// certifications
router.get('/certifications', auth, ctrl.listCertifications);
router.post('/certifications', auth, upload.single('file'), ctrl.uploadCertification);
router.get('/certifications/:id/file', auth, ctrl.getCertificationFile);
router.delete('/certifications/:id', auth, ctrl.deleteCertification);

// volunteer stats
router.get('/stats', auth, ctrl.getVolunteerStats);

// push notifications
router.post('/push-token', auth, ctrl.savePushToken);

// debug
router.get('/debug/db-status', auth, ctrl.dbStatus);

module.exports = router;
