# Supabase Setup Instructions for Twilio Integration

This document provides instructions on how to set up Supabase for the Twilio SMS and verification system.

## 1. Create a Supabase Account

1. Go to [supabase.com](https://supabase.com/) and sign up for an account if you don't already have one
2. Once logged in, click "New Project" to create a new project
3. Fill in the project details:
   - Name your project (e.g., "NextProp Twilio")
   - Set a secure database password (keep this safe)
   - Choose the region closest to your users
4. Click "Create new project"

## 2. Get Your Supabase Credentials

1. Once your project is created, go to the project dashboard
2. Click on the "Settings" icon in the left sidebar
3. Click on "API" in the settings menu
4. You'll need to copy two values:
   - **Project URL**: This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public** key: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. Add Credentials to Your Environment

Update your `.env.local` file with these values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Create the Database Schema

1. In your Supabase dashboard, go to the "SQL Editor" in the left sidebar
2. Click "New Query"
3. Copy the entire SQL schema from `supabase/schema.sql` in this project
4. Paste it into the SQL editor and click "Run"

This will create all the necessary tables and indexes for the Twilio integration.

## 5. Optional: Enable Row-Level Security (RLS)

If your application has authentication:

1. Go to "Authentication" > "Policies" in the Supabase dashboard
2. Create policies for each table that restrict access based on user roles
3. Update the SQL schema with proper RLS policies

## 6. Verify the Setup

1. Go to the "Table Editor" in the Supabase dashboard
2. You should see all the tables created in the `twilio` schema:
   - `businesses`
   - `verification_attempts`
   - `verification_checks`
   - `messages`

## 7. Test the Integration

1. Start your Next.js app with `npm run dev`
2. Navigate to `/twilio-demo`
3. Create a new business
4. Verify that the business is stored in Supabase by checking the `twilio.businesses` table
5. Test sending a verification code and check that the attempt is logged in `twilio.verification_attempts`

## 8. Troubleshooting

If you encounter database connection issues:

1. Check that your environment variables are correctly set
2. Verify that your IP is not restricted in Supabase settings
3. Check the console logs for any PostgreSQL errors

## 9. Performance Optimization

For production:

1. Add appropriate indexes based on your query patterns
2. Consider using Supabase realtime subscriptions for live updates
3. Enable Supabase Edge Functions for serverless functions closer to your database

Your Supabase-powered Twilio integration should now be ready to use! 