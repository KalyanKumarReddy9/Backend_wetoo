-- Migration: Update senior_feedback table to allow NULL values for requestId and seniorId
ALTER TABLE senior_feedback
  MODIFY COLUMN requestId INT UNSIGNED NULL,
  MODIFY COLUMN seniorId INT UNSIGNED NULL;

-- Add new columns if they don't exist
ALTER TABLE senior_feedback
  ADD COLUMN IF NOT EXISTS servicesNeeded TEXT NULL;

ALTER TABLE senior_feedback
  ADD COLUMN IF NOT EXISTS featuresNeeded TEXT NULL;