-- This script disables Row-Level Security (RLS) for the CRM tables
-- Run this in the Supabase SQL Editor for a quick development fix

-- Disable RLS on the tables
ALTER TABLE public.pipelines DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages DISABLE ROW LEVEL SECURITY;

-- Confirm RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('pipelines', 'pipeline_stages'); 