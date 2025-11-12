-- Migration: add servicesNeeded and featuresNeeded to senior_feedback (safe, non-destructive)
-- First, we need to modify the existing columns to allow NULL values
ALTER TABLE senior_feedback
  MODIFY COLUMN requestId INT UNSIGNED NULL,
  MODIFY COLUMN seniorId INT UNSIGNED NULL;

-- Then add the new columns
ALTER TABLE senior_feedback
  ADD COLUMN IF NOT EXISTS servicesNeeded TEXT NULL,
  ADD COLUMN IF NOT EXISTS featuresNeeded TEXT NULL;