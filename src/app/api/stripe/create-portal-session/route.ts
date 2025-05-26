import { NextRequest, NextResponse } from 'next/server';
import { createPortalSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id' },
        { status: 400 }
      );
    }

    const session = await createPortalSession(id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Error creating portal session' },
      { status: 500 }
    );
  }
} 