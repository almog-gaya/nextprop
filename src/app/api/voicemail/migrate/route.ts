import { NextResponse } from 'next/server';
import { handleMigrationRequest } from '@/lib/migrateCampaigns';

// This is an admin-only endpoint for migrating campaigns
export async function POST(request: Request) {
  try {
    // You should add authentication here in a real application
    // Only admin users should be able to trigger migration
    
    // Use the handler from the migration utility
    const response = await handleMigrationRequest(request);
    
    // Convert the response to NextResponse
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Migration API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in migration process'
    }, { status: 500 });
  }
} 