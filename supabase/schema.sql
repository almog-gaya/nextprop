-- Create schema for business-related tables
-- We'll use the default public schema instead of a custom one

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255),
  phone_number VARCHAR(20),
  custom_twilio_number VARCHAR(20),
  custom_twilio_sid VARCHAR(50),
  twilio_verify_sid VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending_verification',
  verification_attempts INTEGER DEFAULT 0,
  verified_at TIMESTAMP WITH TIME ZONE,
  last_verification_at TIMESTAMP WITH TIME ZONE,
  business_owner_id UUID,
  user_id UUID REFERENCES auth.users(id), -- Link to Supabase auth
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on business name for searching
CREATE INDEX IF NOT EXISTS businesses_name_idx ON businesses(name);

-- Create index on phone numbers
CREATE INDEX IF NOT EXISTS businesses_phone_idx ON businesses(phone_number);

-- Verification attempts tracking
CREATE TABLE IF NOT EXISTS verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  twilio_sid VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on business ID for faster lookups
CREATE INDEX IF NOT EXISTS verification_business_idx ON verification_attempts(business_id);

-- Create index on phone number for faster lookups
CREATE INDEX IF NOT EXISTS verification_phone_idx ON verification_attempts(phone_number);

-- Verification checks tracking
CREATE TABLE IF NOT EXISTS verification_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  verification_attempt_id UUID NOT NULL REFERENCES verification_attempts(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  twilio_sid VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on business ID for faster lookups
CREATE INDEX IF NOT EXISTS verification_checks_business_idx ON verification_checks(business_id);

-- SMS Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twilio_sid VARCHAR(50) NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on Twilio SID for faster lookups
CREATE INDEX IF NOT EXISTS messages_twilio_sid_idx ON messages(twilio_sid);

-- Create index on business ID for faster lookups
CREATE INDEX IF NOT EXISTS messages_business_idx ON messages(business_id);

-- Create index on phone numbers for faster lookups
CREATE INDEX IF NOT EXISTS messages_phone_idx ON messages(from_number, to_number);

-- Update timestamp function for tracking last updates
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for timestamp updates
CREATE TRIGGER update_businesses_timestamp
BEFORE UPDATE ON businesses
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_messages_timestamp
BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_verification_attempts_timestamp
BEFORE UPDATE ON verification_attempts
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_verification_checks_timestamp
BEFORE UPDATE ON verification_checks
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Row Level Security Policies

-- Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Business policies
CREATE POLICY "Users can only view their own business"
  ON businesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only update their own business"
  ON businesses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Enable insert to authenticated users only"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Message policies
CREATE POLICY "Users can only view messages related to their business"
  ON messages FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can only insert messages for their business"
  ON messages FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Similar policies for verification tables
CREATE POLICY "Users can only view verification attempts related to their business"
  ON verification_attempts FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can only view verification checks related to their business"
  ON verification_checks FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())); 