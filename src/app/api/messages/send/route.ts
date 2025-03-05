import { NextResponse } from 'next/server';
import { sendSMS } from '@/lib/twilio';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { to, body, businessId } = await request.json();
    
    if (!to || !body) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Optional: Get user auth context from Supabase
    // const supabaseServerClient = createServerClient(...);
    // const { data: { user } } = await supabaseServerClient.auth.getUser();
    // if (!user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    
    // Send the message using our server-side Twilio function
    const message = await sendSMS(to, body, businessId);
    
    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
} 