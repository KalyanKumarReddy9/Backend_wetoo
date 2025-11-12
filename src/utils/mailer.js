const nodemailer = require('nodemailer');

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
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 60000,   // 60 seconds
      socketTimeout: 60000,     // 60 seconds
      logger: true,
      debug: process.env.NODE_ENV !== 'production'
    });
  } else {
    // Fallback transport (SendGrid or similar)
    // For now, we'll just return null to indicate no fallback configured
    return null;
  }
}

async function sendMail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || 'WE TOO <noreply@wetoo.local>';
  
  try {
    console.log('Attempting to send email:', { to, subject, from });
    
    // Try primary transport (Gmail)
    const transporter = createTransport(true);
    
    // Test connection first
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    
    const result = await transporter.sendMail({ from, to, subject, text, html });
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Failed to send email with primary transport:', {
      error: error.message,
      code: error.code,
      command: error.command,
      to,
      subject,
      from
    });
    
    // Log additional error details
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
    if (error.responseCode) {
      console.error('SMTP Response Code:', error.responseCode);
    }
    
    // Try fallback mechanism here if needed
    // For now, we'll just re-throw the error
    
    throw error;
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