const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Use memory storage so req.file.buffer is available for BLOB persistence
const storage = multer.memoryStorage();

// 10 MB limit; allow common image/PDF types
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
      'application/pdf',
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    // fallback: allow unknown but warn
    console.warn('upload fileFilter: allowing uncommon type', file.mimetype);
    return cb(null, true);
  },
});

module.exports = upload;
