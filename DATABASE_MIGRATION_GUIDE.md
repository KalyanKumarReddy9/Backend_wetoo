# Database Migration Guide

## Overview
This guide explains the migration from separate databases to a single consolidated database with new senior request functionality.

## Database Changes

### Previous Structure:
- `student_registration_db` - Students, student_interests, student_feedback, student_certifications, requests, otp_tokens, donations
- `senior_registration_db` - Seniors

### New Structure:
- `student_senior_db` - Single database containing all tables

## New Tables

### 1. `senior_requests`
Main table for senior service requests.

```sql
CREATE TABLE senior_requests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seniorId INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type ENUM('hospital', 'rides', 'groceries', 'companionship', 'technology_help', 'household_tasks', 'other') NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  location VARCHAR(255),
  preferredTime VARCHAR(100),
  status ENUM('open', 'assigned', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'open',
  assignedStudentId INT UNSIGNED,
  assignedAt DATETIME,
  completedAt DATETIME,
  estimatedDuration INT COMMENT 'Duration in minutes',
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  
  INDEX idx_seniorId (seniorId),
  INDEX idx_assignedStudentId (assignedStudentId),
  INDEX idx_status (status),
  INDEX idx_type (type),
  
  FOREIGN KEY (seniorId) REFERENCES seniors(id),
  FOREIGN KEY (assignedStudentId) REFERENCES students(id)
);
```

### 2. `senior_feedback`
Feedback from seniors about completed services.

```sql
CREATE TABLE senior_feedback (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  requestId INT UNSIGNED NOT NULL,
  seniorId INT UNSIGNED NOT NULL,
  studentId INT UNSIGNED NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  serviceQuality INT CHECK (serviceQuality >= 1 AND serviceQuality <= 5),
  punctuality INT CHECK (punctuality >= 1 AND punctuality <= 5),
  communication INT CHECK (communication >= 1 AND communication <= 5),
  wouldRecommend BOOLEAN NOT NULL DEFAULT TRUE,
  additionalComments TEXT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  
  UNIQUE INDEX idx_requestId (requestId),
  INDEX idx_seniorId (seniorId),
  INDEX idx_studentId (studentId),
  INDEX idx_rating (rating),
  
  FOREIGN KEY (requestId) REFERENCES senior_requests(id),
  FOREIGN KEY (seniorId) REFERENCES seniors(id),
  FOREIGN KEY (studentId) REFERENCES students(id)
);
```

## API Endpoints

### Senior Request Management

#### Create Senior Request
```
POST /api/senior-requests
Content-Type: application/json

{
  "title": "Need help with grocery shopping",
  "description": "I need someone to help me with weekly grocery shopping",
  "type": "groceries",
  "priority": "medium",
  "location": "123 Main St",
  "preferredTime": "Morning 9-11 AM",
  "estimatedDuration": 120
}
```

#### Get Open Requests (for students)
```
GET /api/senior-requests/open?type=groceries&priority=high&location=downtown
```

#### Get Requests by Senior
```
GET /api/senior-requests/senior/:seniorId?status=open
```

#### Get Assigned Requests (for students)
```
GET /api/senior-requests/student/:studentId?status=in_progress
```

#### Accept a Request
```
PATCH /api/senior-requests/:id/accept
Content-Type: application/json

{
  "studentId": 123
}
```

#### Update Request Status
```
PATCH /api/senior-requests/:id/status
Content-Type: application/json

{
  "status": "completed"
}
```

### Feedback Management

#### Submit Feedback
```
POST /api/senior-requests/:requestId/feedback
Content-Type: application/json

{
  "rating": 5,
  "feedback": "Excellent service, very helpful and punctual",
  "serviceQuality": 5,
  "punctuality": 5,
  "communication": 5,
  "wouldRecommend": true,
  "additionalComments": "Will definitely request again"
}
```

#### Get Student Feedback
```
GET /api/senior-requests/feedback/student/:studentId
```

Returns feedback statistics and detailed feedback:
```json
{
  "feedback": [...],
  "stats": {
    "totalFeedback": 15,
    "averageRating": 4.7,
    "averageServiceQuality": 4.8,
    "averagePunctuality": 4.6,
    "averageCommunication": 4.9,
    "recommendationRate": 93.3
  }
}
```

## Migration Steps

### 1. Update Environment Variables
Update your `.env` file:
```
DB_NAME=student_senior_db
# Remove DB_NAME_STUDENT and DB_NAME_SENIOR
```

### 2. Run Data Migration
```bash
cd backend
node migrate-data.js
```

### 3. Update Application
The application has been updated to use the single database. Start the server:
```bash
npm start
```

### 4. Verify Migration
Check the migration was successful by calling:
```
GET /api/test
```

## Request Flow

### For Seniors:
1. Senior creates a request via `POST /api/senior-requests`
2. Request appears with status `open`
3. Request is visible to all students via `GET /api/senior-requests/open`

### For Students:
1. Students view open requests via `GET /api/senior-requests/open`
2. Student accepts request via `PATCH /api/senior-requests/:id/accept`
3. Request status changes to `assigned`
4. Request is no longer visible to other students
5. Student updates status to `in_progress` then `completed`

### For Feedback:
1. After request completion, senior can submit feedback via `POST /api/senior-requests/:requestId/feedback`
2. Feedback is tied to the specific request and student
3. Students can view their aggregate feedback via `GET /api/senior-requests/feedback/student/:studentId`

## Database Relationships

```
seniors (1) --> (many) senior_requests
students (1) --> (many) senior_requests (via assignedStudentId)
senior_requests (1) --> (1) senior_feedback
seniors (1) --> (many) senior_feedback
students (1) --> (many) senior_feedback
```

## Key Features

### Request Visibility Logic
- Only `open` requests are shown to students
- Once a request is `assigned`, it's hidden from other students
- Students can only see requests assigned to them in their dashboard

### Feedback System
- One feedback per completed request
- Multiple rating categories (overall, service quality, punctuality, communication)
- Aggregate statistics for students
- Would recommend boolean flag

### Priority System
- Requests have priority levels: low, medium, high, urgent
- Can be used for sorting and filtering

### Status Tracking
- Complete lifecycle: open → assigned → in_progress → completed
- Cancellation support
- Timestamp tracking for assignment and completion

## Error Handling

### Common Scenarios:
- Student tries to accept already assigned request → 400 error
- Feedback submitted for non-completed request → 400 error
- Duplicate feedback for same request → 400 error
- Invalid status transitions → 400 error

## Frontend Integration

### Senior Dashboard Updates
The senior dashboard should be updated to:
1. Show request creation form
2. Display request status and assigned student
3. Allow feedback submission for completed requests

### Student Dashboard Updates
The student dashboard should:
1. Show available open requests
2. Allow accepting requests
3. Show assigned requests with status updates
4. Display feedback received

## Performance Considerations

### Indexes
- Indexes on `status`, `type`, `seniorId`, `assignedStudentId` for fast queries
- Unique index on `requestId` in feedback table

### Query Optimization
- Use joins to fetch related data in single queries
- Implement pagination for large result sets
- Cache frequently accessed data

## Security Considerations

### Authorization
- Seniors can only create/view their own requests
- Students can only accept available requests
- Only assigned students can update request status
- Only seniors can submit feedback for their requests

### Data Validation
- Strict enum validation for status, type, priority
- Rating bounds checking (1-5)
- Required field validation
- SQL injection protection via parameterized queries