# GHL to Supabase Migration

This document outlines the migration from GoHighLevel mock API to Supabase for the CRM functionality.

## Overview

We've migrated the following components from GoHighLevel mock API to Supabase SQL database:
- Pipelines
- Pipeline Stages
- Opportunities
- Contacts

## Database Schema

The migration adds the following tables to the Supabase database:

### Contacts
```sql
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
```

### Pipelines
```sql
CREATE TABLE IF NOT EXISTS pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Pipeline Stages
```sql
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
  order_num INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Opportunities
```sql
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
```

## Implementation Details

- All tables have proper Row Level Security (RLS) policies to ensure data isolation between businesses
- Each table is linked to a business ID to maintain proper data association
- Timestamps are automatically managed using triggers
- Indexes are created for optimal performance on frequently queried fields

## API Changes

The following API endpoints have been updated to use Supabase instead of the GHL mock API:

1. `GET /api/pipelines` - Get all pipelines
2. `GET /api/pipelines/:id/opportunities` - Get opportunities for a pipeline
3. `GET /api/opportunities/:id` - Get opportunity by ID
4. `PUT /api/opportunities/:id` - Update opportunity
5. `POST /api/opportunities/create` - Create a new opportunity
6. `POST /api/opportunities/:id/move` - Move opportunity to another stage
7. `DELETE /api/opportunities/:id` - Delete opportunity

## Data Initialization

A script is provided to initialize test data:
```bash
npx ts-node scripts/init-crm-data.ts
```

This script will:
1. Create two demo pipelines (Real Estate Deals and Investor Relations)
2. Create stages for each pipeline
3. Create demo contacts
4. Create demo opportunities in different stages

## Prerequisites

To use this migration, ensure:
1. Supabase is properly configured with the schema in `supabase/ghl_migration_schema.sql`
2. Environment variables are set for Supabase connection
3. At least one business exists in the businesses table

## Usage

The implementation is designed to be a drop-in replacement for the GHL mock API. The frontend components should continue to work with minimal or no changes, with the benefit of now using a real, persistent database.

## Security

- Data is segregated by business_id
- Row Level Security ensures users can only access their own data
- All database operations validate the current user's business_id

## Next Steps

Future improvements could include:
- Additional fields for more detailed contact and opportunity information
- Enhanced reporting capabilities
- Implementing additional GHL features not covered in this migration 