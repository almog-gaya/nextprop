-- Schema for GoHighLevel replacement tables
-- These tables replace the GHL mock API with Supabase

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for contacts
CREATE INDEX IF NOT EXISTS contacts_business_idx ON contacts(business_id);
CREATE INDEX IF NOT EXISTS contacts_email_idx ON contacts(email);
CREATE INDEX IF NOT EXISTS contacts_phone_idx ON contacts(phone);

-- Pipelines table
CREATE TABLE IF NOT EXISTS pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for pipelines
CREATE INDEX IF NOT EXISTS pipelines_business_idx ON pipelines(business_id);

-- Pipeline stages table
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
  order_num INTEGER NOT NULL, -- using order_num instead of order (reserved keyword)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for pipeline stages
CREATE INDEX IF NOT EXISTS pipeline_stages_pipeline_idx ON pipeline_stages(pipeline_id);

-- Opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  monetary_value DECIMAL(12, 2) DEFAULT 0,
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'active',
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for opportunities
CREATE INDEX IF NOT EXISTS opportunities_pipeline_idx ON opportunities(pipeline_id);
CREATE INDEX IF NOT EXISTS opportunities_stage_idx ON opportunities(stage_id);
CREATE INDEX IF NOT EXISTS opportunities_contact_idx ON opportunities(contact_id);
CREATE INDEX IF NOT EXISTS opportunities_business_idx ON opportunities(business_id);

-- Add triggers for timestamp updates
DO $$
BEGIN
  -- Check if the trigger already exists before creating it
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_contacts_timestamp') THEN
    CREATE TRIGGER update_contacts_timestamp
    BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_pipelines_timestamp') THEN
    CREATE TRIGGER update_pipelines_timestamp
    BEFORE UPDATE ON pipelines
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_pipeline_stages_timestamp') THEN
    CREATE TRIGGER update_pipeline_stages_timestamp
    BEFORE UPDATE ON pipeline_stages
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_opportunities_timestamp') THEN
    CREATE TRIGGER update_opportunities_timestamp
    BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
END
$$;

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contacts
DROP POLICY IF EXISTS "Users can only view contacts related to their business" ON contacts;
CREATE POLICY "Users can only view contacts related to their business"
  ON contacts FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can only insert contacts for their business" ON contacts;
CREATE POLICY "Users can only insert contacts for their business"
  ON contacts FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can only update contacts for their business" ON contacts;
CREATE POLICY "Users can only update contacts for their business"
  ON contacts FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- RLS Policies for pipelines
DROP POLICY IF EXISTS "Users can only view pipelines related to their business" ON pipelines;
CREATE POLICY "Users can only view pipelines related to their business"
  ON pipelines FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can only insert pipelines for their business" ON pipelines;
CREATE POLICY "Users can only insert pipelines for their business"
  ON pipelines FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can only update pipelines for their business" ON pipelines;
CREATE POLICY "Users can only update pipelines for their business"
  ON pipelines FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- RLS Policies for pipeline stages
DROP POLICY IF EXISTS "Users can only view pipeline stages related to their business" ON pipeline_stages;
CREATE POLICY "Users can only view pipeline stages related to their business"
  ON pipeline_stages FOR SELECT
  USING (pipeline_id IN (SELECT id FROM pipelines WHERE business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can only insert pipeline stages for their business" ON pipeline_stages;
CREATE POLICY "Users can only insert pipeline stages for their business"
  ON pipeline_stages FOR INSERT
  WITH CHECK (pipeline_id IN (SELECT id FROM pipelines WHERE business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can only update pipeline stages for their business" ON pipeline_stages;
CREATE POLICY "Users can only update pipeline stages for their business"
  ON pipeline_stages FOR UPDATE
  USING (pipeline_id IN (SELECT id FROM pipelines WHERE business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())));

-- RLS Policies for opportunities
DROP POLICY IF EXISTS "Users can only view opportunities related to their business" ON opportunities;
CREATE POLICY "Users can only view opportunities related to their business"
  ON opportunities FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can only insert opportunities for their business" ON opportunities;
CREATE POLICY "Users can only insert opportunities for their business"
  ON opportunities FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can only update opportunities for their business" ON opportunities;
CREATE POLICY "Users can only update opportunities for their business"
  ON opportunities FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())); 