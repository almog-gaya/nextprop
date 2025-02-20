import { NextResponse } from 'next/server';
import axios from 'axios';
import jwt from 'jsonwebtoken';

interface GHLToken {
  company_id: string;
  version: number;
  iat: number;
  sub: string;
}

function formatTimezone(timezone: string): string {
  // Convert UTC-8 to UTC format
  if (timezone.startsWith('UTC-')) {
    return 'UTC';
  }
  return timezone;
}

function getCompanyId() {
  const token = process.env.GHL_API_KEY;
  if (!token) return null;
  
  try {
    const decoded = jwt.decode(token) as GHLToken;
    console.log('Decoded token:', decoded);
    return decoded?.company_id;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

async function testEndpoints() {
  const companyId = getCompanyId();
  if (!companyId) {
    console.error('Could not extract company ID from API token');
    return;
  }

  const testData = {
    businessName: 'Test Location',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '1234567890',
    timezone: 'UTC',
    address1: '123 Test St',
    city: 'Test City',
    state: 'IL',
    country: 'IL',
    postal: '12345'
  };

  // Use Bearer Auth with v1 API
  const instance = axios.create({
    baseURL: 'https://rest.gohighlevel.com/v1',
    headers: {
      'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  try {
    console.log('\nCreating location...');
    console.log('Payload:', testData);
    const response = await instance.post('/locations', testData);
    console.log('Success:', response.data);
    // If successful, update the ghlInstance
    ghlInstance.defaults.baseURL = instance.defaults.baseURL;
    ghlInstance.defaults.headers = { ...instance.defaults.headers };
    return { 
      endpoint: '/locations',
      response: response.data 
    };
  } catch (error: any) {
    console.error('Error:', {
      endpoint: '/locations',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
  }
}

const ghlInstance = axios.create({
  baseURL: 'https://rest.gohighlevel.com/v1',
  headers: {
    'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

export async function GET() {
  try {
    const result = await testEndpoints();
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const companyId = getCompanyId();
    if (!companyId) {
      throw new Error('Could not extract company ID from API token');
    }

    const data = await request.json();
    console.log('Request payload:', data);
    console.log('Company ID:', companyId);
    
    const response = await ghlInstance.post('/locations', {
      businessName: data.name,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      address1: data.address,
      city: data.city,
      state: data.state,
      country: data.country === 'ישראל' ? 'IL' : data.country,
      postal: data.postalCode,
      timezone: formatTimezone(data.timezone)
    });

    return NextResponse.json({ success: true, data: response.data });
  } catch (error: any) {
    console.error('Error creating sub-account:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
      headers: error.config?.headers
    });
    return NextResponse.json(
      { success: false, error: error.response?.data?.message || error.message },
      { status: 500 }
    );
  }
} 