const nodemailer = require('nodemailer');

function createTransport(primary = true) {
  if (primary) {
    // Primary transport (Gmail)
    const host = process.env.SMTP_HOST || 'localhost';
    const port = Number(process.env.SMTP_PORT || 1025);
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: user && pass ? { user, pass } : undefined,
      tls: {
        rejectUnauthorized: false, // Only for development - should be true in production
        ciphers: 'SSLv3'
      },
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 60000,   // 60 seconds
      socketTimeout: 60000,     // 60 seconds
      logger: true,
      debug: true
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

module.exports = { sendMail };