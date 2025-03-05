-- SQL script to create a test business if one doesn't exist
-- Run this script in the Supabase SQL Editor before initializing CRM data if needed

DO $$
DECLARE
  user_id UUID;
  business_id UUID;
  business_count INTEGER;
BEGIN
  -- Check if there are any businesses
  SELECT COUNT(*) INTO business_count FROM businesses;
  
  IF business_count > 0 THEN
    RAISE NOTICE 'Businesses already exist. No need to create a test business.';
    RETURN;
  END IF;
  
  -- Get the first user ID
  SELECT id INTO user_id FROM auth.users LIMIT 1;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in the system. Please create a user first.';
  END IF;
  
  RAISE NOTICE 'Using user ID: %', user_id;
  
  -- Create a test business
  INSERT INTO businesses (
    id,
    name,
    contact_email,
    phone_number,
    status,
    verification_attempts,
    user_id
  )
  VALUES (
    gen_random_uuid(),
    'Test Business',
    'test@example.com',
    '555-123-4567',
    'verified',
    0,
    user_id
  )
  RETURNING id INTO business_id;
  
  RAISE NOTICE 'Created test business with ID: %', business_id;
END $$; 