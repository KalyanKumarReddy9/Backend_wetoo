const bcrypt = require('bcrypt');
const { OtpToken } = require('../models');
const { sendMail } = require('../utils/mailer');
const { sequelize } = require('../models');

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function requestOtp(req, res) {
  // Log the incoming request for debugging
  console.log('OTP request received:', {
    body: req.body,
    headers: req.headers,
    contentType: req.headers['content-type']
  });
  
  const { email, purpose = 'reset' } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  
  try {
    // For registration purpose, don't check if email exists
    if (purpose === 'reset') {
      // Check if email exists in either Student or Senior database using raw queries
      const [studentResult] = await sequelize.query(
        'SELECT COUNT(*) as count FROM students WHERE email = ?',
        { replacements: [email] }
      );
      
      const [seniorResult] = await sequelize.query(
        'SELECT COUNT(*) as count FROM seniors WHERE email = ?',
        { replacements: [email] }
      );
      
      const studentCount = studentResult[0].count;
      const seniorCount = seniorResult[0].count;
      
      // If user doesn't exist in either database, return error
      if (studentCount === 0 && seniorCount === 0) {
        return res.status(404).json({ message: 'Email not found. Please check your email address or register first.' });
      }
    }
    
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await OtpToken.create({ email, code, purpose, expiresAt });
    
    // Send detailed email with OTP
    const emailHtml = purpose === 'registration' ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">WE TOO - Email Verification</h2>
        <p>Hello,</p>
        <p>Thank you for registering with WE TOO. Please verify your email address to continue.</p>
        <p style="font-size: 20px; font-weight: bold; color: #e74c3c;">Your verification code is: ${code}</p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this verification, please ignore this email.</p>
        <br>
        <p>Best regards,<br>The WE TOO Team</p>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">WE TOO - Password Reset</h2>
        <p>Hello,</p>
        <p>You have requested to reset your password for your WE TOO account.</p>
        <p style="font-size: 20px; font-weight: bold; color: #e74c3c;">Your OTP code is: ${code}</p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this password reset, please ignore this email.</p>
        <br>
        <p>Best regards,<br>The WE TOO Team</p>
      </div>
    `;
    
    const emailText = purpose === 'registration' ? `
      WE TOO - Email Verification
      
      Hello,
      
      Thank you for registering with WE TOO. Please verify your email address to continue.
      
      Your verification code is: ${code}
      
      This code will expire in 10 minutes.
      
      If you did not request this verification, please ignore this email.
      
      Best regards,
      The WE TOO Team
    ` : `
      WE TOO - Password Reset
      
      Hello,
      
      You have requested to reset your password for your WE TOO account.
      
      Your OTP code is: ${code}
      
      This code will expire in 10 minutes.
      
      If you did not request this password reset, please ignore this email.
      
      Best regards,
      The WE TOO Team
    `;
    
    await sendMail({
      to: email,
      subject: purpose === 'registration' ? 'WE TOO - Email Verification Code' : 'WE TOO - Password Reset OTP',
      text: emailText,
      html: emailHtml
    });
    
    return res.json({ message: 'OTP sent' });
  } catch (error) {
    console.error('Error in requestOtp:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function verifyOtp(req, res) {
  console.log('OTP verify request received:', {
    body: req.body,
    headers: req.headers
  });
  
  const { email, code, purpose = 'reset' } = req.body;
  if (!email || !code) return res.status(400).json({ message: 'Email and code required' });
  const token = await OtpToken.findOne({ where: { email, code, purpose, used: false } });
  if (!token) return res.status(400).json({ message: 'Invalid code' });
  if (token.expiresAt < new Date()) return res.status(400).json({ message: 'Code expired' });
  
  // Mark as used for registration purpose
  if (purpose === 'registration') {
    await token.update({ used: true });
  }
  
  return res.json({ message: 'Verified' });
}

async function resetPassword(req, res) {
  console.log('Password reset request received:', {
    body: req.body,
    headers: req.headers
  });
  
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ message: 'Missing fields' });
  const token = await OtpToken.findOne({ where: { email, code, purpose: 'reset', used: false } });
  if (!token) return res.status(400).json({ message: 'Invalid code' });
  if (token.expiresAt < new Date()) return res.status(400).json({ message: 'Code expired' });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  try {
    // Update password in both tables using raw queries
    const [studentResult] = await sequelize.query(
      'UPDATE students SET passwordHash = ? WHERE email = ?',
      { replacements: [passwordHash, email] }
    );
    
    const [seniorResult] = await sequelize.query(
      'UPDATE seniors SET passwordHash = ? WHERE email = ?',
      { replacements: [passwordHash, email] }
    );
    
    await token.update({ used: true });

    const studentUpdated = studentResult.affectedRows > 0;
    const seniorUpdated = seniorResult.affectedRows > 0;
    
    if (!studentUpdated && !seniorUpdated) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Send confirmation email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">WE TOO - Password Reset Successful</h2>
        <p>Hello,</p>
        <p>Your password has been successfully reset for your WE TOO account.</p>
        <p>If you did not perform this action, please contact our support team immediately.</p>
        <br>
        <p>Best regards,<br>The WE TOO Team</p>
      </div>
    `;
    
    const emailText = `
      WE TOO - Password Reset Successful
      
      Hello,
      
      Your password has been successfully reset for your WE TOO account.
      
      If you did not perform this action, please contact our support team immediately.
      
      Best regards,
      The WE TOO Team
    `;
    
    await sendMail({
      to: email,
      subject: 'WE TOO - Password Reset Successful',
      text: emailText,
      html: emailHtml
    });
    
    return res.json({ message: 'Password updated' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { requestOtp, verifyOtp, resetPassword };