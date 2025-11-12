const { Router } = require('express');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/requests.controller');

const router = Router();

router.post('/', auth, ctrl.createRequest);
router.get('/', auth, ctrl.listRequests);
router.patch('/:id', auth, ctrl.updateRequest);

module.exports = router;

