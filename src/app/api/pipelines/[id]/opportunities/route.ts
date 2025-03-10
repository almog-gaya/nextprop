import { NextRequest, NextResponse } from 'next/server';
import { fetchWithErrorHandling, getAuthHeaders } from '@/lib/enhancedApi';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const searchParams = request.nextUrl.searchParams;

  // Extract pagination parameters
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '30');
  const startAfter = searchParams.get('startAfter') || undefined;
  const startAfterId = searchParams.get('startAfterId') || undefined;

  if (!id) {
    return NextResponse.json(
      { error: true, message: 'Pipeline ID is required' },
      { status: 400 }
    );
  }

  try {
    const data = await fetchWithErrorHandling(() =>
      getOpportunitiesById(id, { page, limit, startAfter, startAfterId })
    );

    // Calculate pagination metadata
    const total = data.opportunities.length;
    const totalPages = Math.ceil(total / limit);
    const currentPage = page;
    const nextPage = currentPage < totalPages ? currentPage + 1 : null;
    const prevPage = currentPage > 1 ? currentPage - 1 : null;

    // Construct base URL for pagination links
    const baseUrl = `${request.nextUrl.origin}/opportunities/search`;
    const queryParams = new URLSearchParams({
      pipeline_id: id,
      limit: limit.toString(),
    });

    // Construct response with pagination
    const response = {
      opportunities: data.opportunities.slice(
        (page - 1) * limit,
        page * limit
      ),
      meta: {
        total,
        nextPageUrl: nextPage
          ? `${baseUrl}?${queryParams}&page=${nextPage}`
          : null,
        startAfterId: data.opportunities.length > 0 
          ? data.opportunities[data.opportunities.length - 1].id 
          : null,
        startAfter: Date.now(),
        currentPage,
        nextPage,
        prevPage
      },
      aggregations: {}
    };

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { error: true, message: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}

interface PaginationParams {
  page: number;
  limit: number;
  startAfter?: string;
  startAfterId?: string;
}

const getOpportunitiesById = async (id: string, pagination: PaginationParams) => {
  const { token, locationId } = await getAuthHeaders();
  
  // Construct query parameters with proper type handling
  const queryParams = new URLSearchParams();
  queryParams.append('location_id', locationId || '');
  queryParams.append('pipeline_id', id);
  queryParams.append('limit', pagination.limit.toString());
  
  if (pagination.startAfter) {
    queryParams.append('startAfter', pagination.startAfter);
  }
  if (pagination.startAfterId) {
    queryParams.append('startAfterId', pagination.startAfterId);
  }

  const url = `https://services.leadconnectorhq.com/opportunities/search?${queryParams.toString()}`;
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Version: '2021-07-28',
      Accept: 'application/json'
    }
  };

  const response = await fetch(url, options);
  const data = await response.json();
  return data;
};