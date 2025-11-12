const mysql = require('mysql2/promise');

async function testDirectDatabaseUpdate() {
  console.log('Testing direct database update...');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'KkA@19012005',
    database: 'student_senior_db'
  });
  
  try {
    // Get current stats
    const [beforeStats] = await connection.execute(
      'SELECT completedTasks, hoursServed, score FROM students WHERE id = ?',
      [4]
    );
    console.log('📊 Current stats:', beforeStats[0]);
    
    // Manually update hours
    await connection.execute(
      'UPDATE students SET hoursServed = hoursServed + 2.0 WHERE id = ?',
      [4]
    );
    
    // Check after manual update
    const [afterStats] = await connection.execute(
      'SELECT completedTasks, hoursServed, score FROM students WHERE id = ?',
      [4]
    );
    console.log('📊 After manual update:', afterStats[0]);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

testDirectDatabaseUpdate();