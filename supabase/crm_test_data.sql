-- SQL script to initialize test CRM data
-- Run this script in the Supabase SQL Editor after applying the schema

-- First, we need to get the first business ID
-- You can replace this with a specific business ID if needed
DO $$
DECLARE
  business_id UUID;
  real_estate_pipeline_id UUID;
  investor_pipeline_id UUID;
  lead_stage_id UUID;
  contacted_stage_id UUID;
  assessment_stage_id UUID;
  contact1_id UUID;
  contact2_id UUID;
  contact3_id UUID;
  contact4_id UUID;
BEGIN
  -- Get the first business ID
  SELECT id INTO business_id FROM businesses LIMIT 1;
  
  -- Check if business exists
  IF business_id IS NULL THEN
    RAISE EXCEPTION 'No business found. Please create a business first.';
  END IF;
  
  RAISE NOTICE 'Using business ID: %', business_id;
  
  -- Create Real Estate Pipeline
  INSERT INTO pipelines (id, name, business_id)
  VALUES (gen_random_uuid(), 'Real Estate Deals', business_id)
  RETURNING id INTO real_estate_pipeline_id;
  
  RAISE NOTICE 'Created Real Estate pipeline with ID: %', real_estate_pipeline_id;
  
  -- Create Investor Pipeline
  INSERT INTO pipelines (id, name, business_id)
  VALUES (gen_random_uuid(), 'Investor Relations', business_id)
  RETURNING id INTO investor_pipeline_id;
  
  RAISE NOTICE 'Created Investor pipeline with ID: %', investor_pipeline_id;
  
  -- Create stages for Real Estate pipeline
  INSERT INTO pipeline_stages (id, name, pipeline_id, order_num)
  VALUES (gen_random_uuid(), 'Lead', real_estate_pipeline_id, 1)
  RETURNING id INTO lead_stage_id;
  
  INSERT INTO pipeline_stages (id, name, pipeline_id, order_num)
  VALUES (gen_random_uuid(), 'Contacted', real_estate_pipeline_id, 2)
  RETURNING id INTO contacted_stage_id;
  
  INSERT INTO pipeline_stages (id, name, pipeline_id, order_num)
  VALUES (gen_random_uuid(), 'Property Assessment', real_estate_pipeline_id, 3)
  RETURNING id INTO assessment_stage_id;
  
  INSERT INTO pipeline_stages (id, name, pipeline_id, order_num)
  VALUES (gen_random_uuid(), 'Negotiation', real_estate_pipeline_id, 4);
  
  INSERT INTO pipeline_stages (id, name, pipeline_id, order_num)
  VALUES (gen_random_uuid(), 'Contract', real_estate_pipeline_id, 5);
  
  INSERT INTO pipeline_stages (id, name, pipeline_id, order_num)
  VALUES (gen_random_uuid(), 'Closing', real_estate_pipeline_id, 6);
  
  -- Create stages for Investor pipeline
  INSERT INTO pipeline_stages (id, name, pipeline_id, order_num)
  VALUES (gen_random_uuid(), 'Prospecting', investor_pipeline_id, 1);
  
  INSERT INTO pipeline_stages (id, name, pipeline_id, order_num)
  VALUES (gen_random_uuid(), 'Initial Meeting', investor_pipeline_id, 2);
  
  INSERT INTO pipeline_stages (id, name, pipeline_id, order_num)
  VALUES (gen_random_uuid(), 'Proposal', investor_pipeline_id, 3);
  
  INSERT INTO pipeline_stages (id, name, pipeline_id, order_num)
  VALUES (gen_random_uuid(), 'Due Diligence', investor_pipeline_id, 4);
  
  INSERT INTO pipeline_stages (id, name, pipeline_id, order_num)
  VALUES (gen_random_uuid(), 'Investment', investor_pipeline_id, 5);
  
  INSERT INTO pipeline_stages (id, name, pipeline_id, order_num)
  VALUES (gen_random_uuid(), 'Follow-up', investor_pipeline_id, 6);
  
  -- Create contacts
  INSERT INTO contacts (id, name, email, phone, business_id)
  VALUES (gen_random_uuid(), 'John Smith', 'john@example.com', '555-123-4567', business_id)
  RETURNING id INTO contact1_id;
  
  INSERT INTO contacts (id, name, email, phone, business_id)
  VALUES (gen_random_uuid(), 'Jane Doe', 'jane@example.com', '555-987-6543', business_id)
  RETURNING id INTO contact2_id;
  
  INSERT INTO contacts (id, name, email, phone, business_id)
  VALUES (gen_random_uuid(), 'Bob Johnson', 'bob@example.com', '555-456-7890', business_id)
  RETURNING id INTO contact3_id;
  
  INSERT INTO contacts (id, name, email, phone, business_id)
  VALUES (gen_random_uuid(), 'Sarah Williams', 'sarah@example.com', '555-567-8901', business_id)
  RETURNING id INTO contact4_id;
  
  -- Create opportunities in the Lead stage
  INSERT INTO opportunities (id, name, monetary_value, pipeline_id, stage_id, contact_id, status, business_id)
  VALUES (
    gen_random_uuid(),
    '123 Main St Property',
    250000,
    real_estate_pipeline_id,
    lead_stage_id,
    contact1_id,
    'active',
    business_id
  );
  
  INSERT INTO opportunities (id, name, monetary_value, pipeline_id, stage_id, contact_id, status, business_id)
  VALUES (
    gen_random_uuid(),
    '456 Oak Ave Property',
    375000,
    real_estate_pipeline_id,
    lead_stage_id,
    contact2_id,
    'active',
    business_id
  );
  
  -- Create opportunities in the Contacted stage
  INSERT INTO opportunities (id, name, monetary_value, pipeline_id, stage_id, contact_id, status, business_id)
  VALUES (
    gen_random_uuid(),
    '789 Pine Rd Property',
    425000,
    real_estate_pipeline_id,
    contacted_stage_id,
    contact3_id,
    'active',
    business_id
  );
  
  -- Create opportunities in the Property Assessment stage
  INSERT INTO opportunities (id, name, monetary_value, pipeline_id, stage_id, contact_id, status, business_id)
  VALUES (
    gen_random_uuid(),
    '101 Cedar Ln Property',
    550000,
    real_estate_pipeline_id,
    assessment_stage_id,
    contact4_id,
    'active',
    business_id
  );
  
  RAISE NOTICE 'Test data creation completed!';
END $$; 