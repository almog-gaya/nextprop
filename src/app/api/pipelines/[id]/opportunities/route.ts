import { NextRequest, NextResponse } from 'next/server';
import { getOpportunities, fetchWithErrorHandling } from '@/lib/enhancedApi';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  
  if (!id) {
    return NextResponse.json(
      { error: true, message: 'Pipeline ID is required' },
      { status: 400 }
    );
  }
  
  try {
    // const data = await fetchWithErrorHandling(() => getOpportunities(id));

    const data = await fetchWithErrorHandling(() => getMockOpportunitiesById(id));
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: true, message: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 


const getMockOpportunitiesById = async (id: String) => {
   const data = {
    "opportunities": [
     {
      "id": "7XExm1wr8gFeZpl6rQny",
      "name": "First Opp",
      "monetaryValue": 120,
      "pipelineId": "bCkKGpDsyPP4peuKowkG",
      "pipelineStageId": "8b897c8f-b859-49c1-88f2-ed590708a85c",
      "assignedTo": "hxHGVRb1YJUscrCB8eXK",
      "status": "open",
      "source": "form",
      "lastStatusChangeAt": "2020-10-29T09:39:35.472Z",
      "createdAt": "2020-10-29T09:31:30.255Z",
      "updatedAt": "2020-10-29T09:44:02.263Z",
      "contact": {
       "id": "byMEV0NQinDhq8ZfiOi2",
       "name": "John Deo",
       "companyName": "Tesla Inc",
       "email": "john@deo.com",
       "phone": "+1202-555-0107",
       "tags": [
        "ipsum sunt",
        "ipsum mollit deserunt id veniam"
       ]
      }
     },
     {
      "id": "7XExm1wr8gFeZpl6rQny",
      "name": "First Opp",
      "monetaryValue": 120,
      "pipelineId": "bCkKGpDsyPP4peuKowkG",
      "pipelineStageId": "8b897c8f-b859-49c1-88f2-ed590708a85c",
      "assignedTo": "hxHGVRb1YJUscrCB8eXK",
      "status": "open",
      "source": "form",
      "lastStatusChangeAt": "2020-10-29T09:39:35.472Z",
      "createdAt": "2020-10-29T09:31:30.255Z",
      "updatedAt": "2020-10-29T09:44:02.263Z",
      "contact": {
       "id": "byMEV0NQinDhq8ZfiOi2",
       "name": "John Deo",
       "companyName": "Tesla Inc",
       "email": "john@deo.com",
       "phone": "+1202-555-0107",
       "tags": [
        "laborum officia consequat consectetur",
        "amet ea pariatur cupidatat"
       ]
      }
     }
    ],
    "meta": {
     "total": 250,
     "nextPageUrl": "https://rest.gohighlevel.com/v1/pipelines/bCkKGpDsyPP4peuKowkG/opportunities?limit=1&startAfter=1603870249758&startAfterId=UIaE1WjAwWKdlyD7osQI",
     "startAfterId": "UIaE1WjAwWKdlyD7osQI",
     "startAfter": 1603870249758,
     "currentPage": 2,
     "nextPage": 3,
     "prevPage": 1
    }
   };

   return data;
}