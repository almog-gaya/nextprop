# NextProp - Property Management System

A Next.js application for managing property locations using the GoHighLevel API.

## Features

- Create new locations/sub-accounts
- Automatic timezone handling
- International address support
- Secure API key management

## Environment Variables

The following environment variables are required:

```env
GHL_BASE_URL=https://rest.gohighlevel.com/v1
GHL_API_KEY=your_api_key_here
```

## Deployment

This application is optimized for deployment on Vercel. To deploy:

1. Push your code to GitHub
2. Visit [Vercel](https://vercel.com)
3. Import your repository
4. Add the required environment variables:
   - `GHL_API_KEY`: Your GoHighLevel API key
5. Deploy

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

- `GET /api/register`: Test the GoHighLevel API connection
- `POST /api/register`: Create a new location

## License

MIT
