import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key from environment variable
if (!process.env.SENDGRID_API_KEY) {
  console.error('SendGrid API key not found in environment variables');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface PropertyInquiryData {
  contactData: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
    companyName?: string;
  };
  propertyDetails: {
    address: {
      line: string;
      city: string;
      state_code: string;
      postal_code: string;
    };
    price: string;
    contact: {
      name: string;
      email: string;
      phone: string;
    };
  };
}

export async function sendEmail({ to, subject, text, html }: EmailData) {
  try {
    if (!process.env.SENDGRID_FROM_EMAIL) {
      throw new Error('SENDGRID_FROM_EMAIL is not set in environment variables');
    }

    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Gaya'
      },
      bcc: 'almog9988@gmail.com', // Added BCC for monitoring
      subject,
      text,
      html: html || text,
      mail_settings: {
        sandbox_mode: {
          enable: false // Make sure sandbox mode is disabled
        }
      }
    };

    console.log('Attempting to send email:', {
      to: msg.to,
      from: msg.from,
      bcc: msg.bcc,
      subject: msg.subject
    });

    const response = await sgMail.send(msg);
    console.log('Email sent successfully:', response);
    console.log('Message ID:', response[0].headers['x-message-id']);
    return { success: true, response, messageId: response[0].headers['x-message-id'] };
  } catch (error: any) {
    console.error('Error sending email:', error);
    if (error.response) {
      console.error('SendGrid API error:', error.response.body);
    }
    return { 
      success: false, 
      error: error.message,
      details: error.response?.body,
      code: error.code
    };
  }
}

export async function sendPropertyInquiryEmail({ contactData, propertyDetails }: PropertyInquiryData) {
  // Get the sender name - prioritize company name, fallback to personal name
  const senderName = contactData.name;
  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Gaya';
  
  const subject = `Property Inquiry: ${propertyDetails.address.line}`;
  
  // Professional email template
  const text = `
Dear ${propertyDetails.contact.name},

I noticed you own the property at ${propertyDetails.address.line} and wanted to reach out regarding a potential offer. Would you be interested in discussing this further?

Best regards,
${senderName}
${companyName}
${process.env.COMPANY_ADDRESS || ''}
${process.env.COMPANY_WEBSITE ? `Website: ${process.env.COMPANY_WEBSITE}` : ''}
Tel: +9720542840582

---
Property Details:
Address: ${propertyDetails.address.line}
Location: ${propertyDetails.address.city}, ${propertyDetails.address.state_code} ${propertyDetails.address.postal_code}
Listed Price: ${propertyDetails.price}

${contactData.notes ? `Additional Notes: ${contactData.notes}` : ''}
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Dear ${propertyDetails.contact.name},</p>
      
      <p>I noticed you own the property at ${propertyDetails.address.line} and wanted to reach out regarding a potential offer. Would you be interested in discussing this further?</p>
      
      <div style="margin-top: 30px;">
        <p style="margin: 0;">Best regards,</p>
        <p style="margin: 0;"><strong>${senderName}</strong></p>
        <p style="margin: 0;"><strong>${companyName}</strong></p>
        <p style="margin: 0; color: #666;">${process.env.COMPANY_ADDRESS || ''}</p>
        ${process.env.COMPANY_WEBSITE ? `<p style="margin: 0;"><a href="https://${process.env.COMPANY_WEBSITE}" style="color: #7c3aed; text-decoration: none;">${process.env.COMPANY_WEBSITE}</a></p>` : ''}
        <p style="margin: 0;">Tel: <a href="tel:+9720542840582" style="color: #7c3aed; text-decoration: none;">+972 054-284-0582</a></p>
      </div>
      
      <hr style="border: 1px solid #eee; margin: 20px 0;">
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px;">
        <h3 style="color: #333; margin-top: 0;">Property Details:</h3>
        <p style="margin: 5px 0;">
          <strong>Address:</strong> ${propertyDetails.address.line}<br>
          <strong>Location:</strong> ${propertyDetails.address.city}, ${propertyDetails.address.state_code} ${propertyDetails.address.postal_code}<br>
          <strong>Listed Price:</strong> ${propertyDetails.price}
        </p>
      </div>
      
      ${contactData.notes ? `
        <div style="margin-top: 20px;">
          <h3 style="color: #333;">Additional Notes:</h3>
          <p>${contactData.notes}</p>
        </div>
      ` : ''}
    </div>
  `;

  console.log('Preparing to send property inquiry email:', {
    to: propertyDetails.contact.email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    senderName
  });

  return sendEmail({
    to: propertyDetails.contact.email,
    subject,
    text,
    html
  });
} 