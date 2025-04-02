# NextProp - Real Estate Lead Generation Dashboard

NextProp is a comprehensive real estate lead generation platform that integrates with the Zillow API to fetch property listings and generate qualified leads for real estate agents and brokers.

## Features

- **AI-Powered Property Search**: Use natural language to describe properties you're looking for
- **City-based Search**: Find properties in specific cities
- **Lead Generation**: Add property contacts as leads with one click
- **Dashboard Analytics**: Track leads, conversions, and revenue
- **Contact Management**: View and manage all your real estate leads
- **Automated Ringless Voicemails**: Send personalized voicemails to leads without disturbing them
- **AI Agent**: Configure an AI assistant to automatically respond to client messages

## Zillow API Integration

The platform integrates with the Zillow Working API to fetch property data using two main methods:

1. **City-Based Search**: Find properties in specific cities like Miami, New York, etc.
2. **AI-Powered Search**: Use natural language to describe exactly what you're looking for, such as "Houses for sale built after 2001 within price 500000, minimum lotsize 5000 sqft, 3 beds, 3 baths, in Miami Florida"

## AI Agent

The platform includes an AI agent capable of automatically responding to client messages. The agent can be configured with different tones and response lengths to match your communication style.

### AI Agent Features

- **Customizable Tone**: Choose between friendly, professional, or casual communication styles
- **Response Length Control**: Set responses to be short, medium, or long based on your preferences
- **Custom Instructions**: Add specific guidelines for how the AI should communicate
- **Enable/Disable Toggle**: Easily turn the AI agent on or off as needed

The AI agent uses OpenAI's GPT models to generate human-like responses focused on real estate communication, helping you maintain client engagement even when you're not available.

## AI Agent Integration

The AI agent is fully integrated with the messaging platform to provide intelligent conversation assistance. This integration enables:

### Automated Response System

- **Smart Response Generation**: The AI analyzes incoming messages and generates appropriate responses based on the message content, contact history, and property details
- **Context Awareness**: Responses account for previous messages in the conversation thread
- **Human-in-the-Loop**: All AI responses are presented as suggestions that can be edited or approved by human agents
- **Learning Capability**: The system learns from manual edits to improve future suggestions

### Integration Points

- **Messaging Interface**: AI suggestions appear directly in the message composition area
- **Configuration Dashboard**: Customize AI behavior through the dedicated AI Agent configuration page
- **Contact-Specific Learning**: The AI adapts to individual contact communication styles and preferences
- **Property-Aware Responses**: Responses can automatically incorporate relevant property details from the database

### Advanced Features

- **Multi-Intent Recognition**: The system can identify multiple questions or requests in a single message
- **Sentiment Analysis**: Detects customer sentiment to adjust tone and escalate as needed
- **Handoff Protocol**: Automatically suggests when a conversation should be escalated to a human agent
- **Follow-up Generation**: Suggests appropriate times and content for follow-up messages

### Performance Metrics

The system provides detailed analytics on AI agent performance:

- Response acceptance rate
- Average response time
- Customer satisfaction correlation
- Conversation completion metrics
- Learning curve visualization

## Unified Messaging Platform

The application includes a comprehensive multi-channel messaging system that consolidates all client communications in one place.

### Messaging Features

- **Conversation Management**: View, organize, and respond to client conversations from a single interface
- **Multi-Channel Support**: Handle SMS, email, and voice messages in a unified conversation view
- **Contact Sidebar**: Access contact details and notes without leaving the conversation
- **Message Templates**: Use pre-defined templates to quickly respond to common inquiries
- **Real-Time Status Updates**: See message delivery and read status in real-time
- **File Attachments**: Send and receive documents, images, and other files within conversations
- **AI Integration**: Optional AI-powered automatic responses based on configured preferences
- **Phone Number Selection**: Choose which business number to use when messaging clients
- **Conversation Search**: Quickly find specific conversations using advanced search options
- **Note Taking**: Add private notes to contacts for internal reference

### Conversation History

The system maintains a complete history of all client interactions across channels, providing:

- Chronological view of all interactions
- Message type identification (SMS, email, voice, system)
- Delivery status tracking
- Activity tracking for calls, voicemails, and system events
- Automated DND (Do Not Disturb) status tracking

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

### Messaging and Communication

1. Navigate to the Messaging page to view all client conversations
2. On the left panel, browse and filter your conversation list
3. Select a conversation to view the complete message history
4. View contact details in the right sidebar without leaving the conversation
5. Send messages via the input field at the bottom of the conversation
6. For SMS messages, select your sending number from the dropdown
7. Access message templates by clicking the document icon in the composer
8. Add notes to contacts via the notes icon in the conversation header
9. Make calls directly from the conversation by clicking the phone icon
10. Refresh conversation history using the refresh icon
11. File attachments can be added using the attachment button in the composer
12. View message delivery status indicators next to each sent message
13. Create a new conversation by clicking "New Conversation" in the top left
14. Search conversations using the search field above the conversation list

#### AI-Assisted Messaging

1. Navigate to the AI Agent page from the main menu
2. Configure your AI assistant's tone, response length, and custom instructions
3. Toggle the AI agent on/off using the switch at the top
4. When enabled, the AI will automatically suggest responses to incoming messages
5. Review and edit AI suggestions before sending
6. Fine-tune the AI with custom instructions for specific communication scenarios
7. Monitor AI usage and performance from the dashboard

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

## Technical Architecture

NextProp is built on a modern, scalable architecture using the following technologies:

### Frontend
- **Framework**: Next.js 13+ with App Router
- **UI Library**: React with Tailwind CSS for styling
- **State Management**: React Context API and custom hooks
- **API Communication**: Axios for RESTful API requests
- **Authentication**: JWT-based authentication with secure HTTP-only cookies
- **Form Handling**: React Hook Form with Zod validation

### Backend
- **Runtime**: Node.js with Next.js API routes
- **Database**: MongoDB for flexible document storage
- **Authentication**: NextAuth.js for secure, flexible authentication
- **File Storage**: AWS S3 for document and media storage
- **Search**: MongoDB Atlas Search for text-based searching
- **Caching**: Redis for performance optimization

### External Services
- **Property Data**: Zillow Working API via RapidAPI
- **SMS & Voice**: Twilio for SMS and voice communication
- **Email**: SendGrid for transactional emails
- **Voicemail**: VoiceDrop API for ringless voicemail delivery
- **AI**: OpenAI's GPT models for AI agent capabilities
- **Analytics**: Vercel Analytics for usage metrics

### Performance Optimizations
- Server-side rendering for improved SEO and initial load times
- Image optimization and lazy loading
- Code splitting and dynamic imports
- Edge caching for static assets
- Incremental Static Regeneration for dynamic content
- Optimistic UI updates for a responsive feel

### Security Measures
- CSRF protection
- XSS prevention
- Input validation on both client and server
- Rate limiting on API routes
- Data encryption in transit and at rest
- Environment variable isolation

# VoiceDrop API Reference

## Introduction

The VoiceDrop API provides comprehensive programmatic access to VoiceDrop's AI-powered ringless voicemail platform, enabling developers to build sophisticated communication workflows with minimal effort. This API allows for integration of powerful voice capabilities directly into applications with reliable, scalable API services.

## Key Capabilities

### Campaign Management
- Create, schedule, and monitor voice campaigns with advanced parameters
- Control delivery rates, timing, and campaign status in real-time
- Export campaign analytics and delivery reports programmatically

### AI Voice Technology
- Generate lifelike AI voice clones from short audio recordings
- Convert text to speech with natural-sounding personalization
- Access pre-made voice profiles or create custom voice designs

### Message Delivery
- Send individual or bulk ringless voicemails with customizable scripts
- Personalize messages dynamically with recipient variables
- Implement conditional logic for message selection and delivery

### Number Management
- Verify sender numbers through automated validation processes
- Validate recipient phone numbers with detailed carrier information
- Access DNC list functionality and compliance safeguards

### System Integration
- Webhook support for delivery status notifications
- Comprehensive user and account management
- Seamless integration with existing CRM and marketing systems

## Technical Implementation
The VoiceDrop RESTful API uses straightforward API key authentication and returns standardized JSON responses, making integration quick and reliable. The API provides consistent response codes and detailed error messages to simplify development and troubleshooting.

## API Endpoints

### Authentication
All API requests require an API key passed in the `auth-key` header.

### Base URL
Replace `{{base_url}}` with the appropriate API base URL.

### Campaigns

#### List Campaigns
```
GET {{base_url}}/campaigns
```
Fetch a list of all campaigns in your account.

**Response:**
```json
[
  {
    "Name": "Test",
    "_id": "1714926234800x968329891393830900",
    "Campaign Status": "Deleted",
    "Voice Clone IDs": [
      "w7WnkA91ghyzM3S97g5o"
    ],
    "Hourly Max Sending Rate": 250,
    "From Phone Numbers": [
      "7865881577"
    ],
    "Scheduled Days": [
      "Monday",
      "Tuesday"
    ],
    "Script": "Testing this ringless voicemail with my voice, let me know how it sounds. Testing this ringless voicemail with my voice, let me know how it soundsTesting this ringless voicemail with my voice, let me know how it sounds",
    "Type of Campaign": "AI Voice RVM",
    "Sending Until": "4:00 PM",
    "Sending From": "10:00 AM",
    "Schedule Timezone": "CST (Chicago)"
  },
  {
    "Name": "My Campaign",
    "_id": "1718996292867x443889740045615100",
    "Campaign Status": "Archived",
    "Voice Clone IDs": [
      "OfoILHkdexui6TvSL9LK"
    ],
    "Hourly Max Sending Rate": 500,
    "From Phone Numbers": [
      "7865881577",
      "7867444474"
    ],
    "Scheduled Days": [
      "Monday",
      "Tuesday",
      "Thursday",
      "Wednesday"
    ],
    "Script": "Testing this RVm with my voice, let me know how it sounds. Rodrigo",
    "Type of Campaign": "AI Voice RVM",
    "Sending Until": "6:00 PM",
    "Sending From": "11:00 AM",
    "Schedule Timezone": "EST (New York)"
  }
]
```

#### Add Prospects
```
POST {{base_url}}/campaigns/{campaign_id}/prospects
```
Add a single prospect to an existing campaign.

**Headers:**
- Content-Type: application/json
- auth-key: {{auth-key-campaign}}

**Request Body:**
```json
{
  "prospect_phone": "+17868323433", 
  "personalization_variables": { 
    "first_name": "Andrés"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Prospect was succesfully added to the campaign",
  "prospect_data": {
    "_status_": "ok",
    "first_name": "Andrés"
  }
}
```

#### Export Delivered RVMs
```
GET {{base_url}}/campaigns/{campaign_id}/reports
```
Retrieve detailed reports on RVM deliveries for a selected campaign.

**Response:**
```json
{
  "status": "success",
  "message": "Exported succesfully",
  "csv_url": "https://voicedrop-ai.s3.amazonaws.com/1729204600215x102283731818512380-1740084409.2035067.csv"
}
```

#### Set Campaign Status
```
PATCH {{base_url}}/campaigns/{campaign_id}
```
Update the status of a campaign to active, paused, or archived.

**Headers:**
- Content-Type: application/json

**Request Body:**
```json
{
  "status": "active"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Campaign status was succesfully set to active"
}
```

### Voice Clones

#### List Voice Clones
```
GET {{base_url}}/voice-clones
```
Retrieve a list of all your AI Voiceclones™.

**Response:**
```json
[
  {
    "id": "7fAamDiWVwAPT8BIJY6M",
    "name": "My First Voice Clone"
  },
  {
    "id": "TG2DyMaxgGBPDOg0Y4iV",
    "name": "Jake - American Male"
  },
  {
    "id": "L3UG5EDq7ECWuauMDLR7",
    "name": "John - American Male"
  },
  {
    "id": "t9N4uHq2y5gTZhR5tzia",
    "name": "John - American Male"
  },
  {
    "id": "nnKEtY0jvfDNS8dvRfzy",
    "name": "Ethan - American Male"
  }
]
```

#### Create Voice Clone
```
POST {{base_url}}/voice-clone
```
Generate a new AI Voiceclone™.

**Headers:**
- Content-Type: application/json

**Request Body:**
```json
{ 
    "recording_url": "https://6a9ad034b16e6510c0e362ad0a05ef65.cdn.bubble.io/f1708952444857x403244640253007000/Bart-real%20estate.mp3" 
}
```

**Response:**
```json
{
  "voice_clone_id": "XscKVRKl8z7FTOVSryQX"
}
```

#### Delete Voice Clone
```
DELETE {{base_url}}/voice-clone/{voice_clone_id}
```
Remove an existing AI Voiceclone™.

### Ringless Voicemails

#### Send Ringless Voicemail
```
POST {{base_url}}/voicemails
```
Send a ringless voicemail to a recipient.

**Headers:**
- Content-Type: application/json

**Request Body:**
```json
{
  "to": "+17868323433",
  "voice_clone_id": "nnKEtY0jvfDNS8dvRfzy",
  "from_number": "7867444474",
  "script": "Hey {{first_name}}, this is {{agent_name}} calling about your property on {{address}}. Please call me back at {{from_number}}.",
  "personalization_variables": {
    "first_name": "John",
    "agent_name": "Mike",
    "address": "123 Main St",
    "from_number": "7867444474"
  }
}
```

#### Get Voicemail Status
```
GET {{base_url}}/voicemails/{voicemail_id}/status
```
Check the delivery status of a specific voicemail.

**Response:**
```json
{
  "status": "delivered",
  "delivery_time": "2023-05-15T14:22:33Z",
  "duration": 28,
  "to": "+17868323433",
  "from": "7867444474"
}
```

### Phone Numbers

#### Verify Phone Number
```
POST {{base_url}}/phone/verify
```
Verify a phone number for use in campaigns.

**Headers:**
- Content-Type: application/json

**Request Body:**
```json
{
  "phone_number": "7867444474"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Phone number verification initiated",
  "verification_id": "ver_123456789"
}
```

#### Validate Recipient Number
```
POST {{base_url}}/phone/validate
```
Validate a recipient's phone number to ensure it can receive voicemails.

**Headers:**
- Content-Type: application/json

**Request Body:**
```json
{
  "phone_number": "+17868323433"
}
```

**Response:**
```json
{
  "valid": true,
  "phone_type": "mobile",
  "carrier": "T-Mobile",
  "can_receive_voicemail": true
}
```

#### List Verified Phone Numbers
```
GET {{base_url}}/phone/verified
```
Get a list of verified phone numbers in your account.

**Response:**
```json
[
  {
    "phone_number": "7867444474",
    "verification_date": "2023-04-10T08:15:30Z",
    "status": "active"
  },
  {
    "phone_number": "7865881577",
    "verification_date": "2023-01-22T14:30:45Z",
    "status": "active"
  }
]
```

### User

#### Get Account Information
```
GET {{base_url}}/account
```
Retrieve information about the current account.

**Response:**
```json
{
  "account_id": "acc_123456789",
  "email": "user@example.com",
  "plan": "premium",
  "credits_remaining": 2500,
  "subscription_status": "active"
}
```

#### Update Account Settings
```
PATCH {{base_url}}/account/settings
```
Update account settings.

**Headers:**
- Content-Type: application/json

**Request Body:**
```json
{
  "default_timezone": "EST (New York)",
  "notification_email": "notifications@example.com",
  "webhook_url": "https://example.com/webhooks/voicedrop"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Account settings updated successfully"
}
```

## Getting Started
Sign up for a free trial at [app.voicedrop.ai/signup](https://app.voicedrop.ai/signup) to receive your API credentials and begin development immediately.

## Support and Resources
Developer support team is available:
- Email: contact@voicedrop.ai
- Live chat: Available on website and platform
- Developer documentation: Includes detailed endpoint references and implementation guides
