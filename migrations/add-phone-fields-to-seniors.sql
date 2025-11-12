-- Migration to add phone fields to seniors table
-- Run this script to add phone1, phone2, phone3 columns to the seniors table

USE govt_app;

-- Add phone1, phone2, phone3 columns to seniors table
ALTER TABLE seniors 
ADD COLUMN phone1 VARCHAR(20),
ADD COLUMN phone2 VARCHAR(20), 
ADD COLUMN phone3 VARCHAR(20);

-- Verify the columns were added
DESCRIBE seniors;

-- Optional: Add some sample data for testing
-- UPDATE seniors SET phone1 = '9876543210', phone2 = '9876543211', phone3 = '9876543212' WHERE id = 1;