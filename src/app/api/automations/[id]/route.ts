import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/enhancedApi';

// GET handler to retrieve the status of a specific automation job
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // In a real implementation, we would fetch the job status from a database
    // For now, we'll return mock data based on the job ID
    
    // Extract timestamp from job ID (assuming format job_timestamp)
    const jobTimestamp = id.split('_')[1] ? parseInt(id.split('_')[1]) : Date.now();
    const startTime = new Date(jobTimestamp).toISOString();
    const currentTime = Date.now();
    const elapsedTime = currentTime - jobTimestamp;
    
    // Simulate job progression based on elapsed time
    let progress = 0;
    let status = 'pending';
    let contactsProcessed = 0;
    let totalContacts = 100;
    
    if (elapsedTime > 60000) { // More than 1 minute
      status = 'completed';
      progress = 100;
      contactsProcessed = totalContacts;
    } else if (elapsedTime > 30000) { // More than 30 seconds
      status = 'processing';
      progress = 75;
      contactsProcessed = 75;
    } else if (elapsedTime > 15000) { // More than 15 seconds
      status = 'processing';
      progress = 50;
      contactsProcessed = 50;
    } else if (elapsedTime > 5000) { // More than 5 seconds
      status = 'processing';
      progress = 25;
      contactsProcessed = 25;
    } else {
      status = 'initializing';
      progress = 5;
      contactsProcessed = 0;
    }
    
    return NextResponse.json({
      jobId: id,
      status,
      progress,
      startTime,
      currentTime: new Date().toISOString(),
      statistics: {
        contactsProcessed,
        totalContacts,
        duplicatesFound: Math.floor(contactsProcessed * 0.2), // 20% are duplicates
        opportunitiesCreated: Math.floor(contactsProcessed * 0.8), // 80% become opportunities
        communicationsSent: Math.floor(contactsProcessed * 0.7), // 70% have communications sent
      }
    });
    
  } catch (error: any) {
    console.error(`Error fetching automation job ${id}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch automation job' },
      { status: 500 }
    );
  }
}

// DELETE handler to cancel an automation job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  try {
    // In a real implementation, this would cancel the job in the background processing system
    return NextResponse.json({
      jobId: id,
      status: 'cancelled',
      message: 'Automation job cancelled successfully'
    });
  } catch (error: any) {
    console.error(`Error cancelling automation job ${id}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel automation job' },
      { status: 500 }
    );
  }
} 