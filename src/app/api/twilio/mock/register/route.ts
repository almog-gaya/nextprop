import { NextResponse } from 'next/server';

export async function POST() {
  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return NextResponse.json({
    success: true,
    message: "A2P registration submitted successfully",
    data: {
      registrationId: "mock-reg-123",
      status: "pending",
      steps: {
        customerProfile: "pending",
        trustProduct: "pending",
        brandRegistration: "pending",
        messagingService: "pending",
        campaign: "pending"
      }
    }
  });
} 