import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createBusinessForUser } from '@/lib/messaging-dashboard';

export async function POST(request: Request) {
  try {
    const { email, password, businessName } = await request.json();

    if (!email || !password || !businessName) {
      return NextResponse.json(
        { error: 'Email, password, and business name are required' },
        { status: 400 }
      );
    }

    // Register the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          business_name: businessName,
        },
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create business record for this user
    try {
      const business = await createBusinessForUser(authData.user.id, {
        name: businessName,
        contact_email: email,
        status: 'pending_verification',
        verification_attempts: 0,
      });

      return NextResponse.json({
        user: authData.user,
        business,
      });
    } catch (businessError) {
      console.error('Error creating business:2', businessError);
      
      // Clean up the auth user if business creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: 'Failed to create business record' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 