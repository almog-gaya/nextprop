import { NextResponse } from 'next/server';
// VoiceDrop API configuration 
const VOICEDROP_API_KEY = 'vd_L6JGDq5Vj924Eq7k7Mb1';
const VOICEDROP_API_BASE_URL = 'https://api.voicedrop.ai/v1';
const DEFAULT_VOICE_CLONE_ID = 'dodUUtwsqo09HrH2RO8w';

export async function POST(request: Request) {

    const data = await request.json();

    const response = await fetch(`${VOICEDROP_API_BASE_URL}/ringless_voicemail`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'auth-key': VOICEDROP_API_KEY
        },
        body: JSON.stringify(data)
    });
    const responseData = await response.json();
    return NextResponse.json(responseData);

}