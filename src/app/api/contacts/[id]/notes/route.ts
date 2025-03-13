import { NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/enhancedApi'; 

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id: contactId } = params;
        const result = await getAllNotes(contactId);

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.log('GET notes error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

const getAllNotes = async (contactId: string) => {
    const { token } = await getAuthHeaders();
    const url = `https://services.leadconnectorhq.com/contacts/${contactId}/notes`;
    const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Version': '2021-07-28',
    };
    const options = { method: 'GET', headers };

    const response = await fetch(url, options);
    if (!response.ok) {
        const error = await response.json();
        console.log(`Error: `, error);
        return {
            error: error.message || error.msg,
            status: response.status,
        }
    }

    return await response.json();
}


