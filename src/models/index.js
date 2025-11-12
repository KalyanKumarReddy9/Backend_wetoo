const dotenv = require('dotenv');
const { Client } = require('pg');
const { createSequelizeInstance } = require('../config/database');

dotenv.config();

const db = createSequelizeInstance();

// Initialize models
const Student = require('./student/Student')(db);
const Senior = require('./senior/Senior')(db);
const OtpToken = require('./common/OtpToken')(db);
const Request = require('./student/Request')(db);
const StudentInterest = require('./student/StudentInterest')(db);
const StudentCertification = require('./student/StudentCertification')(db);
const StudentFeedback = require('./student/StudentFeedback')(db);
const SeniorRequest = require('./senior/SeniorRequest')(db);
const SeniorFeedback = require('./senior/SeniorFeedback')(db);
const Donation = require('./Donation')(db);

// Define associations
// Senior -> SeniorRequest (One-to-Many)
Senior.hasMany(SeniorRequest, { foreignKey: 'seniorId', as: 'requests' });
SeniorRequest.belongsTo(Senior, { foreignKey: 'seniorId', as: 'senior' });

// Student -> SeniorRequest (One-to-Many through assignment)
Student.hasMany(SeniorRequest, { foreignKey: 'assignedStudentId', as: 'assignedRequests' });
SeniorRequest.belongsTo(Student, { foreignKey: 'assignedStudentId', as: 'assignedStudent' });

// SeniorRequest -> SeniorFeedback (One-to-One)
SeniorRequest.hasOne(SeniorFeedback, { foreignKey: 'requestId', as: 'feedback' });
SeniorFeedback.belongsTo(SeniorRequest, { foreignKey: 'requestId', as: 'request' });

// Senior -> SeniorFeedback (One-to-Many)
Senior.hasMany(SeniorFeedback, { foreignKey: 'seniorId', as: 'feedbackGiven' });
SeniorFeedback.belongsTo(Senior, { foreignKey: 'seniorId', as: 'senior' });

// Student -> SeniorFeedback (One-to-Many)
Student.hasMany(SeniorFeedback, { foreignKey: 'studentId', as: 'feedbackReceived' });
SeniorFeedback.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Student -> StudentInterest (One-to-Many)
Student.hasMany(StudentInterest, { foreignKey: 'studentId', as: 'interests' });
StudentInterest.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Student -> StudentCertification (One-to-Many)
Student.hasMany(StudentCertification, { foreignKey: 'studentId', as: 'certifications' });
StudentCertification.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Student -> StudentFeedback (One-to-Many)
Student.hasMany(StudentFeedback, { foreignKey: 'studentId', as: 'studentFeedback' });
StudentFeedback.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

async function connectAndSync() {
  // Ensure database exists before Sequelize connects
  try {
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER || 'backend_wetoo_user',
      password: process.env.DB_PASS || '',
      database: 'postgres', // Connect to default database to create our database
    });

    await client.connect();

    const dbName = process.env.DB_NAME || 'backend_wetoo';

    // Ensure database exists (non-destructive)
    await client.query(`
      CREATE DATABASE "${dbName}"
      WITH 
      OWNER = ${process.env.DB_USER || 'backend_wetoo_user'}
      ENCODING = 'UTF8'
      LC_COLLATE = 'en_US.UTF-8'
      LC_CTYPE = 'en_US.UTF-8'
      TABLESPACE = pg_default
      CONNECTION LIMIT = -1;
    `);

    await client.end();
  } catch (err) {
    // Database might already exist, which is fine
    console.log('Database creation skipped or already exists:', err.message);
  }

  await db.authenticate();

  // Safer sync: only create new tables, don't alter existing ones
  await db.sync({ force: false });
  
  // Add missing columns if they don't exist
  try {
    // For PostgreSQL, we need to use a different approach to check column existence
    // Check if termsAccepted column exists in students table
    try {
      await db.query(`
        ALTER TABLE students 
        ADD COLUMN IF NOT EXISTS termsAccepted BOOLEAN NOT NULL DEFAULT FALSE
      `);
      console.log('Ensured termsAccepted column exists in students table');
    } catch (err) {
      console.log('Column termsAccepted already exists in students table or error:', err.message);
    }
    
    // Check if termsAccepted column exists in seniors table
    try {
      await db.query(`
        ALTER TABLE seniors 
        ADD COLUMN IF NOT EXISTS termsAccepted BOOLEAN NOT NULL DEFAULT FALSE
      `);
      console.log('Ensured termsAccepted column exists in seniors table');
    } catch (err) {
      console.log('Column termsAccepted already exists in seniors table or error:', err.message);
    }

    // Ensure senior_feedback has servicesNeeded and featuresNeeded columns
    try {
      await db.query(`
        ALTER TABLE senior_feedback 
        ADD COLUMN IF NOT EXISTS servicesNeeded TEXT
      `);
      console.log('Ensured servicesNeeded column exists in senior_feedback table');
      
      await db.query(`
        ALTER TABLE senior_feedback 
        ADD COLUMN IF NOT EXISTS featuresNeeded TEXT
      `);
      console.log('Ensured featuresNeeded column exists in senior_feedback table');
    } catch (err) {
      console.log('Columns servicesNeeded/featuresNeeded already exist in senior_feedback table or error:', err.message);
    }
    
    console.log('Database schema updated successfully');
  } catch (err) {
    console.error('Error updating database schema:', err.message);
  }
}

module.exports = {
  sequelize: db,
  Student,
  Senior,
  OtpToken,
  Request,
  StudentInterest,
  StudentCertification,
  StudentFeedback,
  SeniorRequest,
  SeniorFeedback,
  Donation,
  connectAndSync,
};