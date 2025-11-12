const { createSequelizeInstance } = require('./src/config/database');

async function testEmailValidation() {
  try {
    console.log('Testing email validation for OTP...');
    
    // Initialize database connection
    const sequelize = createSequelizeInstance();
    await sequelize.authenticate();
    console.log('Database connection successful');
    
    // Test email existence without using the full models
    const emailToTest = 'kalyankumar.muli64@gmail.com';
    
    console.log(`\nChecking if email exists: ${emailToTest}`);
    
    // Check in students table
    const [studentResult] = await sequelize.query(
      'SELECT COUNT(*) as count FROM students WHERE email = ?',
      { replacements: [emailToTest] }
    );
    
    const studentCount = studentResult[0].count;
    console.log(`Student found: ${studentCount > 0}`);
    
    // Check in seniors table
    const [seniorResult] = await sequelize.query(
      'SELECT COUNT(*) as count FROM seniors WHERE email = ?',
      { replacements: [emailToTest] }
    );
    
    const seniorCount = seniorResult[0].count;
    console.log(`Senior found: ${seniorCount > 0}`);
    
    if (studentCount > 0 || seniorCount > 0) {
      console.log('✅ Email exists in database. OTP can be sent.');
    } else {
      console.log('❌ Email does not exist in database. OTP should not be sent.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEmailValidation();