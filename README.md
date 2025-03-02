# NextProp - Real Estate Lead Generation Dashboard

NextProp is a comprehensive real estate lead generation platform that integrates with the Zillow API to fetch property listings and generate qualified leads for real estate agents and brokers.

## Features

- **AI-Powered Property Search**: Use natural language to describe properties you're looking for
- **City-based Search**: Find properties in specific cities
- **Lead Generation**: Add property contacts as leads with one click
- **Dashboard Analytics**: Track leads, conversions, and revenue
- **Contact Management**: View and manage all your real estate leads
- **Automated Ringless Voicemails**: Send personalized voicemails to leads without disturbing them

## Zillow API Integration

The platform integrates with the Zillow Working API to fetch property data using two main methods:

1. **City-Based Search**: Find properties in specific cities like Miami, New York, etc.
2. **AI-Powered Search**: Use natural language to describe exactly what you're looking for, such as "Houses for sale built after 2001 within price 500000, minimum lotsize 5000 sqft, 3 beds, 3 baths, in Miami Florida"

## NextProp Ringless Voicemail Integration

This project implements a ringless voicemail service for NextProp, integrating directly with the VoiceDrop API to send automated voicemails to prospects.

### VoiceDrop API Integration

The application has been updated to use VoiceDrop's API via a server-side Next.js API route, replacing the previous Make.com webhook integration. The implementation is located in:

- `src/lib/callService.ts` - Client-side service for managing calls
- `src/app/api/voicemail/route.ts` - Server-side API route to proxy requests to VoiceDrop

### Implementation Architecture

To avoid CORS (Cross-Origin Resource Sharing) issues, we've implemented a proxy architecture:

1. The client-side `callService.ts` sends requests to our own Next.js API route at `/api/voicemail`
2. The server-side API route makes the actual request to the VoiceDrop API
3. This approach prevents CORS errors that would occur when calling the VoiceDrop API directly from the browser

### Webhook Implementation

The application now includes a webhook system to receive and display real-time status updates from the VoiceDrop API:

1. **Webhook Endpoint**: Implemented at `/api/webhook/voicemail` to receive callbacks from VoiceDrop
2. **Webhook Storage**: Stores the latest 50 webhook responses in memory
3. **Webhook Display**: A dedicated page at `/webhooks` shows all received webhook responses
4. **Auto-Refresh**: The webhooks page automatically refreshes every 10 seconds to show the latest updates
5. **Integration**: When sending a voicemail, a dynamic webhook URL is generated and included in the request to VoiceDrop

This webhook system provides users with real-time updates about the status of their voicemails, including delivery confirmations, failures, and processing status.

### Current Implementation

The current implementation:

1. Uses the VoiceDrop API key (`vd_L6JGDq5Vj924Eq7k7Mb1`) for authentication via the `auth-key` header
2. Sends ringless voicemails through the `/ringless_voicemail` endpoint
3. Uses the "Reey 4" voice clone (ID: `dodUUtwsqo09HrH2RO8w`) for all messages
4. Uses the default sender phone number `9295953158` for all outgoing voicemails
5. Validates recipient phone numbers automatically
6. Creates personalized messages including the recipient's name and property address
7. Maintains the same interface as the previous Make.com integration to ensure minimal changes to the rest of the application

### API Documentation

The VoiceDrop API for sending ringless voicemails requires:

- **Endpoint**: `POST https://api.voicedrop.ai/v1/ringless_voicemail`
- **Headers**:
  - `Content-Type: application/json`
  - `auth-key: your_api_key_here`
- **Request Body**:
  - `voice_clone_id`: ID of the voice clone to use
  - `script`: Message that the recipient will receive
  - `from`: Sender phone number
  - `to`: Recipient US-based phone number
  - `validate_recipient_phone`: Boolean to enable validation
  - `send_status_to_webhook`: Optional webhook URL to receive status updates

### Next Steps for Improvement

To further enhance the integration, the following steps could be taken:

1. **Dynamic Voice Clones**: Allow selection of different voice clones for different types of messages
2. **Multiple Sender Numbers**: Implement rotation of sender phone numbers
3. **Webhook Integration**: Set up webhooks to receive delivery status updates
4. **Message Templates**: Create and manage reusable message templates
5. **Schedule Delivery**: Add ability to schedule voicemails for specific times
6. **Analytics**: Track delivery and response rates
7. **Environment Variables**: Move API keys and configuration to environment variables for better security

## Getting Started

### Prerequisites

- Node.js 16+
- Next.js 13+
- RapidAPI Key for Zillow Working API
- VoiceDrop API Key for ringless voicemail functionality

### Setup

1. Clone the repository
2. Create a `.env.local` file with your API keys:
```
RAPIDAPI_KEY=your_rapidapi_key_here
ZILLOW_RAPIDAPI_HOST=zillow-working-api.p.rapidapi.com
VOICEDROP_API_KEY=your_voicedrop_api_key_here
```
3. Install dependencies:
```
npm install
```
4. Run the development server:
```
npm run dev
```

## Usage

### Property Search

1. Navigate to the Properties page
2. Choose between "Search by City" or "Natural Language Search"
3. For city search, enter the city name
4. For AI search, describe the property you're looking for in detail
5. Click "Search" or "Search with AI" to find properties
6. Click "Add to Leads" to add a property contact to your leads database

### Automated Voicemails

1. Navigate to the Calls page
2. Select a contact or enter a new contact's information
3. Enter the recipient's first name and property address
4. Click "Send Voicemail" to dispatch a personalized ringless voicemail
5. Track the status of sent voicemails in the Call Logs section
6. Click "View Webhook Responses" to see real-time status updates from the VoiceDrop API

### Bulk Voicemail Sending

1. Navigate to the Calls page and click "Bulk Upload Contacts"
2. Upload an Excel file (.xlsx, .xls, or .csv) with contacts in the required format:
   - The file must have "Contact Name", "Phone", and "Street Name" columns
   - Phone numbers should include country code (e.g., +18167505325)
   - Each contact should have their individual street name
3. Select the contacts you wish to include
4. Create a customized script using placeholders:
   - Use `{{first_name}}` to insert each recipient's first name
   - Use `{{street_name}}` to insert each recipient's street name
5. Click "Send Voicemails" to begin the bulk sending process
6. Track sending progress in real-time as voicemails are dispatched
7. View detailed webhook responses on the Webhooks page

### Lead Management

1. Navigate to the Leads page to see all collected leads
2. Filter and sort leads based on status, date, etc.
3. View detailed information about each lead
4. Update lead status as you progress through your sales pipeline

## API Endpoints

The platform includes several API endpoints:

- `/api/properties`: Fetch properties by city, limit, and other parameters
- `/api/properties/ai-search`: Search properties using natural language via Zillow AI
- `/api/properties/address`: Find a specific property by address
- `/api/contacts/add-lead`: Add a new lead to the database
- `/api/voicemail`: Send ringless voicemails via the VoiceDrop API
- `/api/webhook/voicemail`: Receive webhook callbacks from VoiceDrop with voicemail status updates

## Dashboard Widgets

The dashboard includes several widgets:

- **KPI Cards**: Display key metrics (contacts, revenue, calls, leads)
- **Real Estate Widget**: Shows property stats and quick search
- **Lead Summary**: Visualizes lead sources and conversion rates
- **Contact List**: Shows recent contacts
- **Revenue Chart**: Tracks revenue over time

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
