import { NextRequest, NextResponse } from 'next/server';
import { getPropertyByAddress } from '@/lib/realEstateApis';

export async function GET(request: NextRequest) {
  try {
    // Extract the address parameter
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }
    
    // Call the function to get property details by address
    const data = await getPropertyByAddress(address);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching property by address:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property details', message: (error as Error).message },
      { status: 500 }
    );
  }
} 