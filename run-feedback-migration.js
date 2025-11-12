const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  try {
    console.log('Connecting to database...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'student_senior_db'
    });

    console.log('✅ Connected to database successfully');
    
    // Run the migration commands separately
    const commands = [
      'ALTER TABLE senior_feedback MODIFY COLUMN requestId INT UNSIGNED NULL',
      'ALTER TABLE senior_feedback MODIFY COLUMN seniorId INT UNSIGNED NULL',
      'ALTER TABLE senior_feedback MODIFY COLUMN studentId INT UNSIGNED NULL'
    ];
    
    // Try to add new columns (ignore errors if they already exist)
    const addColumnCommands = [
      'ALTER TABLE senior_feedback ADD COLUMN servicesNeeded TEXT NULL',
      'ALTER TABLE senior_feedback ADD COLUMN featuresNeeded TEXT NULL'
    ];
    
    for (const command of commands) {
      console.log(`📋 Running command: ${command}`);
      await connection.execute(command);
      console.log(`✅ Command completed successfully`);
    }
    
    // Try to add columns, but ignore if they already exist
    for (const command of addColumnCommands) {
      try {
        console.log(`📋 Running command: ${command}`);
        await connection.execute(command);
        console.log(`✅ Command completed successfully`);
      } catch (error) {
        if (error.message.includes('Duplicate column name')) {
          console.log(`ℹ️  Column already exists, skipping: ${command}`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ All migrations completed successfully');
    
    // Close the connection
    await connection.end();
    console.log('🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error stack:', error.stack);
  }
}

runMigration();