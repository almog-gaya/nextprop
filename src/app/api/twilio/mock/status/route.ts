import { NextResponse } from 'next/server';

const statuses = ['pending', 'approved', 'rejected'];
const messages = {
  customerProfile: [
    "Profile under review",
    "Profile approved",
    "Profile rejected - Invalid EIN"
  ],
  trustProduct: [
    "Trust product under review",
    "Trust product approved",
    "Trust product rejected - Business type not supported"
  ],
  brandRegistration: [
    "Brand registration under review",
    "Brand registration approved",
    "Brand registration rejected - Brand name not available"
  ],
  messagingService: [
    "Messaging service under review",
    "Messaging service approved",
    "Messaging service rejected - Invalid use case"
  ],
  campaign: [
    "Campaign under review",
    "Campaign approved",
    "Campaign rejected - Message content not compliant"
  ]
};

export async function GET() {
  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate random statuses for each step
  const steps = {
    customerProfile: {
      status: statuses[Math.floor(Math.random() * statuses.length)],
      message: messages.customerProfile[Math.floor(Math.random() * messages.customerProfile.length)]
    },
    trustProduct: {
      status: statuses[Math.floor(Math.random() * statuses.length)],
      message: messages.trustProduct[Math.floor(Math.random() * messages.trustProduct.length)]
    },
    brandRegistration: {
      status: statuses[Math.floor(Math.random() * statuses.length)],
      message: messages.brandRegistration[Math.floor(Math.random() * messages.brandRegistration.length)]
    },
    messagingService: {
      status: statuses[Math.floor(Math.random() * statuses.length)],
      message: messages.messagingService[Math.floor(Math.random() * messages.messagingService.length)]
    },
    campaign: {
      status: statuses[Math.floor(Math.random() * statuses.length)],
      message: messages.campaign[Math.floor(Math.random() * messages.campaign.length)]
    }
  };

  // Determine overall status
  const allStatuses = Object.values(steps).map(step => step.status);
  const overallStatus = allStatuses.includes('rejected') ? 'rejected' : 
                       allStatuses.includes('pending') ? 'pending' : 'approved';

  return NextResponse.json({
    success: true,
    message: "Status retrieved successfully",
    data: {
      registrationId: "mock-reg-123",
      status: overallStatus,
      steps
    }
  });
} 