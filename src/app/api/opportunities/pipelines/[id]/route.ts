import { fetchWithErrorHandling, getAuthHeaders } from "@/lib/enhancedApi";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const { id } = await props.params;
    const body = await request.json();

    if (!id) {
        return NextResponse.json(
            { error: true, message: 'Pipeline ID is required' },
            { status: 400 }
        );
    }

    try {
        const data = await fetchWithErrorHandling(() => updateOpportunitiesById(id, body));
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: true, message: error.message || 'An error occurred' },
            { status: 500 }
        );
    }
}

export async function DELETE(
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
        const data = await fetchWithErrorHandling(() => deleteOpportunitiesById(id));
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: true, message: error.message || 'An error occurred' },
            { status: 500 }
        );
    }
}


const updateOpportunitiesById = async (id: string, body: any) => {
    const { token } = await getAuthHeaders();

    const prodURL = `https://backend.leadconnectorhq.com/opportunities/pipelines/${id}`;
    const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28",
        "source": "WEB_USER",
        "referer": "https://app.gohighlevel.com/",
        "priority": "u=1, i",
        "channel": "APP"
    }

    const response = await fetch(prodURL, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...body, })
    });

    return await response.json();
};


const deleteOpportunitiesById = async (id: string) => {
    const { token } = await getAuthHeaders();

    const prodURL = `https://backend.leadconnectorhq.com/opportunities/pipelines/${id}`;
    const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28",
        "source": "WEB_USER",
        "referer": "https://app.gohighlevel.com/",
        "priority": "u=1, i",
        "channel": "APP"
    }

    const response = await fetch(prodURL, {
        method: 'DELETE',
        headers
    });

    return await response.json();
}