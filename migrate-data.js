const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function migrateData() {
  try {
    // Create connection to MySQL server
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      multipleStatements: true,
    });

    const newDbName = process.env.DB_NAME || 'student_senior_db';
    const oldStudentDb = 'student_registration_db';
    const oldSeniorDb = 'senior_registration_db';

    console.log('Starting data migration...');

    // Create new database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${newDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✓ Created database: ${newDbName}`);

    // Check if old databases exist
    const [databases] = await connection.query('SHOW DATABASES');
    const dbNames = databases.map(db => db.Database);
    
    const hasStudentDb = dbNames.includes(oldStudentDb);
    const hasSeniorDb = dbNames.includes(oldSeniorDb);

    if (!hasStudentDb && !hasSeniorDb) {
      console.log('No old databases found. Migration not needed.');
      await connection.end();
      return;
    }

    // Migration queries
    const migrations = [];

    // Migrate from student database
    if (hasStudentDb) {
      migrations.push(
        // Students table
        `INSERT IGNORE INTO \`${newDbName}\`.students 
         SELECT * FROM \`${oldStudentDb}\`.students`,
        
        // Student interests
        `INSERT IGNORE INTO \`${newDbName}\`.student_interests 
         SELECT * FROM \`${oldStudentDb}\`.student_interests`,
        
        // Student feedback
        `INSERT IGNORE INTO \`${newDbName}\`.student_feedback 
         SELECT * FROM \`${oldStudentDb}\`.student_feedback`,
        
        // Student certifications
        `INSERT IGNORE INTO \`${newDbName}\`.student_certifications 
         SELECT * FROM \`${oldStudentDb}\`.student_certifications`,
        
        // Requests
        `INSERT IGNORE INTO \`${newDbName}\`.requests 
         SELECT * FROM \`${oldStudentDb}\`.requests`,
        
        // OTP tokens
        `INSERT IGNORE INTO \`${newDbName}\`.otp_tokens 
         SELECT * FROM \`${oldStudentDb}\`.otp_tokens`,
        
        // Donations
        `INSERT IGNORE INTO \`${newDbName}\`.donations 
         SELECT * FROM \`${oldStudentDb}\`.donations`
      );
      console.log('✓ Prepared student database migration queries');
    }

    // Migrate from senior database
    if (hasSeniorDb) {
      migrations.push(
        // Seniors table
        `INSERT IGNORE INTO \`${newDbName}\`.seniors 
         SELECT * FROM \`${oldSeniorDb}\`.seniors`
      );
      console.log('✓ Prepared senior database migration queries');
    }

    // Execute migration queries
    for (const query of migrations) {
      try {
        await connection.query(query);
        console.log('✓ Executed migration query successfully');
      } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
          console.log('⚠ Table does not exist in source database, skipping...');
        } else if (error.code === 'ER_DUP_ENTRY') {
          console.log('⚠ Duplicate entry found, skipping...');
        } else {
          console.error('✗ Migration query failed:', error.message);
          console.error('Query:', query);
        }
      }
    }

    console.log('\\n=== Migration Summary ===');
    
    // Show record counts in new database
    await connection.query(`USE \`${newDbName}\``);
    
    const tables = ['students', 'seniors', 'student_interests', 'student_feedback', 
                   'student_certifications', 'requests', 'otp_tokens', 'donations'];
    
    for (const table of tables) {
      try {
        const [result] = await connection.query(`SELECT COUNT(*) as count FROM \`${table}\``);
        console.log(`${table}: ${result[0].count} records`);
      } catch (error) {
        console.log(`${table}: Table does not exist yet`);
      }
    }

    console.log('\\nData migration completed successfully!');
    console.log('\\nNext steps:');
    console.log('1. Update your application to use the new database');
    console.log('2. Test the application thoroughly');
    console.log('3. Once confirmed working, you can drop the old databases');
    console.log(`   DROP DATABASE \`${oldStudentDb}\`;`);
    console.log(`   DROP DATABASE \`${oldSeniorDb}\`;`);

    await connection.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };