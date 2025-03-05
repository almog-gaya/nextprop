import { NextRequest, NextResponse } from 'next/server';
import { getBusinessConversations } from '@/lib/messaging-dashboard';

/**
 * GET /api/conversations
 * Get all conversations from Supabase
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    const conversations = await getBusinessConversations(businessId);
    
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
 