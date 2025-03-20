import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('ghl_access_token')?.value; 
    const locationId = cookieStore.get('ghl_location_id'); 
    if (!accessToken) {
      return NextResponse.json({ authenticated: false, user: null, locationData: null });
    } 

    // Return locationId directly in the root of the response
    return NextResponse.json({
      locationId: locationId?.value
    });
}