const { createSequelizeInstance } = require('./src/config/database');
const { Student, Senior } = require('./src/models');

// Mock request and response objects
const createMockReq = (body) => ({ body });
const createMockRes = () => {
  const res = {
    statusCode: 200,
    data: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
      console.log(`Status: ${this.statusCode}, Data:`, data);
      return this;
    }
  };
  return res;
};

async function testOtpController() {
  try {
    console.log('Testing OTP controller validation...');
    
    // Initialize database connection
    const sequelize = createSequelizeInstance();
    await sequelize.authenticate();
    console.log('Database connection successful');
    
    // Import the controller after database is initialized
    const { requestOtp } = require('./src/controllers/otp.controller');
    
    // Test with a non-existent email
    console.log('\n1. Testing with non-existent email:');
    const req1 = createMockReq({ email: 'nonexistent@example.com' });
    const res1 = createMockRes();
    await requestOtp(req1, res1);
    
    // Test with an existing student email
    console.log('\n2. Testing with existing student email:');
    const student = await Student.findOne();
    if (student) {
      console.log(`Found student: ${student.email}`);
      const req2 = createMockReq({ email: student.email });
      const res2 = createMockRes();
      await requestOtp(req2, res2);
    } else {
      console.log('No student found in database');
    }
    
    // Test with an existing senior email
    console.log('\n3. Testing with existing senior email:');
    const senior = await Senior.findOne();
    if (senior) {
      console.log(`Found senior: ${senior.email}`);
      const req3 = createMockReq({ email: senior.email });
      const res3 = createMockRes();
      await requestOtp(req3, res3);
    } else {
      console.log('No senior found in database');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testOtpController();