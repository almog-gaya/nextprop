import { NextResponse } from 'next/server';
import GoHighLevelService from '@/services/gohighlevel';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const response = await GoHighLevelService.createSubAccount({
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode,
      timezone: data.timezone,
    });

    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 