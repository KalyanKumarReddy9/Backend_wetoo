const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testSeniorRequestAPI() {
  console.log('🧪 Testing Senior Request API Endpoints\n');

  try {
    // 1. Create a senior request
    console.log('1. Creating a senior request...');
    const createRequestResponse = await axios.post(`${BASE_URL}/senior-requests`, {
      seniorId: 1, // Assuming we have a senior with ID 1
      title: 'Need help with grocery shopping',
      description: 'I need someone to help me with weekly grocery shopping at the local supermarket',
      type: 'groceries',
      priority: 'medium',
      location: '123 Main Street, Downtown',
      preferredTime: 'Morning 9-11 AM',
      estimatedDuration: 120
    });
    console.log('✅ Senior request created:', createRequestResponse.data.id);
    const requestId = createRequestResponse.data.id;

    // 2. Get open requests
    console.log('\n2. Fetching open senior requests...');
    const openRequestsResponse = await axios.get(`${BASE_URL}/senior-requests/open`);
    console.log('✅ Open requests found:', openRequestsResponse.data.length);

    // 3. Accept the request (assuming student ID 1)
    console.log('\n3. Accepting the request...');
    const acceptResponse = await axios.patch(`${BASE_URL}/senior-requests/${requestId}/accept`, {
      studentId: 1
    });
    console.log('✅ Request accepted by student:', acceptResponse.data.assignedStudentId);

    // 4. Update request status to in_progress
    console.log('\n4. Updating request status to in_progress...');
    const updateStatusResponse = await axios.patch(`${BASE_URL}/senior-requests/${requestId}/status`, {
      status: 'in_progress'
    });
    console.log('✅ Status updated to:', updateStatusResponse.data.status);

    // 5. Complete the request
    console.log('\n5. Completing the request...');
    const completeResponse = await axios.patch(`${BASE_URL}/senior-requests/${requestId}/status`, {
      status: 'completed'
    });
    console.log('✅ Request completed at:', completeResponse.data.completedAt);

    // 6. Submit feedback
    console.log('\n6. Submitting feedback...');
    const feedbackResponse = await axios.post(`${BASE_URL}/senior-requests/${requestId}/feedback`, {
      rating: 5,
      feedback: 'Excellent service! Very helpful and punctual.',
      serviceQuality: 5,
      punctuality: 5,
      communication: 5,
      wouldRecommend: true,
      additionalComments: 'Will definitely request again. Thank you!'
    });
    console.log('✅ Feedback submitted with rating:', feedbackResponse.data.rating);

    // 7. Get student feedback
    console.log('\n7. Fetching student feedback statistics...');
    const studentFeedbackResponse = await axios.get(`${BASE_URL}/senior-requests/feedback/student/1`);
    console.log('✅ Student feedback stats:', {
      totalFeedback: studentFeedbackResponse.data.stats.totalFeedback,
      averageRating: studentFeedbackResponse.data.stats.averageRating,
      recommendationRate: studentFeedbackResponse.data.stats.recommendationRate
    });

    console.log('\n🎉 All tests passed! Senior Request API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    // Show more details if it's a 404 or 500 error
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
  }
}

// Run the tests
testSeniorRequestAPI();