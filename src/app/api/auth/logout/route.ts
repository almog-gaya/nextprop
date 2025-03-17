import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Clear all GHL authentication-related cookies
    cookieStore.delete('ghl_access_token');
    cookieStore.delete('ghl_refresh_token');
    cookieStore.delete('ghl_token_timestamp');
    cookieStore.delete('ghl_location_id');
    cookieStore.delete('ghl_user_id');
    cookieStore.delete('ghl_company_id');
    cookieStore.delete('ghl_user_type');
    cookieStore.delete('ghl_location_data');
    cookieStore.delete('ghl_token_data');
    

    // Also clear nextprop cookies
    cookieStore.delete('nextprop_token');
    cookieStore.delete('auth_token');
    cookieStore.delete('user');
    cookieStore.delete('nextprop_user');
    
    // Set cookies with expiration in the past to ensure they're removed
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
    
    // Set expired cookies in the response headers too
    response.cookies.set('ghl_access_token', '', { expires: new Date(0) });
    response.cookies.set('ghl_refresh_token', '', { expires: new Date(0) });
    response.cookies.set('nextprop_token', '', { expires: new Date(0) });
    response.cookies.set('auth_token', '', { expires: new Date(0) });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ 
      error: 'Failed to logout', 
      message: (error as Error).message 
    }, { status: 500 });
  }
} 