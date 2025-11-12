const bcrypt = require('bcrypt');
const { Student, Senior } = require('../models');
const { signToken } = require('../utils/jwt');

// Helper: parse a data URL like 'data:image/jpeg;base64,....' and return Buffer
function dataUrlToBuffer(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return null;
  const meta = dataUrl.slice(0, commaIdx); // e.g., 'data:image/jpeg;base64'
  const base64 = dataUrl.slice(commaIdx + 1);
  if (!/;base64$/i.test(meta)) return null;
  try {
    return Buffer.from(base64, 'base64');
  } catch (e) {
    return null;
  }
}

async function registerStudent(req, res) {
  try {
    const { fullName, phoneNumber, email, password, confirmPassword, termsAccepted, idProof } = req.body;
    
    // Validate base64 image data
    if (!idProof || !idProof.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Valid ID proof image is required' });
    }

  // registration request received
    
    // Validate all required fields
    if (!fullName || !phoneNumber || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    
    if (!termsAccepted) {
      return res.status(400).json({ message: 'You must accept the terms and conditions' });
    }
    
    // Check if email already exists
    const existing = await Student.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    const imageBuffer = dataUrlToBuffer(idProof);
    if (!imageBuffer) {
      return res.status(400).json({ message: 'Invalid image data' });
    }
    const student = await Student.create({ 
      fullName,
      phoneNumber,
      email,
      passwordHash,
      idProofUrl: imageBuffer, // Store binary buffer in BLOB column
      termsAccepted
    });
    
  // student registered
    return res.status(201).json({ message: 'Student registered successfully' });
  } catch (err) {
    console.error('Student registration error:', err);
    return res.status(500).json({ message: 'Registration failed', error: err.message });
  }
}

async function loginStudent(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const user = await Student.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = signToken({ sub: user.id, role: 'student' });
    return res.json({ token, user: { id: user.id, fullName: user.fullName, email: user.email } });
  } catch (err) {
    console.error('Student login error:', err);
    return res.status(500).json({ message: 'Login failed', error: err.message });
  }
}

async function registerSenior(req, res) {
  try {
    const { fullName, age, email, password, confirmPassword, termsAccepted, idProof } = req.body;
    
    // Validate base64 image data
    if (!idProof || !idProof.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Valid ID proof image is required' });
    }
    
    // Validate all required fields
    if (!fullName || !age || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    
    if (Number(age) < 60) {
      return res.status(400).json({ message: 'Age must be 60 or above' });
    }
    
    if (!termsAccepted) {
      return res.status(400).json({ message: 'You must accept the terms and conditions' });
    }
    
    // Check if email already exists
    const existing = await Senior.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    const imageBuffer = dataUrlToBuffer(idProof);
    if (!imageBuffer) {
      return res.status(400).json({ message: 'Invalid image data' });
    }
    const senior = await Senior.create({ 
      fullName, 
      age, 
      email, 
      passwordHash,
      govtIdProofUrl: imageBuffer, // Store binary buffer in BLOB column
      termsAccepted
    });
    
  // senior registered
    return res.status(201).json({ message: 'Senior registered successfully' });
  } catch (err) {
    console.error('Senior registration error:', err);
    return res.status(500).json({ message: 'Registration failed', error: err.message });
  }
}

async function loginSenior(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const user = await Senior.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = signToken({ sub: user.id, role: 'senior' });
    return res.json({ token, user: { id: user.id, fullName: user.fullName, email: user.email } });
  } catch (err) {
    console.error('Senior login error:', err);
    return res.status(500).json({ message: 'Login failed', error: err.message });
  }
}

module.exports = {
  registerStudent,
  loginStudent,
  registerSenior,
  loginSenior,
};