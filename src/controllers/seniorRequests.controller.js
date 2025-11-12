const { SeniorRequest, Senior, Student, SeniorFeedback } = require('../models');
const { Op } = require('sequelize');

// Create a new senior request
async function createSeniorRequest(req, res) {
  try {
    const { title, description, type, priority, location, preferredTime, estimatedDuration, requesterName, requesterPhone } = req.body;
    
    // Get seniorId from authenticated user or request body
    const seniorId = req.user?.id || req.body.seniorId;
    if (!seniorId) {
      return res.status(400).json({ message: 'Senior ID is required' });
    }

    // Validate required fields
    if (!title || !description || !type) {
      return res.status(400).json({ message: 'Title, description, and type are required' });
    }

    // Validate type
    const allowedTypes = ['hospital', 'rides', 'groceries', 'companionship', 'technology_help', 'household_tasks', 'government_services', 'medicines', 'reading_writing', 'other'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid request type' });
    }

    // Validate priority
    const allowedPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && !allowedPriorities.includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority level' });
    }

    const seniorRequest = await SeniorRequest.create({
      seniorId,
      title,
      description,
      type,
      priority: priority || 'medium',
      location,
      preferredTime,
      estimatedDuration,
      requesterName,
      requesterPhone,
      status: 'open'
    });

    // Include senior details in response
    const requestWithSenior = await SeniorRequest.findByPk(seniorRequest.id, {
      include: [
        {
          model: Senior,
          as: 'senior',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    return res.status(201).json(requestWithSenior);
  } catch (error) {
    console.error('Error creating senior request:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get all open senior requests (for students to see)
async function getOpenSeniorRequests(req, res) {
  try {
    const { type, priority, location } = req.query;
    const where = { status: 'open' }; // Only show open requests
    
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (location) {
      where.location = { [Op.like]: `%${location}%` };
    }

    const requests = await SeniorRequest.findAll({
      where,
      include: [
        {
          model: Senior,
          as: 'senior',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [
        ['priority', 'DESC'], // urgent, high, medium, low
        ['createdAt', 'ASC'] // oldest first
      ]
    });

    return res.json(requests);
  } catch (error) {
    console.error('Error fetching open senior requests:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get senior requests by senior ID (exclude completed tasks from recent activities)
async function getSeniorRequestsBySenior(req, res) {
  try {
    const { seniorId } = req.params;
    const { status } = req.query;
    
    const where = { seniorId };
    if (status) {
      where.status = status;
    } else {
      // Exclude completed tasks from senior recent activities
      where.status = { [Op.ne]: 'completed' };
    }

    const requests = await SeniorRequest.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'assignedStudent',
          attributes: ['id', 'fullName', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json(requests);
  } catch (error) {
    console.error('Error fetching senior requests:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get senior requests assigned to a student
async function getAssignedSeniorRequests(req, res) {
  try {
    const { studentId } = req.params;
    const { status } = req.query;
    
    const where = { assignedStudentId: studentId };
    if (status) where.status = status;

    const requests = await SeniorRequest.findAll({
      where,
      include: [
        {
          model: Senior,
          as: 'senior',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json(requests);
  } catch (error) {
    console.error('Error fetching assigned requests:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Accept/Assign a request to a student
async function acceptSeniorRequest(req, res) {
  try {
    const { id } = req.params;
    const studentId = req.user?.id || req.body.studentId;
    
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    // Check if request exists and is open
    const request = await SeniorRequest.findByPk(id, {
      include: [
        {
          model: Senior,
          as: 'senior',
          attributes: ['id', 'fullName', 'email', 'pushToken']
        },
        {
          model: Student,
          as: 'assignedStudent',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'open') {
      return res.status(400).json({ message: 'Request is no longer available' });
    }

    // Verify student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(400).json({ message: 'Student not found' });
    }

    // Update request to assigned
    await SeniorRequest.update(
      {
        status: 'assigned',
        assignedStudentId: studentId,
        assignedAt: new Date()
      },
      { where: { id } }
    );

    // Send push notification to senior if they have a push token
    if (request.senior?.pushToken) {
      try {
        console.log('Sending push notification to senior:', request.senior.id, 'with token:', request.senior.pushToken);
        console.log('Request data:', { id: request.id, title: request.title });
        const message = {
          to: request.senior.pushToken,
          sound: 'default',
          title: 'Request Accepted!',
          body: `${student.fullName} has accepted your request: ${request.title || 'Service Request'}`,
          data: { 
            type: 'request_accepted',
            requestId: request.id,
            studentName: student.fullName,
            requestTitle: request.title || 'Service Request'
          },
        };

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });
        
        const result = await response.json();
        console.log('Push notification result:', result);
        
        if (result.errors) {
          console.error('Push notification errors:', result.errors);
        }
      } catch (notificationError) {
        console.error('Error sending push notification:', notificationError);
      }
    }

    // Get updated request with details
    const updatedRequest = await SeniorRequest.findByPk(id, {
      include: [
        {
          model: Senior,
          as: 'senior',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: Student,
          as: 'assignedStudent',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    return res.json(updatedRequest);
  } catch (error) {
    console.error('Error accepting senior request:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Update request status
async function updateSeniorRequestStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const allowedStatuses = ['open', 'assigned', 'in_progress', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await SeniorRequest.findByPk(id, {
      include: [
        {
          model: Student,
          as: 'assignedStudent',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Special handling for cancel - DELETE from database completely
    if (status === 'cancelled') {
      await SeniorRequest.destroy({ where: { id } });
      return res.json({ 
        message: 'Request cancelled and deleted successfully',
        deletedRequestId: id 
      });
    }

    // Special handling for completed - Update status and student stats (keep in database)
    if (status === 'completed') {
      const updateData = { status, completedAt: new Date() };
      
      // Update student stats ONLY if a student was assigned
      if (request.assignedStudentId) {
        try {
          // Get current student profile
          const currentProfile = await Student.findByPk(request.assignedStudentId);
          
          if (currentProfile) {
            // Calculate hours served from task duration (convert minutes to hours)
            const taskHours = (request.estimatedDuration || 60) / 60;
            
            // Get current stats (ensure they start from 0 if null)
            const currentTasks = parseInt(currentProfile.completedTasks) || 0;
            const currentHours = parseFloat(currentProfile.hoursServed) || 0;
            const currentScore = parseInt(currentProfile.score) || 0;
            
            // Calculate new stats - increment ONLY upon completion
            const newTasks = currentTasks + 1; // +1 task completed
            const newHours = currentHours + taskHours; // +actual hours from this task
            const newScore = Math.round(newHours * 100); // Total hours * 100 points
            
            // Update ONLY the specific student's profile
            await Student.update({
              completedTasks: newTasks,
              hoursServed: newHours,
              score: newScore
            }, { where: { id: request.assignedStudentId } });
            
            console.log(`✅ Updated student ${request.assignedStudentId} profile:`);
            console.log(`   Tasks: ${currentTasks} → ${newTasks} (+1)`);
            console.log(`   Hours: ${currentHours} → ${newHours} (+${taskHours})`);
            console.log(`   Score: ${currentScore} → ${newScore} (${newHours} hours × 100)`);
          }
          
        } catch (statsError) {
          console.error('❌ Error updating student stats:', statsError);
          // Don't fail the main request if stats update fails
        }
      }
      
      // Update the request status to completed (keep in database)
      await SeniorRequest.update(updateData, { where: { id } });
      
      // Get updated request with details
      const completedRequest = await SeniorRequest.findByPk(id, {
        include: [
          {
            model: Senior,
            as: 'senior',
            attributes: ['id', 'fullName', 'email']
          },
          {
            model: Student,
            as: 'assignedStudent',
            attributes: ['id', 'fullName', 'email']
          }
        ]
      });
      
      return res.json({ 
        message: 'Task completed successfully',
        request: completedRequest
      });
    }

    // For other status updates (assigned, in_progress)
    const updateData = { status };
    await SeniorRequest.update(updateData, { where: { id } });

    // Get updated request with details
    const updatedRequest = await SeniorRequest.findByPk(id, {
      include: [
        {
          model: Senior,
          as: 'senior',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: Student,
          as: 'assignedStudent',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    return res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating senior request status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Submit feedback for a completed request
async function submitSeniorFeedback(req, res) {
  try {
    const { requestId } = req.params;
    const { rating, feedback, serviceQuality, punctuality, communication, wouldRecommend, additionalComments, servicesNeeded, featuresNeeded } = req.body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if request exists and is completed
    const request = await SeniorRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'completed') {
      return res.status(400).json({ message: 'Can only provide feedback for completed requests' });
    }

    if (!request.assignedStudentId) {
      return res.status(400).json({ message: 'No student assigned to this request' });
    }

    // Check if feedback already exists
    const existingFeedback = await SeniorFeedback.findOne({ where: { requestId } });
    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback already submitted for this request' });
    }

    const seniorFeedback = await SeniorFeedback.create({
      requestId,
      seniorId: request.seniorId,
      studentId: request.assignedStudentId,
      rating,
      feedback,
      servicesNeeded: servicesNeeded ? (typeof servicesNeeded === 'string' ? servicesNeeded : JSON.stringify(servicesNeeded)) : null,
      featuresNeeded: featuresNeeded ? (typeof featuresNeeded === 'string' ? featuresNeeded : JSON.stringify(featuresNeeded)) : null,
      serviceQuality,
      punctuality,
      communication,
      wouldRecommend: wouldRecommend !== false, // default to true
      additionalComments
    });

    // Include related data in response
    const feedbackWithDetails = await SeniorFeedback.findByPk(seniorFeedback.id, {
      include: [
        {
          model: SeniorRequest,
          as: 'request',
          attributes: ['id', 'title', 'type']
        },
        {
          model: Senior,
          as: 'senior',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    return res.status(201).json(feedbackWithDetails);
  } catch (error) {
    console.error('Error submitting senior feedback:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Submit general feedback not tied to a specific request (seniors can send overall feedback)
async function submitGeneralSeniorFeedback(req, res) {
  try {
    const { rating, feedback, serviceQuality, punctuality, communication, wouldRecommend, additionalComments, servicesNeeded, featuresNeeded, studentId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const seniorId = req.user?.id || req.body.seniorId || null;

    const seniorFeedback = await SeniorFeedback.create({
      requestId: null,
      seniorId,
      studentId: studentId || null,
      rating,
      feedback,
      servicesNeeded: servicesNeeded ? (typeof servicesNeeded === 'string' ? servicesNeeded : JSON.stringify(servicesNeeded)) : null,
      featuresNeeded: featuresNeeded ? (typeof featuresNeeded === 'string' ? featuresNeeded : JSON.stringify(featuresNeeded)) : null,
      serviceQuality,
      punctuality,
      communication,
      wouldRecommend: wouldRecommend !== false,
      additionalComments
    });

    return res.status(201).json(seniorFeedback);
  } catch (error) {
    console.error('Error submitting general senior feedback:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get feedback for a student
async function getStudentFeedback(req, res) {
  try {
    const { studentId } = req.params;
    
    const feedback = await SeniorFeedback.findAll({
      where: { studentId },
      include: [
        {
          model: SeniorRequest,
          as: 'request',
          attributes: ['id', 'title', 'type', 'completedAt']
        },
        {
          model: Senior,
          as: 'senior',
          attributes: ['id', 'fullName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate average ratings
    const stats = {
      totalFeedback: feedback.length,
      averageRating: 0,
      averageServiceQuality: 0,
      averagePunctuality: 0,
      averageCommunication: 0,
      recommendationRate: 0
    };

    if (feedback.length > 0) {
      stats.averageRating = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;
      stats.averageServiceQuality = feedback.filter(f => f.serviceQuality).reduce((sum, f) => sum + f.serviceQuality, 0) / feedback.filter(f => f.serviceQuality).length || 0;
      stats.averagePunctuality = feedback.filter(f => f.punctuality).reduce((sum, f) => sum + f.punctuality, 0) / feedback.filter(f => f.punctuality).length || 0;
      stats.averageCommunication = feedback.filter(f => f.communication).reduce((sum, f) => sum + f.communication, 0) / feedback.filter(f => f.communication).length || 0;
      stats.recommendationRate = feedback.filter(f => f.wouldRecommend).length / feedback.length * 100;
    }

    return res.json({ feedback, stats });
  } catch (error) {
    console.error('Error fetching student feedback:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  createSeniorRequest,
  getOpenSeniorRequests,
  getSeniorRequestsBySenior,
  getAssignedSeniorRequests,
  acceptSeniorRequest,
  updateSeniorRequestStatus,
  submitSeniorFeedback,
  submitGeneralSeniorFeedback,
  getStudentFeedback
};