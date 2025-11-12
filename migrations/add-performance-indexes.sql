-- Performance Optimization: Add indexes for faster queries
-- Run this file to optimize database performance before production

USE student_senior_db;

-- Add indexes on frequently queried columns (only if they don't exist)
ALTER TABLE students 
  ADD INDEX IF NOT EXISTS idx_email (email),
  ADD INDEX IF NOT EXISTS idx_created_at (createdAt);

ALTER TABLE seniors 
  ADD INDEX IF NOT EXISTS idx_email (email),
  ADD INDEX IF NOT EXISTS idx_created_at (createdAt);

ALTER TABLE senior_requests 
  ADD INDEX IF NOT EXISTS idx_senior_id (seniorId),
  ADD INDEX IF NOT EXISTS idx_student_id (assignedStudentId),
  ADD INDEX IF NOT EXISTS idx_status (status),
  ADD INDEX IF NOT EXISTS idx_created_at (createdAt);

ALTER TABLE requests 
  ADD INDEX IF NOT EXISTS idx_senior_id (seniorId),
  ADD INDEX IF NOT EXISTS idx_student_id (studentId),
  ADD INDEX IF NOT EXISTS idx_status (status);

ALTER TABLE donations 
  ADD INDEX IF NOT EXISTS idx_created_at (createdAt),
  ADD INDEX IF NOT EXISTS idx_payment_method (paymentMethod);

ALTER TABLE otp_tokens 
  ADD INDEX IF NOT EXISTS idx_email (email),
  ADD INDEX IF NOT EXISTS idx_expires_at (expiresAt);

-- Clean up old OTP tokens (older than 24 hours)
DELETE FROM otp_tokens WHERE expiresAt < DATE_SUB(NOW(), INTERVAL 24 HOUR);
