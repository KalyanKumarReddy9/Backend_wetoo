const axios = require('axios');

async function testFeedback() {
  try {
    console.log('Testing General Senior Feedback endpoint...');
    
    // Test submitting general feedback
    const feedbackData = {
      rating: 5,
      feedback: "Great service overall!",
      servicesNeeded: ["Visit Hospital", "Grocery Help"],
      featuresNeeded: "Better scheduling system"
    };
    
    console.log('Sending feedback data:', feedbackData);
    
    const response = await axios.post('http://localhost:4000/api/senior-requests/feedback/general', feedbackData);
    
    console.log('Feedback submitted successfully!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('Error submitting feedback:', error.response ? error.response.data : error.message);
  }
}

testFeedback();