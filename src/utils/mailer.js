const nodemailer = require('nodemailer');
let sgMail = null;
try {
  // Lazy require; only used if SENDGRID_API_KEY is present
  sgMail = require('@sendgrid/mail');
} catch (e) {
  // package might not be installed yet; handled by feature flag
}

function createTransport(primary = true) {
  if (primary) {
    // Primary transport (Gmail)
    const host = process.env.SMTP_HOST || 'localhost';
    const port = Number(process.env.SMTP_PORT || 1025);
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    // Create transporter with environment-aware TLS settings.
    // Note: In production, make sure SMTP credentials are provided via Render's
    // environment variables (do NOT commit credentials to repo). For Gmail use
    // an App Password (if your account has 2FA) or consider using an API-based
    // provider such as SendGrid/Mailgun.
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports (587 uses STARTTLS)
      auth: user && pass ? { user, pass } : undefined,
      // Only disable certificate verification for local development. In
      // production we should keep rejectUnauthorized=true to avoid MITM risks.
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
      // Keep timeouts modest so API calls don't hang the client too long
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,   // 10 seconds
      socketTimeout: 20000,     // 20 seconds
      logger: true,
      debug: process.env.NODE_ENV !== 'production'
    });
  } else {
    // Fallback transport (SendGrid or similar)
    // For now, we'll just return null to indicate no fallback configured
    return null;
  }
}

async function sendViaSmtp({ from, to, subject, text, html }) {
  const transporter = createTransport(true);
  // Directly attempt to send; skip verify to save time
  return transporter.sendMail({ from, to, subject, text, html });
}

async function sendViaSendGrid({ from, to, subject, text, html }) {
  if (!sgMail || !process.env.SENDGRID_API_KEY) {
    throw new Error('SendGrid not configured');
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to,
    from, // Make sure this is a verified sender in SendGrid
    subject,
    text,
    html,
  };
  const [response] = await sgMail.send(msg);
  return { messageId: response.headers['x-message-id'] || response.headers['x-message-id'], response: response.statusCode };
}

async function sendMail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || 'WE TOO <noreply@wetoo.local>';

  // Prefer SendGrid if configured, it uses HTTPS:443 and avoids SMTP port issues
  const preferSendGrid = Boolean(process.env.SENDGRID_API_KEY);

  console.log('Attempting to send email:', { to, subject, from, preferSendGrid });

  const trySendGridFirst = async () => {
    try {
      const res = await sendViaSendGrid({ from, to, subject, text, html });
      console.log('Email sent via SendGrid:', res);
      return res;
    } catch (e) {
      console.error('SendGrid send failed:', e.message);
      throw e;
    }
  };

  const trySmtp = async () => {
    try {
      const res = await sendViaSmtp({ from, to, subject, text, html });
      console.log('Email sent via SMTP:', res.messageId);
      return res;
    } catch (error) {
      console.error('SMTP send failed:', {
        error: error.message,
        code: error.code,
        command: error.command,
      });
      if (error.response) {
        console.error('SMTP Response:', error.response);
      }
      if (error.responseCode) {
        console.error('SMTP Response Code:', error.responseCode);
      }
      throw error;
    }
  };

  // Determine order based on availability
  if (preferSendGrid) {
    try {
      return await trySendGridFirst();
    } catch (firstErr) {
      // Fallback to SMTP
      try {
        return await trySmtp();
      } catch (secondErr) {
        // Re-throw the original preferred error for clarity
        throw firstErr;
      }
    }
  } else {
    try {
      return await trySmtp();
    } catch (firstErr) {
      // If SMTP failed (eg ETIMEDOUT) and SendGrid is available, try it
      if (process.env.SENDGRID_API_KEY) {
        try {
          return await trySendGridFirst();
        } catch (secondErr) {
          throw firstErr;
        }
      }
      throw firstErr;
    }
  }
}

// Optional helper: verify transport connectivity. This is intentionally
// gated behind ALLOW_SMTP_VERIFY to avoid exposing diagnostics in production.
async function verifyTransport(primary = true) {
  if (process.env.ALLOW_SMTP_VERIFY !== 'true') {
    throw new Error('SMTP verification disabled. Set ALLOW_SMTP_VERIFY=true to enable.');
  }

  const transporter = createTransport(primary);
  return transporter.verify();
}

module.exports = { sendMail, verifyTransport };