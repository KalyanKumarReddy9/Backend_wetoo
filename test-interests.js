const axios = require('axios');

async function testInterests() {
  try {
    console.log('Testing interests functionality...');
    
    console.log('Interests endpoints:');
    console.log('- GET /api/student/interests (list interests)');
    console.log('- POST /api/student/interests (add interest)');
    console.log('- DELETE /api/student/interests/:id (remove interest)');
    
    console.log('\nTo test this functionality:');
    console.log('1. Log in as a student');
    console.log('2. Add an interest');
    console.log('3. Try to add the same interest again (should fail)');
    console.log('4. Remove the interest');
    console.log('5. Add the same interest again (should succeed)');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testInterests();