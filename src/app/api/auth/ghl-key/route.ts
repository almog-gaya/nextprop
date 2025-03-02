import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import axios from 'axios';

// Function to validate a GHL API key
async function validateGhlApiKey(apiKey: string, locationId?: string) {
  try {
    // Make a simple request to the GHL API to check if the key is valid
    const response = await axios.get('https://rest.gohighlevel.com/v1/contacts', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      params: locationId ? { locationId } : {}
    });
    
    // If we get here, the key is valid
    return { valid: true, data: response.data };
  } catch (error: any) {
    console.error('Error validating GHL API key:', error.response?.data || error.message);
    return { 
      valid: false, 
      error: error.response?.data?.message || error.message || 'Invalid API key'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the token from cookies
    const token = request.cookies.get('nextprop_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { apiKey, locationId } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key is required' },
        { status: 400 }
      );
    }
    
    // Validate the API key
    const validation = await validateGhlApiKey(apiKey, locationId);
    
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }
    
    // In a real app, we would update the user's API key in the database here
    
    return NextResponse.json({
      success: true,
      message: 'API key validated successfully'
    });
  } catch (error: any) {
    console.error('Error updating GHL API key:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update API key' },
      { status: 500 }
    );
  }
} 