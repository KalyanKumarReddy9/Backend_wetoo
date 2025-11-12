const { Student, Senior } = require('./src/models');

async function testDbConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test Student model
    const studentCount = await Student.count();
    console.log(`Student table has ${studentCount} records`);
    
    // Test Senior model
    const seniorCount = await Senior.count();
    console.log(`Senior table has ${seniorCount} records`);
    
    console.log('Database connection successful!');
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
}

testDbConnection();