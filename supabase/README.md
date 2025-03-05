# Supabase Database Setup

## Quick Setup Instructions

1. Log in to your [Supabase Dashboard](https://app.supabase.io)
2. Select your project
3. Navigate to the SQL Editor from the left sidebar
4. Create a new query
5. Copy the contents of the `schema.sql` file from this folder
6. Run the SQL query to create all necessary tables and security policies

## Understanding the Schema

The schema creates the following tables:

### Businesses
Stores information about businesses that use the messaging system:
- `id`: UUID primary key
- `name`: Business name
- `contact_email`: Contact email address
- `phone_number`: Main phone number
- `custom_twilio_number`: Custom Twilio phone number (if provisioned)
- `custom_twilio_sid`: Twilio SID for the custom number
- `twilio_verify_sid`: Twilio Verify service SID
- `status`: Verification status ('pending_verification', 'verified', 'suspended')
- `verification_attempts`: Number of verification attempts
- `verified_at`: When the business was verified
- `last_verification_at`: When the last verification attempt was made
- `business_owner_id`: Reference to business owner
- `user_id`: Reference to Supabase auth user
- Timestamps for creation and updates

### Verification Attempts
Tracks attempts to verify a business phone number:
- `id`: UUID primary key
- `business_id`: Reference to the business
- `phone_number`: Phone number being verified
- `twilio_sid`: Twilio verification SID
- `status`: Status of the verification attempt
- Timestamps for creation and updates

### Verification Checks
Tracks verification code checks:
- `id`: UUID primary key
- `business_id`: Reference to the business
- `verification_attempt_id`: Reference to the verification attempt
- `code`: Verification code that was checked
- `twilio_sid`: Twilio verification check SID
- `status`: Status of the verification check
- Timestamps for creation and updates

### Messages
Stores all SMS messages sent and received:
- `id`: UUID primary key
- `twilio_sid`: Twilio message SID
- `business_id`: Reference to the business
- `from_number`: Sender phone number
- `to_number`: Recipient phone number
- `body`: Message content
- `status`: Message status
- `direction`: Either 'inbound' or 'outbound'
- Timestamps for creation and updates

## Row-Level Security

The schema includes Row-Level Security (RLS) policies to ensure that:

1. Users can only access their own business records
2. Users can only access messages related to their businesses
3. Users can only view verification records for their own businesses

## Automatic Timestamp Updates

Triggers are set up to automatically update the `updated_at` timestamp whenever a record is modified.

## Important Note

If you need to modify this schema, make sure to update the TypeScript interfaces in `src/types/database.ts` to match the database structure. 