-- SQL script to create the timestamp update function
-- Run this script in the Supabase SQL Editor before applying the schema

-- Create or replace the timestamp update function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 