# NextProp - Real Estate Lead Generation Dashboard

NextProp is a comprehensive real estate lead generation platform that integrates with the Zillow API to fetch property listings and generate qualified leads for real estate agents and brokers.

## Features

- **AI-Powered Property Search**: Use natural language to describe properties you're looking for
- **City-based Search**: Find properties in specific cities
- **Lead Generation**: Add property contacts as leads with one click
- **Dashboard Analytics**: Track leads, conversions, and revenue
- **Contact Management**: View and manage all your real estate leads

## Zillow API Integration

The platform integrates with the Zillow Working API to fetch property data using two main methods:

1. **City-Based Search**: Find properties in specific cities like Miami, New York, etc.
2. **AI-Powered Search**: Use natural language to describe exactly what you're looking for, such as "Houses for sale built after 2001 within price 500000, minimum lotsize 5000 sqft, 3 beds, 3 baths, in Miami Florida"

## Getting Started

### Prerequisites

- Node.js 16+
- Next.js 13+
- RapidAPI Key for Zillow Working API

### Setup

1. Clone the repository
2. Create a `.env.local` file with your API keys:
```
RAPIDAPI_KEY=your_rapidapi_key_here
ZILLOW_RAPIDAPI_HOST=zillow-working-api.p.rapidapi.com
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
