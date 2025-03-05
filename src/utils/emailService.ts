/**
 * Email Service
 * 
 * NOTICE: The SendGrid implementation has been removed.
 * This is a temporary placeholder until a new email service provider is integrated.
 */

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

/**
 * Send an email using the email service.
 * This is a placeholder implementation until a new provider is integrated.
 */
export async function sendEmail({ to, subject, text, html }: EmailData) {
  console.warn('Email service is currently unavailable. A new provider will be integrated soon.');
  console.log('Email request:', { to, subject });
  
  // This is a placeholder - implementation pending selection of new email provider
  return { 
    success: false, 
    error: 'Email service not implemented',
    details: 'The email service is being migrated to a new provider.'
  };
}

/**
 * Send a property inquiry email.
 * This is a placeholder implementation until a new provider is integrated.
 */
export async function sendPropertyInquiryEmail({ contactData, propertyDetails }: PropertyInquiryData) {
  console.warn('Email service is currently unavailable. A new provider will be integrated soon.');
  console.log('Property inquiry email request for property:', propertyDetails.address.line);
  
  // Generate the email content (for future implementation)
  const subject = `Property Inquiry: ${propertyDetails.address.line}`;
  const senderName = contactData.name;
  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Gaya';
  
  // For documentation purposes only - this won't actually send an email
  const emailData = {
    to: propertyDetails.contact.email,
    subject,
    text: `Property inquiry for ${propertyDetails.address.line}`,
    html: `<p>Property inquiry for ${propertyDetails.address.line}</p>`
  };
  
  // This is a placeholder - implementation pending selection of new email provider
  return { 
    success: false, 
    error: 'Email service not implemented',
    details: 'The email service is being migrated to a new provider.'
  };
}

/**
 * This was previously implemented with SendGrid.
 * Now it's a placeholder for the upcoming implementation.
 */
export async function sendEmailNew({ to, subject, text, html }: EmailData) {
  return sendEmail({ to, subject, text, html });
} 