import { NextResponse } from 'next/server';
import { listVoiceClones } from '@/lib/voicedropCampaignService';

// Known voice clones as fallback in case API fails
const knownVoiceClones = [
  { id: "ILpxaENYFFi3XpqMTGin", name: "Reey yadin" },
  { id: "Es45QkMNPudcZKVRZWPs", name: "Reey 3" },
  { id: "61EQ2khjAy41AXCqUSSS", name: "Cecilia" },
  { id: "emDkPS6OBF68ErlmyDUd", name: "Adam - American Male" },
  { id: "dodUUtwsqo09HrH2RO8w", name: "Reey 4" },
  { id: "lumjAb77tHNVSENwnjR3", name: "Amir" },
  { id: "qf3Ih992NBDAY3ERfAfJ", name: "Bob - American Male" },
  { id: "PD5ItZyA8ycF804navym", name: "Reey V2" },
  { id: "4mCGdLiCz9q8Sj3hqePK", name: "Jane Smith" },
  { id: "6IethHjoIhUJ8jq5PAwL", name: "Bart - American Male" },
  { id: "jpMdpbtvOdxICWgdEe9T", name: "John - American Male" }
];

export async function GET() {
  console.log('Voice clones API endpoint called');
  
  try {
    // Try to get voice clones from API
    console.log('Fetching voice clones from service with updated API key...');
    const voiceClones = await listVoiceClones();
    
    // Validate response
    if (!Array.isArray(voiceClones) || voiceClones.length === 0) {
      console.warn('Voice clones API returned invalid response');
      return NextResponse.json(knownVoiceClones);
    }
    
    // Return the API response
    console.log(`Successfully retrieved ${voiceClones.length} voice clones from API`);
    return NextResponse.json(voiceClones);
  } catch (error: any) {
    console.error('Error fetching voice clones:', error.message);
    
    // Return the known voice clones as fallback
    console.log('Returning known voice clones as fallback');
    return NextResponse.json(knownVoiceClones);
  }
} 