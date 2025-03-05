# Supabase Auth and Database Setup Guide

This guide walks you through setting up Supabase Authentication and Database for the NextProp application.

## Setup Steps

### 1. Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.io)
2. Create a new project with a meaningful name (e.g., "NextProp")
3. Set a secure database password
4. Choose a region closest to your users

### 2. Configure Environment Variables

Create or update your `.env.local` file with the following variables:

```
# Supabase 
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
TWILIO_VERIFY_SERVICE_SID=your-verify-service-sid
```

You can find your Supabase URL and anon key in the Supabase dashboard under "Settings" > "API".

### 3. Set Up the Database Schema

Run the database initialization script:

```bash
npm run init-db
```

This will copy the schema to your clipboard. Then:

1. Go to the Supabase dashboard
2. Select the "SQL Editor" from the left sidebar
3. Create a new query
4. Paste the SQL schema from your clipboard
5. Run the query to create all necessary tables

### 4. Start the Development Server

```bash
npm run dev
```

Navigate to http://localhost:3000/login to test the authentication system.

## Authentication Flow

The app now implements a complete user authentication flow:

1. **Registration**: Users register with email, password, and business name
2. **Login**: Users login with email and password
3. **Business Association**: Each user has their own business account
4. **Session Management**: Auth state persists across page refreshes
5. **Protected Routes**: Middleware ensures authenticated access to protected routes

## User-Business Model

The key feature of this implementation is the direct relationship between users and businesses:

1. Each authenticated user has exactly one business account
2. The `businesses` table has a `user_id` field that links to `auth.users(id)`
3. Row-Level Security ensures users can only access their own business data
4. All API calls respect this relationship, using the authenticated user's ID to filter data

## Testing the Implementation

To test the full authentication flow:

1. Register a new user at `/register`
2. Log in with the new credentials at `/login`
3. Visit the Twilio dashboard at `/twilio-dashboard`
4. Send test messages to verify database integration

## Troubleshooting

If you encounter any issues:

1. Check the `TROUBLESHOOTING.md` file for common problems and solutions
2. Ensure your Supabase credentials are correctly set in `.env.local`
3. Verify the database schema was created successfully in Supabase
4. Check browser console for any JavaScript errors
5. Review server logs for backend errors

### Common Error: "Module not found: Can't resolve 'net'"

If you encounter this error:

```
Module not found: Can't resolve 'net'
```

This is because the Twilio SDK is being imported in client-side code. The Twilio SDK uses Node.js built-in modules that aren't available in the browser. To fix:

1. Make sure the `server-only` package is installed:
   ```bash
   npm install server-only
   ```

2. Use our client-side messaging library (`src/lib/client-messaging.ts`) instead of directly importing Twilio code in client components.

3. All direct Twilio operations should go through server-side API routes in the `src/app/api` directory.

4. Check that `import './server-only'` is included in any server-side files that use Twilio.

## Next Steps

After completing the setup:

1. Add more robust error handling
2. Implement email verification
3. Add password reset functionality
4. Enhance user profile management
5. Set up additional security measures like 2FA 