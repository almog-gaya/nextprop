import { NextResponse } from 'next/server';
import { listVoiceClones } from '@/lib/voicedropCampaignService';

// Known voice clones from the campaigns API
const knownVoiceClones = [
  { "id": "61EQ2khjAy41AXCqUSSS", "name": "Cecilia" },
  { "id": "Es45QkMNPudcZKVRZWPs", "name": "Rey" },
  { "id": "dodUUtwsqo09HrH2RO8w", "name": "Default Voice" }
];

export async function GET() {
  try {
    // Try to get voice clones from API first
    const voiceClones = await listVoiceClones();
    
    // Return the API response if successful
    return NextResponse.json(voiceClones);
  } catch (error) {
    console.error('Error fetching voice clones:', error);
    
    // If API fails, return the known voice clones
    console.log('Returning known voice clones as fallback');
    return NextResponse.json(knownVoiceClones);
  }
} 