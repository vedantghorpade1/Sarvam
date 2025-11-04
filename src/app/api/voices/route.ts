import { NextResponse } from 'next/server';

export async function GET() {
  const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY;

  if (!CARTESIA_API_KEY) {
    console.error('Cartesia API key is not set in .env.local');
    return NextResponse.json({ message: 'Server configuration error: CARTESIA_API_KEY is missing.' }, { status: 500 });
  }

  try {
    // 1. Fetch voices from Cartesia's API
    const response = await fetch('https://api.cartesia.ai/voices', {
      headers: {
        'Authorization': `Bearer ${CARTESIA_API_KEY}`,
        'Content-Type': 'application/json',
        'Cartesia-Version': '2024-06-10', 
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cartesia API Error:', errorText);
      throw new Error(`Cartesia API Error: ${response.statusText} - ${errorText}`);
    }

    // The 'data' variable *is* the array, based on your log.
    const data = await response.json();

    // --- **FIX: Check if 'data' itself is an array** ---
    if (!Array.isArray(data)) {
        console.error('Cartesia API response format is incorrect. Expected an array [...]', data);
        throw new Error('Unexpected API response format from Cartesia. Expected an array.');
    }

    // --- **FIX: Map 'data' directly, not 'data.data'** ---
    const voices = data.map((voice: any) => ({
      id: voice.id,
      name: voice.name,
      tags: voice.description || `Language: ${voice.language || 'en'}`, 
      demo: '', // The List API doesn't provide a demo URL
    }));

    return NextResponse.json({ voices: voices });

  } catch (error: any) {
    console.error('Failed to fetch Cartesia voices:', error.message);
    return NextResponse.json({ message: 'Failed to fetch voices', error: error.message }, { status: 500 });
  }
}