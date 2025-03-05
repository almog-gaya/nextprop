import { NextResponse } from 'next/server';
import { getBusinessConversations, getAllBusinesses } from '@/lib/messaging-dashboard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    
    if (!businessId) {
      // If no business ID, return a list of businesses
      const businesses = await getAllBusinesses();
      return NextResponse.json({ businesses });
    }
    
    // Get conversations for this business
    const conversations = await getBusinessConversations(businessId);
    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
} 