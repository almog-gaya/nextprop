import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/enhancedApi';

// Known pipeline IDs from the existing application as fallbacks
const LEADS_PIPELINE_ID = 'uFa3Uh6Cz1iKHA8YtzhN'; 
const REVIEW_STAGE_ID = 'MHYFVj1Q9BtfSxO6CFXC';

export async function POST(request: NextRequest) {
  try {
    // Get data from request
    const { filter, contactIds, pipelineId } = await request.json();
    const { token, locationId } = await getAuthHeaders();
    
    // Use provided pipelineId or fallback to default
    const leadsPipelineId = pipelineId || LEADS_PIPELINE_ID;
    
    // Step 1: Get contacts - either by filter or specific IDs
    let contacts = [];
    
    if (contactIds && Array.isArray(contactIds) && contactIds.length > 0) {
      // If specific contact IDs are provided, use those directly
      contacts = contactIds.map(id => ({ id }));
    } else {
      // Otherwise, fetch contacts using filter
      let contactsUrl = 'https://services.leadconnectorhq.com/contacts';
      const queryParams = new URLSearchParams();
      
      // Add locationId
      if (locationId) {
        queryParams.append('locationId', locationId);
      }
      
      // Add tag filter if provided
      if (filter && filter.tag) {
        queryParams.append('tags', filter.tag);
      }
      
      // Add query parameters
      if (queryParams.toString()) {
        contactsUrl += `?${queryParams.toString()}`;
      }
      
      // Fetch contacts
      const contactsResponse = await fetch(contactsUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Version: '2021-07-28',
          Accept: 'application/json',
        },
      });
      
      if (!contactsResponse.ok) {
        throw new Error(`Failed to fetch contacts: ${contactsResponse.status}`);
      }
      
      const contactsData = await contactsResponse.json();
      contacts = contactsData.contacts || [];
      
      if (!contacts || !Array.isArray(contacts)) {
        throw new Error('Invalid contacts data received');
      }
    }
    
    // Fetch the pipeline to get the first stage ID
    let reviewStageId = REVIEW_STAGE_ID;
    
    try {
      const pipelineResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/pipelines/${leadsPipelineId}?locationId=${locationId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Version: '2021-07-28',
          Accept: 'application/json',
        },
      });
      
      if (pipelineResponse.ok) {
        const pipelineData = await pipelineResponse.json();
        if (pipelineData.pipeline && pipelineData.pipeline.stages && pipelineData.pipeline.stages.length > 0) {
          // Use the first stage ID from the pipeline
          reviewStageId = pipelineData.pipeline.stages[0].id;
        }
      }
    } catch (error) {
      console.error('Error fetching pipeline details, using default stage ID:', error);
    }
    
    // Process all contacts
    const results = {
      total: contacts.length,
      processed: 0,
      added: 0,
      failed: 0,
      alreadyExistsCount: 0,
      errors: [] as string[]
    };
    
    for (const contact of contacts) {
      results.processed++;
      
      try {
        // Create the opportunity
        const opportunityResponse = await fetch('https://services.leadconnectorhq.com/opportunities/', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Version: '2021-07-28',
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            pipelineId: leadsPipelineId,
            locationId: locationId,
            name: `Lead: ${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'New Lead',
            pipelineStageId: reviewStageId,
            status: 'open',
            contactId: contact.id,
            monetaryValue: 0,
            assignedTo: '',
            customFields: []
          })
        });
        
        if (opportunityResponse.status === 409 || opportunityResponse.status === 400) {
          // 409 Conflict or 400 Bad Request might indicate the opportunity already exists
          results.alreadyExistsCount++;
          continue;
        }
        
        if (!opportunityResponse.ok) {
          const errorText = await opportunityResponse.text();
          throw new Error(`Failed to create opportunity: ${opportunityResponse.status} - ${errorText}`);
        }
        
        await opportunityResponse.json(); // consume the response
        results.added++;
      } catch (error: any) {
        results.failed++;
        const errorMessage = error.message || 'Unknown error';
        
        // Check if the error message suggests the opportunity already exists
        if (errorMessage.includes('already exists') || 
            errorMessage.includes('duplicate') || 
            errorMessage.includes('already has an opportunity')) {
          results.alreadyExistsCount++;
        } else {
          console.error(`Error creating opportunity for contact ${contact.id}:`, errorMessage);
          results.errors.push(`Error for contact ${contact.id}: ${errorMessage}`);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully processed ${results.processed} contacts. Added ${results.added} new opportunities. ${results.alreadyExistsCount} contacts already had opportunities.`,
      results
    });
    
  } catch (error: any) {
    console.error('Error syncing contacts to pipeline:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to sync contacts to pipeline'
    }, { status: 500 });
  }
} 