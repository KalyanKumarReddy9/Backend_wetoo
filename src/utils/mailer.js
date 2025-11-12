const nodemailer = require('nodemailer');

function createTransport() {
  const host = process.env.SMTP_HOST || 'localhost';
  const port = Number(process.env.SMTP_PORT || 1025);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: user && pass ? { user, pass } : undefined,
    tls: {
      rejectUnauthorized: false // Only for development - should be true in production
    },
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 30000      // 30 seconds
  });
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || 'WE TOO <noreply@wetoo.local>';
  const transporter = createTransport();
  
  try {
    console.log('Attempting to send email:', { to, subject, from });
    const result = await transporter.sendMail({ from, to, subject, text, html });
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Failed to send email:', {
      error: error.message,
      code: error.code,
      command: error.command,
      to,
      subject,
      from
    });
    throw error;
  }
}

module.exports = { sendMail };