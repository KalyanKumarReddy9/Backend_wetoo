/**
 * Reset all student stats to 0
 * Run with: node reset-student-stats.js
 */

const { sequelize, Student } = require('./src/models');

async function resetAllStudentStats() {
  try {
    console.log('🔄 Resetting all student stats to 0...');
    
    // Update all students to have 0 stats
    const [affectedRows] = await Student.update({
      completedTasks: 0,
      hoursServed: 0,
      score: 0
    }, { 
      where: {} // Update all students
    });
    
    console.log(`✅ Reset stats for ${affectedRows} students`);
    
    // Show current stats
    const students = await Student.findAll({
      attributes: ['id', 'fullName', 'completedTasks', 'hoursServed', 'score'],
      order: [['id', 'ASC']]
    });
    
    console.log('\n📊 Current student stats:');
    students.forEach(student => {
      console.log(`  ID: ${student.id} | ${student.fullName} | Tasks: ${student.completedTasks} | Hours: ${student.hoursServed} | Score: ${student.score}`);
    });
    
    console.log('\n🎉 All student stats have been reset to 0!');
    
  } catch (error) {
    console.error('❌ Error resetting student stats:', error);
  } finally {
    await sequelize.close();
  }
}

resetAllStudentStats();