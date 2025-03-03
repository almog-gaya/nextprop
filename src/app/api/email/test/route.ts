import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set in environment variables');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function GET(request: NextRequest) {
  try {
    // Log all environment variables we're using
    console.log('Environment variables check:', {
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'Present' : 'Missing',
      SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
      NEXT_PUBLIC_COMPANY_NAME: process.env.NEXT_PUBLIC_COMPANY_NAME
    });

    const msg = {
      to: 'almog9988@gmail.com', // Changed to your Gmail address
      from: {
        email: 'almog@gaya.app',
        name: 'Gaya Real Estate'
      },
      subject: 'SendGrid Test Email - Gmail Test',
      text: 'This is a test email from your Gaya application using SendGrid integration. Testing delivery to Gmail.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>SendGrid Test Email</h2>
          <p>This is a test email from your Gaya application using SendGrid integration.</p>
          <p>Testing delivery to Gmail address.</p>
          
          <div style="margin-top: 30px;">
            <p style="margin: 0;">Best regards,</p>
            <p style="margin: 0;"><strong>Almog Elmaliah</strong></p>
            <p style="margin: 0;"><strong>Gaya</strong></p>
            <p style="margin: 0; color: #666;">Herzliya, TA, IL</p>
            <p style="margin: 0;"><a href="https://www.gaya.app" style="color: #7c3aed; text-decoration: none;">www.gaya.app</a></p>
            <p style="margin: 0;">Tel: <a href="tel:+9720542840582" style="color: #7c3aed; text-decoration: none;">+972 054-284-0582</a></p>
          </div>
        </div>
      `
    };

    console.log('Attempting to send test email:', {
      to: msg.to,
      from: msg.from,
      subject: msg.subject
    });

    const response = await sgMail.send(msg);
    console.log('SendGrid response:', response);
    console.log('SendGrid response headers:', response[0].headers);
    console.log('Message ID:', response[0].headers['x-message-id']);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: response[0].headers['x-message-id'],
      response
    });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    console.error('SendGrid API error details:', {
      response: error.response?.body,
      code: error.code,
      message: error.message
    });
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.response?.body,
      code: error.code
    }, { status: 500 });
  }
} 