const axios = require('axios');
const mysql = require('mysql2/promise');

async function testStatsUpdate() {
  console.log('Testing student stats update...');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'KkA@19012005',
    database: 'student_senior_db'
  });
  
  try {
    // Create a test request
    const requestData = {
      title: 'Stats Test Request',
      description: 'Testing stats update',
      type: 'groceries',
      seniorId: 3,
      estimatedDuration: 120, // 2 hours = 200 points
      requesterName: 'Test Senior',
      requesterPhone: '+1-555-0123'
    };
    
    const createResponse = await axios.post('http://localhost:4000/api/senior-requests', requestData);
    const requestId = createResponse.data.id;
    console.log('✓ Created test request:', requestId);
    
    // Student accepts
    await axios.patch(`http://localhost:4000/api/senior-requests/${requestId}/accept`, {
      studentId: 4
    });
    console.log('✓ Student accepted request');
    
    // Check student stats before completion
    const [beforeStats] = await connection.execute(
      'SELECT completedTasks, hoursServed, score FROM students WHERE id = ?',
      [4]
    );
    console.log('📊 Stats before completion:', beforeStats[0]);
    
    // Complete the task
    const completeResponse = await axios.patch(`http://localhost:4000/api/senior-requests/${requestId}/status`, {
      status: 'completed'
    });
    console.log('✓ Task completed:', completeResponse.data.message);
    
    // Check student stats after completion
    const [afterStats] = await connection.execute(
      'SELECT completedTasks, hoursServed, score FROM students WHERE id = ?',
      [4]
    );
    console.log('📊 Stats after completion:', afterStats[0]);
    
    // Calculate expected values
    const hoursAdded = 120 / 60; // 2 hours
    const pointsAdded = hoursAdded * 100; // 200 points
    
    console.log(`Expected changes: +1 task, +${hoursAdded} hours, +${pointsAdded} points`);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  } finally {
    await connection.end();
  }
}

testStatsUpdate();