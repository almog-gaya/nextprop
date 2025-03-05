import { NextRequest, NextResponse } from 'next/server';

/**
 * Email Test API Route
 * 
 * This endpoint previously tested the SendGrid integration which has been removed.
 * It now returns a placeholder response until a new email service is integrated.
 */

export async function GET(request: NextRequest) {
  console.warn('Email test endpoint accessed. The email service is being migrated to a new provider.');
  
  return NextResponse.json({
    success: false,
    message: 'The email service is currently unavailable',
    details: 'The SendGrid integration has been removed. A new email service will be integrated soon.',
    migrationNotice: 'Please refer to docs/sendgrid-deprecation.md for more information.'
  }, { status: 503 });
} 