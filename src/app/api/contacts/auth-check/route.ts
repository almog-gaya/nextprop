import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/enhancedApi';

export async function GET(request: NextRequest) {
  try {
    // Get auth headers
    const { token, locationId } = await getAuthHeaders();
    
    if (!token || !locationId) {
      return NextResponse.json({
        status: 'error',
        message: 'Missing authentication information',
        auth: { hasToken: !!token, hasLocationId: !!locationId }
      }, { status: 401 });
    }
    
    // Test if we can get pipelines
    const pipelinesUrl = `https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${locationId}`;
    const pipelinesResponse = await fetch(pipelinesUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }
    });
    
    if (!pipelinesResponse.ok) {
      const errorText = await pipelinesResponse.text();
      return NextResponse.json({
        status: 'error',
        message: 'Failed to fetch pipelines',
        error: errorText,
        statusCode: pipelinesResponse.status,
        auth: { hasToken: true, hasLocationId: true }
      }, { status: 200 });
    }
    
    const pipelinesData = await pipelinesResponse.json();
    
    // Return auth status and pipeline info
    return NextResponse.json({
      status: 'success',
      message: 'Authentication is valid',
      auth: { hasToken: true, hasLocationId: true },
      pipelines: pipelinesData.pipelines || [],
      locationId
    });
    
  } catch (error) {
    console.error('Auth check error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error checking authentication',
      auth: { hasToken: false, hasLocationId: false }
    }, { status: 500 });
  }
} 