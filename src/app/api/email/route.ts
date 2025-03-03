import { NextResponse } from 'next/server';

// This would be replaced with actual email service configuration
// Example services: SendGrid, Mailgun, AWS SES, etc.
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'your-api-key-here';
const EMAIL_SENDER = process.env.EMAIL_SENDER || 'noreply@yourdomain.com';

// Store email logs for demonstration purposes
// In a production app, this would be in a database
export const emailLogs: any[] = [];

export async function POST(request: Request) {
  try {
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
          message: 'Missing required fields: to, subject, or message' 
        }, 
        { status: 400 }
      );
    }
    
    // In a real implementation, this would make an API call to your email service
    // For demonstration, we'll simulate a successful API call
    
    // Create a log entry
    const emailLog = {
      id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      to: data.to,
      subject: data.subject,
      contactName: data.contactName || null,
      status: 'delivered',
      createdAt: new Date().toISOString()
    };
    
    // Store the log
    emailLogs.unshift(emailLog);
    
    // Keep only the latest 50 logs
    if (emailLogs.length > 50) {
      emailLogs.length = 50;
    }
    
    // Return a success response
    return NextResponse.json({
      status: 'success',
      message: 'Email sent successfully',
      emailId: emailLog.id
    });
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Return an error response
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 