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
export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id: contactId } = params;
        const { body, userId } = await request.json();

        const result = await createNote(contactId, body, userId);

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('POST note error:', error);
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

const createNote = async (contactId: string, body: string, userId?: string) => {
    const { token } = await getAuthHeaders();
    const url = `https://services.leadconnectorhq.com/contacts/${contactId}/notes`;
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Version': '2021-07-28',
    };
    const payload = { body, ...(userId && { userId }) };
    const options = {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    };

    const response = await fetch(url, options);
    if (!response.ok) {
        const error = await response.json();
        console.log(`Error: `, error);
        return {
            error: error.message || error.msg,
            status: response.status,
        };
    }

    return await response.json();
};




