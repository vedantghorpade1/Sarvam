import { NextResponse } from 'next/server';

export async function GET() {
  const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY;

  if (!CARTESIA_API_KEY) {
    console.error('Cartesia API key is not set in .env.local');
    return NextResponse.json({ message: 'Server configuration error: CARTESIA_API_KEY is missing.' }, { status: 500 });
  }

  try {
    // --- **FIX: The API URL was wrong. Added /api/ prefix.** ---
    const response = await fetch('https://api.cartesia.ai/api/v1/voices', {
      headers: {
        'X-API-Key': CARTESIA_API_KEY,
        'Content-Type': 'application/json',
        'Cartesia-Version': '2024-06-10', 
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cartesia API Error:', errorText);
      // Pass the specific error from Cartesia to the frontend
      throw new Error(`Cartesia API Error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    // The Cartesia API returns voices in a "data" property
    if (!data || !Array.isArray(data.data)) {
        console.error('Cartesia API response format is incorrect. Expected { data: [...] }', data);
        throw new Error('Unexpected API response format from Cartesia.');
    }

    // Map the Cartesia response to the format your frontend expects
    const voices = data.data.map((voice: any) => ({
      id: voice.id,
      name: voice.name,
      tags: voice.description || `Language: ${voice.language || 'en'}`, 
      demo: '', // Cartesia's List API doesn't provide a demo/preview URL
    }));

    return NextResponse.json({ voices: voices });

  } catch (error: any) {
    console.error('Failed to fetch Cartesia voices:', error.message);
    return NextResponse.json({ message: 'Failed to fetch voices', error: error.message }, { status: 500 });
  }
}