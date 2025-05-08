// Health and see if its runing


import { NextResponse } from 'next/server';
import { NextApiRequest } from 'next';

export async function GET(request: NextApiRequest) {
  try {
    return NextResponse.json({ message: 'Nextprop is running successfully' });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}