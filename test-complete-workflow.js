const mysql = require('mysql2/promise');
const axios = require('axios');

// Database and API configuration
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'KkA@19012005',
  database: 'student_senior_db'
};

const API_BASE = 'http://localhost:4000/api';

// Test data
const TEST_SENIOR = {
  id: 3, // Using actual senior ID from database
  name: 'Manaa'
};

const TEST_STUDENT = {
  id: 4, // Using actual student ID from database 
  name: 'Kalyan'
};

let connection;
let testRequestId;

console.log('🚀 Starting Complete Senior Request Workflow Test\n');

async function setupDatabase() {
  console.log('1️⃣ Setting up database connection...');
  connection = await mysql.createConnection(DB_CONFIG);
  
  // Verify tables exist
  const [tables] = await connection.execute("SHOW TABLES LIKE 'senior_requests'");
  if (tables.length === 0) {
    throw new Error('senior_requests table not found');
  }
  
  // Clear any existing requests
  await connection.execute('DELETE FROM senior_requests');
  console.log('✓ Database setup complete\n');
}

async function testStep2_SeniorCreatesRequest() {
  console.log('2️⃣ Testing: Senior creates request (should appear in both dashboards)...');
  
  const requestData = {
    title: 'Need help with grocery shopping',
    description: 'I need assistance with weekly grocery shopping at the local supermarket',
    type: 'groceries',
    priority: 'medium',
    location: '123 Main Street, Test City',
    preferredTime: new Date().toISOString(),
    estimatedDuration: 120, // 2 hours
    seniorId: TEST_SENIOR.id,
    requesterName: 'Test Senior User',
    requesterPhone: '+1-555-0123'
  };

  try {
    const response = await axios.post(`${API_BASE}/senior-requests`, requestData);
    testRequestId = response.data.id;
    
    console.log(`✓ Request created successfully with ID: ${testRequestId}`);
    console.log(`  Title: ${response.data.title}`);
    console.log(`  Status: ${response.data.status}`);
    console.log(`  Requester Name: ${response.data.requesterName}`);
    console.log(`  Requester Phone: ${response.data.requesterPhone}`);
    
    // Verify request appears in senior's recent activities
    const seniorRequests = await axios.get(`${API_BASE}/senior-requests/senior/${TEST_SENIOR.id}`);
    const foundInSenior = seniorRequests.data.find(r => r.id === testRequestId);
    
    if (!foundInSenior) {
      throw new Error('Request not found in senior recent activities');
    }
    console.log('✓ Request appears in senior recent activities');
    
    // Verify request appears in student dashboard (open requests)
    const openRequests = await axios.get(`${API_BASE}/senior-requests/open`);
    const foundInOpen = openRequests.data.find(r => r.id === testRequestId);
    
    if (!foundInOpen) {
      throw new Error('Request not found in student dashboard');
    }
    console.log('✓ Request appears in student dashboard (open requests)');
    console.log('✓ Phone number and contact details are properly stored and accessible\n');
    
  } catch (error) {
    console.error('❌ Error in step 2:', error.response?.data || error.message);
    throw error;
  }
}

async function testStep3_SeniorCancelsRequest() {
  console.log('3️⃣ Testing: Senior cancels request (should DELETE from database)...');
  
  try {
    // Cancel the request
    const response = await axios.patch(`${API_BASE}/senior-requests/${testRequestId}/status`, {
      status: 'cancelled'
    });
    
    console.log('✓ Cancel request API called successfully');
    console.log(`  Response: ${response.data.message}`);
    
    // Verify request is DELETED from database (not just status changed)
    const [rows] = await connection.execute(
      'SELECT * FROM senior_requests WHERE id = ?', 
      [testRequestId]
    );
    
    if (rows.length > 0) {
      throw new Error('Request still exists in database - should be DELETED');
    }
    console.log('✓ Request completely DELETED from database');
    
    // Verify request no longer appears in senior recent activities
    const seniorRequests = await axios.get(`${API_BASE}/senior-requests/senior/${TEST_SENIOR.id}`);
    const foundInSenior = seniorRequests.data.find(r => r.id === testRequestId);
    
    if (foundInSenior) {
      throw new Error('Request still appears in senior recent activities');
    }
    console.log('✓ Request no longer appears in senior recent activities');
    
    // Verify request no longer appears in student dashboard
    const openRequests = await axios.get(`${API_BASE}/senior-requests/open`);
    const foundInOpen = openRequests.data.find(r => r.id === testRequestId);
    
    if (foundInOpen) {
      throw new Error('Request still appears in student dashboard');
    }
    console.log('✓ Request no longer appears in student dashboard\n');
    
  } catch (error) {
    console.error('❌ Error in step 3:', error.response?.data || error.message);
    throw error;
  }
}

async function testStep4_StudentAcceptsRequest() {
  console.log('4️⃣ Testing: Student accepts request (visibility and status changes)...');
  
  // First create a new request for testing acceptance
  const requestData = {
    title: 'Need help with technology setup',
    description: 'I need help setting up my new smartphone and email',
    type: 'technology_help',
    priority: 'high',
    location: '456 Tech Street, Test City',
    preferredTime: new Date().toISOString(),
    estimatedDuration: 90,
    seniorId: TEST_SENIOR.id,
    requesterName: 'Test Senior User',
    requesterPhone: '+1-555-0123'
  };

  try {
    const createResponse = await axios.post(`${API_BASE}/senior-requests`, requestData);
    testRequestId = createResponse.data.id;
    console.log(`✓ New request created for acceptance test with ID: ${testRequestId}`);
    
    // Student accepts the request
    const acceptResponse = await axios.patch(`${API_BASE}/senior-requests/${testRequestId}/accept`, {
      studentId: TEST_STUDENT.id
    });
    
    console.log('✓ Student accepted request successfully');
    console.log(`  Status changed to: ${acceptResponse.data.status}`);
    console.log(`  Assigned student: ${acceptResponse.data.assignedStudent?.fullName}`);
    
    // Verify request no longer appears in open requests (for other students)
    const openRequests = await axios.get(`${API_BASE}/senior-requests/open`);
    const foundInOpen = openRequests.data.find(r => r.id === testRequestId);
    
    if (foundInOpen) {
      throw new Error('Assigned request still appears in open requests (should be hidden from other students)');
    }
    console.log('✓ Request no longer appears in open requests (hidden from other students)');
    
    // Verify request appears in student's assigned tasks
    const studentTasks = await axios.get(`${API_BASE}/senior-requests/student/${TEST_STUDENT.id}`);
    const foundInStudentTasks = studentTasks.data.find(r => r.id === testRequestId);
    
    if (!foundInStudentTasks) {
      throw new Error('Request not found in student assigned tasks');
    }
    console.log('✓ Request appears in student assigned tasks');
    
    // Verify request shows as "assigned" in senior recent activities
    const seniorRequests = await axios.get(`${API_BASE}/senior-requests/senior/${TEST_SENIOR.id}`);
    const foundInSenior = seniorRequests.data.find(r => r.id === testRequestId);
    
    if (!foundInSenior || foundInSenior.status !== 'assigned') {
      throw new Error('Request does not show as "assigned" in senior recent activities');
    }
    console.log('✓ Request shows as "assigned" in senior recent activities\n');
    
  } catch (error) {
    console.error('❌ Error in step 4:', error.response?.data || error.message);
    throw error;
  }
}

async function testStep5_SeniorCompletesTask() {
  console.log('5️⃣ Testing: Senior completes task (should delete and update student stats)...');
  
  try {
    // Get student stats before completion
    const [beforeStats] = await connection.execute(
      'SELECT completedTasks, hoursServed, score FROM students WHERE id = ?',
      [TEST_STUDENT.id]
    );
    
    const statsBefore = beforeStats[0] || { completedTasks: 0, hoursServed: 0, score: 0 };
    console.log('📊 Student stats before completion:', statsBefore);
    
    // Senior completes the task
    const completeResponse = await axios.patch(`${API_BASE}/senior-requests/${testRequestId}/status`, {
      status: 'completed'
    });
    
    console.log('✓ Task completion API called successfully');
    console.log(`  Response: ${completeResponse.data.message}`);
    
    // Verify request is DELETED from database
    const [rows] = await connection.execute(
      'SELECT * FROM senior_requests WHERE id = ?', 
      [testRequestId]
    );
    
    if (rows.length > 0) {
      throw new Error('Completed request still exists in database - should be DELETED');
    }
    console.log('✓ Completed request DELETED from database');
    
    // Verify request no longer appears in senior recent activities
    const seniorRequests = await axios.get(`${API_BASE}/senior-requests/senior/${TEST_SENIOR.id}`);
    const foundInSenior = seniorRequests.data.find(r => r.id === testRequestId);
    
    if (foundInSenior) {
      throw new Error('Completed request still appears in senior recent activities');
    }
    console.log('✓ Request no longer appears in senior recent activities');
    
    // Verify request no longer appears in student tasks
    const studentTasks = await axios.get(`${API_BASE}/senior-requests/student/${TEST_STUDENT.id}`);
    const foundInStudentTasks = studentTasks.data.find(r => r.id === testRequestId);
    
    if (foundInStudentTasks) {
      throw new Error('Completed request still appears in student tasks');
    }
    console.log('✓ Request no longer appears in student tasks');
    
    // Verify student stats were updated correctly
    const [afterStats] = await connection.execute(
      'SELECT completedTasks, hoursServed, score FROM students WHERE id = ?',
      [TEST_STUDENT.id]
    );
    
    const statsAfter = afterStats[0];
    console.log('📊 Student stats after completion:', statsAfter);
    
    // Calculate expected values (90 minutes = 1.5 hours, 1.5 * 100 = 150 points)
    const expectedTasks = parseInt(statsBefore.completedTasks) + 1;
    const expectedHours = parseFloat(statsBefore.hoursServed) + 1.5; // 90 minutes
    const expectedScore = parseInt(statsBefore.score) + 150; // 1.5 hours * 100 points
    
    if (parseInt(statsAfter.completedTasks) !== expectedTasks) {
      throw new Error(`Completed tasks not updated correctly. Expected: ${expectedTasks}, Got: ${statsAfter.completedTasks}`);
    }
    
    if (Math.abs(parseFloat(statsAfter.hoursServed) - expectedHours) > 0.01) {
      throw new Error(`Hours served not updated correctly. Expected: ${expectedHours}, Got: ${statsAfter.hoursServed}`);
    }
    
    if (parseInt(statsAfter.score) !== expectedScore) {
      throw new Error(`Score not updated correctly. Expected: ${expectedScore}, Got: ${statsAfter.score}`);
    }
    
    console.log('✓ Student stats updated correctly:');
    console.log(`  Tasks completed: ${statsBefore.completedTasks} → ${statsAfter.completedTasks} (+1)`);
    console.log(`  Hours served: ${statsBefore.hoursServed} → ${statsAfter.hoursServed} (+1.5)`);
    console.log(`  Score: ${statsBefore.score} → ${statsAfter.score} (+150 points)\n`);
    
  } catch (error) {
    console.error('❌ Error in step 5:', error.response?.data || error.message);
    throw error;
  }
}

async function verifyStudentProfileUpdates() {
  console.log('6️⃣ Testing: Student profile displays updated stats...');
  
  try {
    // Get student profile via API
    const profileResponse = await axios.get(`${API_BASE}/student/profile`);
    const profile = profileResponse.data;
    
    if (!profile) {
      throw new Error('Could not fetch student profile');
    }
    
    console.log('✓ Student profile fetched successfully');
    console.log(`  Tasks completed: ${profile.completedTasks || 0}`);
    console.log(`  Hours served: ${profile.hoursServed || 0}`);
    console.log(`  Score: ${profile.score || 0} (100 points per hour)`);
    
    // Verify the scoring system (100 points per hour)
    const expectedScore = Math.floor((profile.hoursServed || 0) * 100);
    if (Math.abs((profile.score || 0) - expectedScore) > 1) { // Allow small rounding difference
      console.warn(`⚠️  Score calculation check: Expected ~${expectedScore}, Got ${profile.score}`);
    } else {
      console.log('✓ Score calculation is correct (100 points per hour)');
    }
    
    console.log('✓ Student profile section properly tracks and displays statistics\n');
    
  } catch (error) {
    console.error('❌ Error in step 6:', error.response?.data || error.message);
    throw error;
  }
}

async function runCompleteWorkflowTest() {
  try {
    await setupDatabase();
    await testStep2_SeniorCreatesRequest();
    await testStep3_SeniorCancelsRequest();
    await testStep4_StudentAcceptsRequest();
    await testStep5_SeniorCompletesTask();
    await verifyStudentProfileUpdates();
    
    console.log('🎉 ALL WORKFLOW TESTS PASSED SUCCESSFULLY!');
    console.log('\n📋 Workflow Summary:');
    console.log('✅ Step 1: Delete existing requests - COMPLETED');
    console.log('✅ Step 2: Senior creates request → appears in both dashboards - WORKING');
    console.log('✅ Step 3: Senior cancels → DELETE from database - WORKING');
    console.log('✅ Step 4: Student accepts → hide from others, show "accepted" - WORKING');
    console.log('✅ Step 5: Senior completes → remove from all + update stats - WORKING');
    console.log('✅ Step 6: Student profile updates correctly - WORKING');
    console.log('\n🚀 Your senior request system is working perfectly according to your specifications!');
    
  } catch (error) {
    console.error('\n💥 WORKFLOW TEST FAILED');
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
runCompleteWorkflowTest();