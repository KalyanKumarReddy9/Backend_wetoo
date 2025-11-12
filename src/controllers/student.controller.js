const path = require('path');
const fs = require('fs');
const { Student, StudentInterest, StudentCertification, SeniorRequest, sequelize } = require('../models');

// Helper: ensure student exists by token sub
async function getStudentFromReq(req) {
  const id = req.user?.sub;
  if (!id) return null;
  return Student.findByPk(id);
}

// Debug: database schema/status
async function dbStatus(req, res) {
  try {
    const [tables] = await sequelize.query('SHOW TABLES');
    // Find student_certifications describe if table exists
    const hasCerts = Array.isArray(tables) && JSON.stringify(tables).toLowerCase().includes('student_certifications');
    let certsDesc = null;
    if (hasCerts) {
      const [desc] = await sequelize.query('DESCRIBE `student_certifications`');
      certsDesc = desc;
    }
    return res.json({
      studentDbOk: true,
      tables,
      student_certifications: certsDesc,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'dbStatus failed' });
  }
}

// Avatar (profile picture) upload and fetch
async function uploadAvatar(req, res) {
  const student = await getStudentFromReq(req);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  
  // Check if file was uploaded
  if (!req.file) {
    console.error('uploadAvatar: no file received in request');
    return res.status(400).json({ 
      message: 'No file uploaded. Please select an image file to upload.' 
    });
  }
  
  const upFile = req.file;
  
  try {
    // Use direct buffer from multer memory storage
    const buffer = upFile.buffer;
    const mimeType = upFile.mimetype || 'application/octet-stream';
    const fileName = upFile.originalname || 'avatar.jpg';
    
    // Validate that we have a buffer
    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ message: 'Empty file received' });
    }
    
    console.log('uploadAvatar: studentId=', student.id, 'mimeType=', mimeType, 'fileName=', fileName, 'buffer?', !!buffer, 'buffer.len', buffer?.length || 0);
    
    // Store only in database as BLOB (no caching or other storage)
    await student.update({
      avatarBlob: buffer,
      avatarMimeType: mimeType,
      avatarFileName: fileName,
      // Provide a stable URL the frontend can use
      avatarUrl: '/api/student/profile/avatar',
    });
    
    return res.status(201).json({
      message: 'Avatar updated',
      avatarUrl: '/api/student/profile/avatar',
    });
  } catch (e) {
    console.error('uploadAvatar error:', e);
    return res.status(500).json({ message: e.message || 'Failed to upload avatar' });
  }
}

async function getAvatar(req, res) {
  const student = await getStudentFromReq(req);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  try {
    // Serve directly from database BLOB (no caching)
    if (student.avatarBlob && student.avatarBlob.length > 0) {
      // Ensure we're working with a buffer
      const data = Buffer.isBuffer(student.avatarBlob) 
        ? student.avatarBlob 
        : Buffer.from(student.avatarBlob);
      
      // Set appropriate content type, fallback to octet-stream if not set
      const contentType = student.avatarMimeType || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      
      // Set content disposition for proper file handling
      if (student.avatarFileName) {
        res.setHeader('Content-Disposition', `inline; filename="${student.avatarFileName}"`);
      }
      
      // Add cache-control headers to prevent caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      return res.end(data);
    }
    return res.status(404).json({ message: 'No avatar set' });
  } catch (e) {
    console.error('getAvatar error:', e);
    return res.status(500).json({ message: e.message || 'Failed to read avatar' });
  }
}

// Profile
async function getProfile(req, res) {
  const student = await getStudentFromReq(req);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  
  // Always provide the standard avatar URL if avatar blob exists
  let avatarUrl = null;
  if (student.avatarBlob && student.avatarBlob.length > 0) {
    avatarUrl = '/api/student/profile/avatar';
    // Append timestamp to prevent caching issues
    const timestamp = new Date().getTime();
    avatarUrl = `${avatarUrl}?t=${timestamp}`;
    // Append token if available for authentication
    if (req.token) {
      const sep = avatarUrl.includes('?') ? '&' : '?';
      avatarUrl = `${avatarUrl}${sep}token=${encodeURIComponent(req.token)}`;
    }
  }
  
  return res.json({
    id: student.id,
    fullName: student.fullName,
    email: student.email,
    phoneNumber: student.phoneNumber,
    description: student.description || '',
    avatarUrl,
    // Include student stats for tracking completed tasks, hours served, and score
    completedTasks: student.completedTasks || 0,
    hoursServed: student.hoursServed || 0,
    score: student.score || 0
  });
}

async function updateProfile(req, res) {
  const student = await getStudentFromReq(req);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  const { fullName, phoneNumber, email, description } = req.body;
  if (!fullName || !phoneNumber || !email) return res.status(400).json({ message: 'fullName, phoneNumber and email required' });
  try {
    const updates = { fullName, phoneNumber, email, description };
    // Note: avatarUrl should not be updated here as it's managed by the avatar upload endpoint
    await student.update(updates);
    // Generate avatar URL if avatar blob exists
    let avatarUrl = null;
    if (student.avatarBlob && student.avatarBlob.length > 0) {
      avatarUrl = '/api/student/profile/avatar';
    }
    return res.json({ 
      message: 'Profile updated', 
      student: { 
        id: student.id, 
        fullName, 
        phoneNumber, 
        email, 
        description: student.description || '', 
        avatarUrl 
      } 
    });
  } catch (e) {
    // likely unique constraint on email
    return res.status(400).json({ message: e.message || 'Failed to update profile' });
  }
}

// Interests
async function listInterests(req, res) {
  const studentId = req.user?.sub;
  const { cursor, limit } = req.query;
  const pageSize = Math.min(Number(limit) || 20, 100);
  const where = { studentId };
  if (cursor) where.id = { $lt: Number(cursor) };
  // Use sequelize operators without importing: fallback to literal if needed
  const { Op } = require('sequelize');
  if (cursor) where.id = { [Op.lt]: Number(cursor) };
  const rows = await StudentInterest.findAll({ where, order: [['id', 'DESC']], limit: pageSize });
  const nextCursor = rows.length === pageSize ? rows[rows.length - 1].id : null;
  return res.json({ items: rows, nextCursor });
}

async function addInterest(req, res) {
  const studentId = req.user?.sub;
  const { type } = req.body;
  console.log('Adding interest for studentId:', studentId, 'type:', type);
  
  if (!type) {
    console.log('Interest type is required');
    return res.status(400).json({ message: 'type required' });
  }
  
  try {
    // Check if interest already exists for this student
    const existingInterest = await StudentInterest.findOne({ 
      where: { studentId, type } 
    });
    
    if (existingInterest) {
      console.log('Interest already exists for studentId:', studentId, 'type:', type);
      return res.status(409).json({ message: 'Interest already exists' });
    }
    
    // Create new interest
    const row = await StudentInterest.create({ studentId, type });
    console.log('Interest created successfully:', row.id);
    return res.status(201).json(row);
  } catch (error) {
    console.error('Error adding interest:', error);
    return res.status(500).json({ message: 'Failed to add interest' });
  }
}

async function deleteInterest(req, res) {
  const studentId = req.user?.sub;
  const { id } = req.params;
  
  try {
    // First verify the interest belongs to this student
    const interest = await StudentInterest.findOne({ 
      where: { id, studentId } 
    });
    
    if (!interest) {
      return res.status(404).json({ message: 'Interest not found' });
    }
    
    // Delete the interest
    await interest.destroy();
    return res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting interest:', error);
    return res.status(500).json({ message: 'Failed to delete interest' });
  }
}

// Certifications
async function listCertifications(req, res) {
  const studentId = req.user?.sub;
  const { cursor, limit } = req.query;
  const pageSize = Math.min(Number(limit) || 20, 100);
  const { Op } = require('sequelize');
  const where = { studentId };
  if (cursor) where.id = { [Op.lt]: Number(cursor) };
  const rows = await StudentCertification.findAll({ where, order: [['id', 'DESC']], limit: pageSize });
  // Compute transient URL for blob fetch; expose as filePath for backward-compat
  for (const r of rows) {
    let publicUrl = `/api/student/certifications/${r.id}/file`;
    if (req.token) publicUrl = `${publicUrl}?token=${encodeURIComponent(req.token)}`;
    r.dataValues.filePath = publicUrl;
  }
  const nextCursor = rows.length === pageSize ? rows[rows.length - 1].id : null;
  return res.json({ items: rows, nextCursor });
}

async function uploadCertification(req, res) {
  const studentId = req.user?.sub;
  console.log('=== UPLOAD CERTIFICATION START ===');
  console.log('Student ID:', studentId);
  console.log('Request body keys:', Object.keys(req.body));
  console.log('File received:', !!req.file);

  const title = req.body.title || req.file?.originalname || 'Certification';
  const up = req.file;
  
  if (!up) {
    console.error('ERROR: No file in request. Make sure to send file with field name "file"');
    return res.status(400).json({ message: 'File is required. Send as multipart form-data with field name "file"' });
  }
  
  try {
    const buffer = up.buffer;
    const mimeType = up.mimetype || 'application/octet-stream';
    const fileName = up.originalname || 'file';

    console.log('File info - Name:', fileName, 'Size:', up.size, 'Type:', mimeType);
    console.log('Buffer present:', !!buffer, 'Length:', buffer?.length || 0);

    if (!buffer) {
      return res.status(400).json({ message: 'File buffer is empty' });
    }

    console.log('Creating certification with:', {
      studentId,
      title,
      mimeType,
      fileName,
      bufferLength: buffer.length
    });

    const row = await StudentCertification.create({
      studentId,
      title,
      fileBlob: buffer,
      mimeType: mimeType,
      fileName: fileName,
    });
    
    console.log('SUCCESS: Created certification with ID:', row.id);

    // Expose a stable URL to fetch the file
    let publicUrl = `/api/student/certifications/${row.id}/file`;
    if (req.token) publicUrl = `${publicUrl}?token=${encodeURIComponent(req.token)}`;
    row.dataValues.filePath = publicUrl;

    return res.status(201).json(row);
  } catch (e) {
    console.error('UPLOAD ERROR:', e);
    return res.status(500).json({ message: e.message || 'Upload failed' });
  }
}

async function getCertificationFile(req, res) {
  const studentId = req.user?.sub;
  const { id } = req.params;
  const row = await StudentCertification.findOne({ where: { id, studentId } });
  if (!row) return res.status(404).json({ message: 'Not found' });
  try {
    if (row.fileBlob) {
      const data = Buffer.from(row.fileBlob);
      res.setHeader('Content-Type', row.mimeType || 'application/octet-stream');
      if (row.fileName) res.setHeader('Content-Disposition', `inline; filename="${row.fileName}"`);
      return res.end(data);
    }
    return res.status(404).json({ message: 'File not found' });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Failed to read file' });
  }
}

async function deleteCertification(req, res) {
  const studentId = req.user?.sub;
  const { id } = req.params;
  const row = await StudentCertification.findOne({ where: { id, studentId } });
  if (!row) return res.status(404).json({ message: 'Not found' });
  try {
    // No-op: files are stored in DB as BLOBs
  } catch (_e) {}
  await row.destroy();
  return res.json({ message: 'Deleted' });
}

// Feedback functions removed - using senior_feedback table instead

// Get student volunteer stats
// Save push token for student
async function savePushToken(req, res) {
  try {
    const studentId = req.user?.sub;
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    const { pushToken } = req.body;
    if (!pushToken) {
      return res.status(400).json({ message: 'Push token is required' });
    }

    const { Student } = require('../models');
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await student.update({ pushToken });

    return res.json({ message: 'Push token saved successfully' });
  } catch (error) {
    console.error('Error saving push token:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getVolunteerStats(req, res) {
  try {
    const studentId = req.user?.sub;
    if (!studentId) {
      return res.status(401).json({ message: 'Student not authenticated' });
    }

    // Get completed tasks count
    const completedTasks = await SeniorRequest.count({
      where: {
        assignedStudentId: studentId,
        status: 'completed'
      }
    });

    // Get total hours from completed tasks (sum of estimatedDuration)
    const hoursResult = await SeniorRequest.sum('estimatedDuration', {
      where: {
        assignedStudentId: studentId,
        status: 'completed'
      }
    });

    const hours = hoursResult || 0;

    return res.json({
      completedTasks,
      hours: parseFloat(hours.toFixed(1)), // Round to 1 decimal place
      points: hours * 100 // 100 points per hour
    });
  } catch (error) {
    console.error('Error fetching volunteer stats:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  listInterests,
  addInterest,
  deleteInterest,
  listCertifications,
  uploadCertification,
  getCertificationFile,
  deleteCertification,
  uploadAvatar,
  getAvatar,
  getVolunteerStats,
  savePushToken,
  // Debug export wired below
  dbStatus,
};
