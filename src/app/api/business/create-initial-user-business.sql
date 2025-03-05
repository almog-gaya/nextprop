-- This script directly creates a business for the almog@gaya.app user
-- using the exact IDs needed by the application.

-- This is for direct execution in the Supabase SQL editor

-- Delete existing records to start clean
DELETE FROM businesses WHERE user_id = '1fba1611-fdc5-438b-8575-34670faafe05';

-- Insert with precise ID
INSERT INTO businesses (
  id,
  name, 
  contact_email, 
  phone_number,
  custom_twilio_number,
  status, 
  user_id,
  created_at,
  updated_at
) VALUES (
  '3a541cbd-2a17-4a28-b384-448f1ce8cf32',  -- Specific ID used in manual fix
  'Almog Business', 
  'almog@gaya.app', 
  '+15551234567',
  '+15551234567',
  'verified', 
  '1fba1611-fdc5-438b-8575-34670faafe05',  -- Specific User ID
  NOW(),
  NOW()
);

-- Verify the insert worked
SELECT * FROM businesses WHERE user_id = '1fba1611-fdc5-438b-8575-34670faafe05'; 