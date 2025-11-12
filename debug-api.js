const axios = require('axios');

async function testAPI() {
  console.log('Testing API endpoints...');
  
  try {
    // Test create request
    const requestData = {
      title: 'Test Request',
      description: 'Test description',
      type: 'groceries',
      seniorId: 3,
      requesterName: 'Test Senior',
      requesterPhone: '+1-555-0123'
    };
    
    console.log('Sending request data:', JSON.stringify(requestData, null, 2));
    
    const response = await axios.post('http://localhost:4000/api/senior-requests', requestData);
    
    console.log('Success! Response:', response.data);
    
  } catch (error) {
    console.error('Error details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Headers:', error.response?.headers);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused - is the server running on port 4000?');
    }
  }
}

testAPI();