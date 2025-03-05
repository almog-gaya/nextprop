import { NextResponse } from 'next/server';

// This would be replaced with actual email service configuration
// SendGrid has been removed. A new email service provider will be implemented soon.
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'pending-implementation';
const EMAIL_SENDER = process.env.EMAIL_SENDER || 'noreply@yourdomain.com';

// Store email logs for demonstration purposes
// In a production app, this would be in a database
export const emailLogs: any[] = [];

export async function POST(request: Request) {
  try {
    // Notify that email service is unavailable
    console.warn('Email service is currently unavailable. A new provider will be integrated soon.');
    
    // Parse the request body
    const data = await request.json();
    
    // Log the received data
    console.log('Received email request:', {
      to: data.to,
      subject: data.subject,
      message: data.message
    });
    
    // Validate required fields
    if (!data.to || !data.subject || !data.message) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Missing required fields: to, subject, or message',
          serviceStatus: 'Email service is currently unavailable due to provider migration.'
        }, 
        { status: 400 }
      );
    }
    
    // Create a log entry (for tracking purposes only, email won't actually be sent)
    const emailLog = {
      id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      to: data.to,
      subject: data.subject,
      contactName: data.contactName || null,
      status: 'undelivered',
      createdAt: new Date().toISOString(),
      note: 'Email service is being migrated to a new provider.'
    };
    
    // Store the log
    emailLogs.unshift(emailLog);
    
    // Keep only the latest 50 logs
    if (emailLogs.length > 50) {
      emailLogs.length = 50;
    }
    
    // Return a service unavailable response
    return NextResponse.json({
      status: 'error',
      message: 'Email service temporarily unavailable',
      emailId: emailLog.id,
      serviceStatus: 'Email service is currently unavailable due to provider migration. Please refer to docs/sendgrid-deprecation.md for more information.'
    }, { status: 503 });
  } catch (error) {
    console.error('Error processing email request:', error);
    
    // Return an error response
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        serviceStatus: 'Email service is currently unavailable due to provider migration.'
      }, 
      { status: 500 }
    );
  }
} 