-- This SQL script will update the business record with proper phone numbers
-- This specifically ensures phone_number and custom_twilio_number are correctly set

UPDATE businesses
SET 
  phone_number = '+15551234567',
  custom_twilio_number = '+15551234567',
  status = 'verified'
WHERE 
  user_id = '1fba1611-fdc5-438b-8575-34670faafe05'
RETURNING id, name, contact_email, phone_number, custom_twilio_number, status, user_id; 