/**
 * Clean up all senior requests for fresh testing
 * Run with: node clean-requests.js
 */

const { sequelize, SeniorRequest, Student } = require('./src/models');

async function cleanupRequests() {
  try {
    console.log('🧹 Cleaning up all senior requests...');
    
    // Get count before deletion
    const beforeCount = await SeniorRequest.count();
    console.log(`📊 Found ${beforeCount} existing requests`);
    
    // Delete all senior requests
    await SeniorRequest.destroy({ where: {} });
    
    // Reset all student stats to 0
    const [affectedStudents] = await Student.update({
      completedTasks: 0,
      hoursServed: 0,
      score: 0
    }, { where: {} });
    
    console.log(`✅ Deleted all ${beforeCount} requests`);
    console.log(`✅ Reset stats for ${affectedStudents} students`);
    
    // Show current state
    const remainingRequests = await SeniorRequest.count();
    const students = await Student.findAll({
      attributes: ['id', 'fullName', 'completedTasks', 'hoursServed', 'score'],
      order: [['id', 'ASC']]
    });
    
    console.log(`\n📊 Remaining requests: ${remainingRequests}`);
    console.log('\n👥 Student stats after reset:');
    students.forEach(student => {
      console.log(`  ID: ${student.id} | ${student.fullName} | Tasks: ${student.completedTasks} | Hours: ${student.hoursServed} | Score: ${student.score}`);
    });
    
    console.log('\n🎉 Cleanup complete! Ready for fresh testing.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await sequelize.close();
  }
}

cleanupRequests();