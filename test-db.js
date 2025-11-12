const { SeniorFeedback } = require('./src/models');

async function testDB() {
  try {
    console.log('Testing database connection and SeniorFeedback model...');
    
    // Test creating a feedback entry (matching what the controller does)
    const feedback = await SeniorFeedback.create({
      requestId: null,
      seniorId: null,
      studentId: null,
      rating: 5,
      feedback: "Test feedback",
      servicesNeeded: "Test services",
      featuresNeeded: "Test features"
    });
    
    console.log('Feedback created successfully:', feedback.toJSON());
    
    // Test retrieving the feedback
    const retrievedFeedback = await SeniorFeedback.findByPk(feedback.id);
    console.log('Retrieved feedback:', retrievedFeedback.toJSON());
    
  } catch (error) {
    console.error('Database test error:', error.message);
    console.error('Error stack:', error.stack);
  }
}

testDB();