const axios = require('axios');

async function testOtpValidation() {
  try {
    console.log('Testing OTP validation functionality...');
    
    // Test with a non-existent email
    console.log('\n1. Testing with non-existent email...');
    try {
      const response1 = await axios.post('http://localhost:4000/api/auth/forgot', {
        email: 'nonexistent@example.com'
      });
      console.log('Unexpected success:', response1.data);
    } catch (error) {
      if (error.response) {
        console.log('Expected error for non-existent email:', error.response.data);
      } else {
        console.log('Network error:', error.message);
      }
    }
    
    // First, let's add a test user to the database
    console.log('\n2. Adding a test student to database...');
    try {
      const sequelize = require('./src/config/database').createSequelizeInstance();
      await sequelize.authenticate();
      
      // Insert a test student
      const [result] = await sequelize.query(
        "INSERT IGNORE INTO students (fullName, phoneNumber, email, passwordHash, idProofUrl, termsAccepted, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
        { 
          replacements: [
            'Test User',
            '1234567890',
            'test@example.com',
            '$2b$10$example_hash', // bcrypt hash placeholder
            Buffer.from('test'), // blob data placeholder
            1 // termsAccepted
          ]
        }
      );
      
      console.log('Test user added successfully');
    } catch (error) {
      console.log('Error adding test user:', error.message);
    }
    
    // Test with an existing email
    console.log('\n3. Testing with existing email...');
    try {
      const response2 = await axios.post('http://localhost:4000/api/auth/forgot', {
        email: 'test@example.com'
      });
      console.log('Response for existing email:', response2.data);
    } catch (error) {
      if (error.response) {
        console.log('Error for existing email:', error.response.data);
      } else {
        console.log('Network error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testOtpValidation();