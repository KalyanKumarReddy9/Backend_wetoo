const axios = require('axios');

async function testFrontendAPIFixes() {
  console.log('🧪 Testing Frontend API Fixes\n');
  
  const API_BASE = 'http://localhost:4000/api';
  
  try {
    // Test 1: Create a request for testing
    console.log('1️⃣ Creating test request...');
    const requestData = {
      title: 'Frontend API Test Request',
      description: 'Testing API fixes for frontend',
      type: 'groceries',
      seniorId: 3,
      estimatedDuration: 60,
      requesterName: 'Test Senior',
      requesterPhone: '+1-555-TEST'
    };
    
    const createResponse = await axios.post(`${API_BASE}/senior-requests`, requestData);
    const requestId = createResponse.data.id;
    console.log(`✅ Request created with ID: ${requestId}\n`);
    
    // Test 2: Test accept endpoint (PATCH method)
    console.log('2️⃣ Testing accept request API...');
    try {
      const acceptResponse = await axios.patch(`${API_BASE}/senior-requests/${requestId}/accept`, {
        studentId: 4
      });
      console.log(`✅ Accept API working: ${acceptResponse.data.status}`);
    } catch (error) {
      console.log(`❌ Accept API error: ${error.response?.data?.message || error.message}`);
    }
    
    // Test 3: Test status update (PATCH method)
    console.log('3️⃣ Testing status update API...');
    try {
      const statusResponse = await axios.patch(`${API_BASE}/senior-requests/${requestId}/status`, {
        status: 'in_progress'
      });
      console.log(`✅ Status update API working: ${statusResponse.data.status}`);
    } catch (error) {
      console.log(`❌ Status update API error: ${error.response?.data?.message || error.message}`);
    }
    
    // Test 4: Test student tasks endpoint
    console.log('4️⃣ Testing student tasks API...');
    try {
      const tasksResponse = await axios.get(`${API_BASE}/senior-requests/student/4`);
      const myTask = tasksResponse.data.find(task => task.id === requestId);
      console.log(`✅ Student tasks API working. Task found: ${!!myTask}`);
      if (myTask) {
        console.log(`   Task status: ${myTask.status}`);
        console.log(`   Phone number: ${myTask.requesterPhone}`);
      }
    } catch (error) {
      console.log(`❌ Student tasks API error: ${error.response?.data?.message || error.message}`);
    }
    
    // Test 5: Test open requests endpoint
    console.log('5️⃣ Testing open requests API...');
    try {
      const openResponse = await axios.get(`${API_BASE}/senior-requests/open`);
      const openTask = openResponse.data.find(task => task.id === requestId);
      console.log(`✅ Open requests API working. Task visible to others: ${!!openTask}`);
      console.log(`   (Should be false since task is assigned)`);
    } catch (error) {
      console.log(`❌ Open requests API error: ${error.response?.data?.message || error.message}`);
    }
    
    // Test 6: Test cancel (should DELETE the request)
    console.log('6️⃣ Testing cancel request API...');
    try {
      const cancelResponse = await axios.patch(`${API_BASE}/senior-requests/${requestId}/status`, {
        status: 'cancelled'
      });
      console.log(`✅ Cancel API working: ${cancelResponse.data.message}`);
      
      // Verify it's deleted
      try {
        await axios.get(`${API_BASE}/senior-requests/student/4`);
        const tasksAfterCancel = await axios.get(`${API_BASE}/senior-requests/student/4`);
        const cancelledTask = tasksAfterCancel.data.find(task => task.id === requestId);
        console.log(`✅ Task properly deleted: ${!cancelledTask}`);
      } catch (error) {
        console.log('   Error checking deletion, but this might be expected');
      }
    } catch (error) {
      console.log(`❌ Cancel API error: ${error.response?.data?.message || error.message}`);
    }
    
    console.log('\n🎉 Frontend API Testing Complete!');
    console.log('\nNow test the frontend apps:');
    console.log('1. Try accepting a request in TasksScreen');
    console.log('2. Check if request moves to "My Tasks" tab');
    console.log('3. Try cancelling a request in SeniorDashboard');
    console.log('4. Verify requests disappear after cancel/complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testFrontendAPIFixes();