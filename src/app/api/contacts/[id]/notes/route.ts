import { NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/enhancedApi'; 

export async function GET(request: Request, { params }: { params: { id: string, noteId: string } }) {
    try {
        const { id: contactId, noteId } = params;
        const result = await getAllNotes(contactId, noteId);

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.log('GET note error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

const getAllNotes = async (contactId: string, noteId: string) => {
    const { token } = await getAuthHeaders();
    const url = `https://services.leadconnectorhq.com/contacts/${contactId}/notes/${noteId}`;
    const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Version': '2021-07-28',
    };
    const options = { method: 'GET', headers };

    const response = await fetch(url, options);
    const error = await response.json();
    if (!response.ok) {
        console.log(`Error: `, error);
        return {
            error: error.message || error.msg,
            status: response.status,
        }
    }

    return await response.json();
}


