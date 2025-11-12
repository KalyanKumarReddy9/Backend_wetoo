const axios = require('axios');

async function testOtpEmail() {
  try {
    console.log('Testing OTP email functionality...');
    
    // Use a real email address for testing
    const testEmail = 'kalyankumar.muli64@gmail.com';
    
    console.log(`Sending OTP to ${testEmail}...`);
    const response = await axios.post('http://localhost:4000/api/auth/forgot', {
      email: testEmail
    });
    
    console.log('Response:', response.data);
    console.log('Check your email for the OTP code.');
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testOtpEmail();