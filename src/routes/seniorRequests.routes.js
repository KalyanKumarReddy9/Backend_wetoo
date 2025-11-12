const express = require('express');
const {
  createSeniorRequest,
  getOpenSeniorRequests,
  getSeniorRequestsBySenior,
  getAssignedSeniorRequests,
  acceptSeniorRequest,
  updateSeniorRequestStatus,
  submitSeniorFeedback,
  submitGeneralSeniorFeedback,
  getStudentFeedback
} = require('../controllers/seniorRequests.controller');

const router = express.Router();

// Senior request routes
router.post('/', createSeniorRequest); // Create a new senior request
router.get('/open', getOpenSeniorRequests); // Get all open requests (for students)
router.get('/senior/:seniorId', getSeniorRequestsBySenior); // Get requests by senior
router.get('/student/:studentId', getAssignedSeniorRequests); // Get requests assigned to student
router.patch('/:id/accept', acceptSeniorRequest); // Accept/assign a request
router.patch('/:id/status', updateSeniorRequestStatus); // Update request status

// Feedback routes
router.post('/:requestId/feedback', submitSeniorFeedback); // Submit feedback for completed request
router.post('/feedback/general', submitGeneralSeniorFeedback); // Submit feedback not tied to specific request
router.get('/feedback/student/:studentId', getStudentFeedback); // Get feedback for a student

module.exports = router;