import { NextResponse } from 'next/server';
import { emailLogs } from '../route';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.emails || !Array.isArray(data.emails) || data.emails.length === 0) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Missing or invalid emails array' 
        }, 
        { status: 400 }
      );
    }
    
    // Log the received data
    console.log(`Received bulk email request for ${data.emails.length} recipients`);
    
    // Process and track results
    const results = {
      success: 0,
      failed: 0,
      emailIds: [] as string[]
    };
    
    // Process each email
    for (const email of data.emails) {
      // Validate each email has required fields
      if (!email.to || !email.subject || !email.message) {
        results.failed++;
        continue;
      }
      
      try {
        // In a real implementation, this would make an API call to your email service
        // For this example, we'll simulate a 90% success rate
        
        if (Math.random() < 0.9) {
          // Successful send
          const emailId = `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          
          // Create a log entry
          const emailLog = {
            id: emailId,
            to: email.to,
            subject: email.subject,
            contactName: email.contactName || null,
            status: 'delivered',
            createdAt: new Date().toISOString()
          };
          
          // Store the log
          emailLogs.unshift(emailLog);
          
          results.success++;
          results.emailIds.push(emailId);
        } else {
          // Failed send
          results.failed++;
        }
      } catch (error) {
        results.failed++;
      }
    }
    
    // Keep only the latest 50 logs
    if (emailLogs.length > 50) {
      emailLogs.length = 50;
    }
    
    // Return a response with the results
    return NextResponse.json({
      status: 'success',
      message: `Processed ${results.success + results.failed} emails`,
      results: {
        total: results.success + results.failed,
        success: results.success,
        failed: results.failed,
        emailIds: results.emailIds
      }
    });
  } catch (error) {
    console.error('Error processing bulk emails:', error);
    
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