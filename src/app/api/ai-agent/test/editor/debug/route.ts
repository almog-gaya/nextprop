import { NextRequest, NextResponse } from 'next/server';
import { ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebaseConfig';

const PROMPT_FILE_PATH = 'js/prompt.js';
const URL = `https://firebasestorage.googleapis.com/v0/b/nextprop-ai.firebasestorage.app/o/js%2Fprompt_debug.js?alt=media&token=2b19c4b6-5bb8-490c-86df-eb20c06b0cce`;
export async function GET(request: Request) {
  try { 
    const response = await fetch(URL);
    const text = await response.text();
    return new Response(text, {
      headers: {
        'Content-Type': 'text/javascript',
      },
    });
  } catch (error) {
    console.error('Error loading prompt file:', error);
    return NextResponse.json(
      { error: 'Failed to load prompt file' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    const fileRef = ref(storage, PROMPT_FILE_PATH);
    const arrayBuffer = await file.arrayBuffer();
    await uploadBytes(fileRef, arrayBuffer);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving prompt file:', error);
    return NextResponse.json(
      { error: 'Failed to save prompt file' },
      { status: 500 }
    );
  }
}   