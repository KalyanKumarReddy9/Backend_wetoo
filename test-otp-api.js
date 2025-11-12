const axios = require('axios');

async function testOtpRequest() {
  try {
    console.log('Testing OTP request...');
    
    const response = await axios.post('https://backend-wetoo.onrender.com/api/otp/request', {
      email: 'kalyankumar.muli64@gmail.com',
      purpose: 'registration'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('Response:', response.data);
    console.log('Status:', response.status);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
  }
}

testOtpRequest();