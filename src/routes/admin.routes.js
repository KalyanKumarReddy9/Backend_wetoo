const { Router } = require('express');
const { verifyTransport } = require('../utils/mailer');
const { sendMail } = require('../utils/mailer');

const router = Router();

// Simple auth: requires header x-admin-token to match MAIL_DIAG_TOKEN
router.use((req, res, next) => {
  if (process.env.ENABLE_ADMIN_ROUTES !== 'true') {
    return res.status(404).json({ message: 'Not Found' });
  }
  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.MAIL_DIAG_TOKEN) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
});

// GET /api/admin/email-config - show which provider is active
router.get('/email-config', async (req, res) => {
  const hasSendGrid = Boolean(process.env.SENDGRID_API_KEY);
  const smtp = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER ? '[set]' : undefined,
    pass: process.env.SMTP_PASS ? '[set]' : undefined,
  };
  const from = process.env.EMAIL_FROM;
  return res.json({
    provider: hasSendGrid ? 'sendgrid' : 'smtp',
    hasSendGrid,
    smtp,
    from,
  });
});

// GET /api/admin/email-verify - try transporter.verify() for SMTP
router.get('/email-verify', async (req, res) => {
  try {
    const result = await verifyTransport(true);
    return res.json({ ok: true, result });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message, code: e.code, command: e.command });
  }
});

// POST /api/admin/email-test - send a test email (to query/body)
router.post('/email-test', async (req, res) => {
  const to = req.body?.to || req.query?.to;
  if (!to) return res.status(400).json({ message: 'Provide recipient via body.to or ?to=' });
  try {
    const result = await sendMail({
      to,
      subject: 'WE TOO - Diagnostic test email',
      text: 'This is a diagnostic email from WE TOO backend.',
      html: '<p>This is a <strong>diagnostic</strong> email from WE TOO backend.</p>',
    });
    return res.json({ ok: true, result });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message, code: e.code, command: e.command });
  }
});

module.exports = router;
