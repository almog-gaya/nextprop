-- This script modifies the Row-Level Security (RLS) policies
-- Run this in the Supabase SQL Editor

-- First, let's check if RLS is enabled on the pipelines table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('pipelines', 'pipeline_stages');

-- Enable RLS on the tables if not already enabled
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Pipelines are viewable by business owners" ON public.pipelines;
DROP POLICY IF EXISTS "Pipelines are insertable by business owners" ON public.pipelines;
DROP POLICY IF EXISTS "Pipelines are updatable by business owners" ON public.pipelines;
DROP POLICY IF EXISTS "Pipelines are deletable by business owners" ON public.pipelines;

DROP POLICY IF EXISTS "Pipeline stages are viewable by business owners" ON public.pipeline_stages;
DROP POLICY IF EXISTS "Pipeline stages are insertable by business owners" ON public.pipeline_stages;
DROP POLICY IF EXISTS "Pipeline stages are updatable by business owners" ON public.pipeline_stages;
DROP POLICY IF EXISTS "Pipeline stages are deletable by business owners" ON public.pipeline_stages;

-- Create policies for pipelines table
-- View policy
CREATE POLICY "Pipelines are viewable by business owners"
ON public.pipelines
FOR SELECT
USING (
  business_id IN (
    SELECT id FROM public.businesses 
    WHERE user_id = auth.uid()
  )
  OR business_id = '3a541cbd-2a17-4a28-b384-448f1ce8cf32' -- Special case for Almog's hardcoded business
);

-- Insert policy
CREATE POLICY "Pipelines are insertable by business owners"
ON public.pipelines
FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT id FROM public.businesses 
    WHERE user_id = auth.uid()
  )
  OR business_id = '3a541cbd-2a17-4a28-b384-448f1ce8cf32' -- Special case for Almog's hardcoded business
);

-- Update policy
CREATE POLICY "Pipelines are updatable by business owners"
ON public.pipelines
FOR UPDATE
USING (
  business_id IN (
    SELECT id FROM public.businesses 
    WHERE user_id = auth.uid()
  )
  OR business_id = '3a541cbd-2a17-4a28-b384-448f1ce8cf32' -- Special case for Almog's hardcoded business
)
WITH CHECK (
  business_id IN (
    SELECT id FROM public.businesses 
    WHERE user_id = auth.uid()
  )
  OR business_id = '3a541cbd-2a17-4a28-b384-448f1ce8cf32' -- Special case for Almog's hardcoded business
);

-- Delete policy
CREATE POLICY "Pipelines are deletable by business owners"
ON public.pipelines
FOR DELETE
USING (
  business_id IN (
    SELECT id FROM public.businesses 
    WHERE user_id = auth.uid()
  )
  OR business_id = '3a541cbd-2a17-4a28-b384-448f1ce8cf32' -- Special case for Almog's hardcoded business
);

-- Create policies for pipeline_stages table
-- View policy
CREATE POLICY "Pipeline stages are viewable by business owners"
ON public.pipeline_stages
FOR SELECT
USING (
  business_id IN (
    SELECT id FROM public.businesses 
    WHERE user_id = auth.uid()
  )
  OR business_id = '3a541cbd-2a17-4a28-b384-448f1ce8cf32' -- Special case for Almog's hardcoded business
);

-- Insert policy
CREATE POLICY "Pipeline stages are insertable by business owners"
ON public.pipeline_stages
FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT id FROM public.businesses 
    WHERE user_id = auth.uid()
  )
  OR business_id = '3a541cbd-2a17-4a28-b384-448f1ce8cf32' -- Special case for Almog's hardcoded business
);

-- Update policy
CREATE POLICY "Pipeline stages are updatable by business owners"
ON public.pipeline_stages
FOR UPDATE
USING (
  business_id IN (
    SELECT id FROM public.businesses 
    WHERE user_id = auth.uid()
  )
  OR business_id = '3a541cbd-2a17-4a28-b384-448f1ce8cf32' -- Special case for Almog's hardcoded business
)
WITH CHECK (
  business_id IN (
    SELECT id FROM public.businesses 
    WHERE user_id = auth.uid()
  )
  OR business_id = '3a541cbd-2a17-4a28-b384-448f1ce8cf32' -- Special case for Almog's hardcoded business
);

-- Delete policy
CREATE POLICY "Pipeline stages are deletable by business owners"
ON public.pipeline_stages
FOR DELETE
USING (
  business_id IN (
    SELECT id FROM public.businesses 
    WHERE user_id = auth.uid()
  )
  OR business_id = '3a541cbd-2a17-4a28-b384-448f1ce8cf32' -- Special case for Almog's hardcoded business
);

-- Or you can simply disable RLS for development (easiest solution)
ALTER TABLE public.pipelines DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages DISABLE ROW LEVEL SECURITY; 