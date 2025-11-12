const axios = require('axios');
const fs = require('fs');

async function testProfilePicture() {
  try {
    console.log('Testing profile picture functionality...');
    
    // This would typically require authentication, but we can test the endpoint structure
    console.log('Profile picture endpoints:');
    console.log('- POST /api/student/profile/avatar (upload)');
    console.log('- GET /api/student/profile/avatar (fetch)');
    console.log('- GET /api/student/profile (get profile with avatar URL)');
    
    console.log('\nTo test this functionality:');
    console.log('1. Log in as a student');
    console.log('2. Use the app to upload a profile picture');
    console.log('3. Check that the picture is stored as a BLOB in the database');
    console.log('4. Verify that the picture can be retrieved and displayed');
    
    // Test the profile endpoint
    try {
      const response = await axios.get('http://localhost:4000/api/student/profile');
      console.log('\nProfile endpoint response structure:');
      console.log('- Status:', response.status);
      console.log('- Has avatarUrl:', !!response.data.avatarUrl);
      console.log('- Avatar URL:', response.data.avatarUrl || 'Not set');
    } catch (error) {
      if (error.response) {
        console.log('\nProfile endpoint requires authentication (expected)');
        console.log('- Status:', error.response.status);
        console.log('- Error:', error.response.data.message);
      } else {
        console.log('\nError connecting to server:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testProfilePicture();