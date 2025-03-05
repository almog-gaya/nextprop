-- SQL script to ensure the authenticated user has a business record
-- Run this script in the Supabase SQL Editor after creating your user account

-- Get the current user ID
DO $$
DECLARE
    current_user_id UUID;
    business_exists BOOLEAN;
    business_id UUID;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO current_user_id FROM auth.users WHERE email = 'almog@gaya.app' LIMIT 1;
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email almog@gaya.app not found in auth.users';
    END IF;
    
    -- Check if the user already has a business
    SELECT EXISTS (
        SELECT 1 FROM businesses WHERE user_id = current_user_id
    ) INTO business_exists;
    
    -- If no business exists for this user, create one
    IF NOT business_exists THEN
        INSERT INTO businesses (
            name, 
            contact_email, 
            phone_number, 
            status, 
            user_id,
            created_at,
            updated_at
        ) VALUES (
            'almog Business', 
            'almog@gaya.app', 
            '123-456-7890', 
            'active', 
            current_user_id,
            NOW(),
            NOW()
        )
        RETURNING id INTO business_id;
        
        RAISE NOTICE 'Created new business (ID: %) for user %', business_id, current_user_id;
    ELSE
        SELECT id INTO business_id FROM businesses WHERE user_id = current_user_id LIMIT 1;
        RAISE NOTICE 'User % already has a business (ID: %)', current_user_id, business_id;
    END IF;
END $$; 