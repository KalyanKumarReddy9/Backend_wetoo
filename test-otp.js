const axios = require('axios');

async function testOtp() {
  try {
    console.log('Testing OTP functionality...');
    
    // Test sending OTP
    console.log('Sending OTP...');
    const response = await axios.post('http://localhost:4000/api/auth/forgot', {
      email: 'test@example.com'
    });
    
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testOtp();