-- Add unique constraint to prevent duplicate interests for the same student
ALTER TABLE student_interests 
ADD CONSTRAINT unique_student_interest 
UNIQUE (studentId, type);