const { createSequelizeInstance } = require('./src/config/database');

async function checkDbStructure() {
  try {
    console.log('Creating database connection...');
    const db = createSequelizeInstance();
    
    console.log('Testing database connection...');
    await db.authenticate();
    console.log('Database connection successful!');
    
    // Check students table structure
    console.log('\nChecking students table structure...');
    const [studentColumns] = await db.query('DESCRIBE students');
    console.log('Students table columns:');
    studentColumns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key} ${col.Default || ''}`);
    });
    
    // Check seniors table structure
    console.log('\nChecking seniors table structure...');
    const [seniorColumns] = await db.query('DESCRIBE seniors');
    console.log('Seniors table columns:');
    seniorColumns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key} ${col.Default || ''}`);
    });
    
  } catch (error) {
    console.error('Error checking database structure:');
    console.error('Message:', error.message);
    console.error('Code:', error.original?.code);
    console.error('Errno:', error.original?.errno);
    console.error('SQL State:', error.original?.sqlState);
  }
}

checkDbStructure();