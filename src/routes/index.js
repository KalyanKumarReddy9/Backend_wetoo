const { Router } = require('express');
const otpRoutes = require('./otp.routes');

const router = Router();

router.get('/', (_req, res) => {
  res.json({ message: 'WE TOO API' });
});

router.use('/otp', otpRoutes);

module.exports = router;