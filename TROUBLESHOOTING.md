# Troubleshooting Guide

## Database Connection Issues

### Error: "relation does not exist"

If you see an error like:

```
Error fetching businesses: {
  code: '42P01',
  details: null,
  hint: null,
  message: 'relation "public.businesses" does not exist'
}
```

This means that the database tables haven't been created yet in Supabase. Follow these steps to fix it:

1. **Run the database initialization script**:
   ```bash
   npm run init-db
   ```
   This script will help you copy the schema SQL to your clipboard.

2. **Execute the schema in Supabase**:
   - Log in to your [Supabase Dashboard](https://app.supabase.io)
   - Select your project
   - Navigate to the SQL Editor from the left sidebar
   - Create a new query
   - Paste the SQL that was copied to your clipboard (or from the console output)
   - Run the query

3. **Verify Tables Were Created**:
   - In the Supabase dashboard, go to the "Table Editor" in the left sidebar
   - You should see the following tables:
     - `businesses`
     - `verification_attempts`
     - `verification_checks`
     - `messages`

4. **Restart your development server**:
   ```bash
   npm run dev
   ```

### Error: "Failed to connect to database"

If you see connection errors:

1. **Check Environment Variables**:
   Make sure your `.env.local` file has the correct Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

2. **Verify Supabase Project Status**:
   - Check if your Supabase project is active in the dashboard
   - Ensure there are no ongoing maintenance or outages

3. **Check Network Connectivity**:
   - Make sure your development environment can reach the Supabase servers
   - Try accessing your Supabase URL in a browser

## Authentication Issues

If you encounter issues with authentication or row-level security:

1. **Check if RLS is enabled**:
   - In Supabase dashboard, go to "Authentication" → "Policies"
   - Ensure row-level security is enabled for all tables
   - Verify that appropriate policies are in place

2. **Verify User Authentication**:
   - Make sure you're properly signed in before accessing protected resources
   - Check that the user ID is being properly passed to database queries

## TypeScript Interface Issues

If you see TypeScript errors related to database interfaces:

1. **Check for schema-interface mismatches**:
   - Ensure the interfaces in `src/types/database.ts` match the actual schema
   - Update interfaces when you modify the database schema

2. **Rebuild TypeScript**:
   ```bash
   npx tsc --noEmit
   ```
   This will validate all TypeScript interfaces and show any errors.

## Need More Help?

If you continue to experience issues, you can:

1. Check the Supabase logs in the dashboard (SQL tab → "Logs")
2. Review the application logs in your terminal
3. Check Supabase documentation for specific error codes: [Supabase Docs](https://supabase.com/docs)
4. Add additional logging in the database service files to isolate the issue 