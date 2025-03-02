import { NextRequest, NextResponse } from 'next/server';
import { searchProperties } from '@/lib/realEstateApis';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const apiType = searchParams.get('api') as 'propgpt' | 'reapi' | 'realtor' | 'zillow' || 'propgpt';
    const limit = Number(searchParams.get('limit')) || 20;
    const offset = Number(searchParams.get('offset')) || 0;
    const sort = searchParams.get('sort') || 'newest';
    const city = searchParams.get('city') || 'Miami';
    const state = searchParams.get('state') || 'FL';
    
    // Set parameters for API call
    const params = {
      city,
      state_code: state,
      limit,
      offset,
      sort,
      include_nearby_cities: searchParams.get('include_nearby') === 'true',
      status: searchParams.get('status') || 'for_sale',
      beds_min: searchParams.get('beds_min') ? Number(searchParams.get('beds_min')) : undefined,
      baths_min: searchParams.get('baths_min') ? Number(searchParams.get('baths_min')) : undefined,
      price_min: searchParams.get('price_min') ? Number(searchParams.get('price_min')) : undefined,
      price_max: searchParams.get('price_max') ? Number(searchParams.get('price_max')) : 1000000,
      property_type: searchParams.get('property_type') || undefined,
    };
    
    // Call the function to get properties from the selected API
    const data = await searchProperties(params, apiType);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties', message: (error as Error).message },
      { status: 500 }
    );
  }
} 