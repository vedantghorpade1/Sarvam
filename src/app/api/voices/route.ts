import { NextResponse } from 'next/server';

export async function GET() {
  const BOLNA_API_KEY = process.env.BOLNA_API_KEY;

  if (!BOLNA_API_KEY) {
    console.error('Bolna API key is not set in .env.local');
    return NextResponse.json({ message: 'Server configuration error: BOLNA_API_KEY is missing.' }, { status: 500 });
  }

  try {
    // 1. Fetch voices from Bolna's API
    const response = await fetch('https://api.bolna.ai/me/voices', {
      headers: {
        'Authorization': `Bearer ${BOLNA_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bolna API Error:', errorText);
      throw new Error(`Bolna API Error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    // --- FIX: Normalize multiple possible API response formats ---
    // The Bolna API might return { data: [...] }, { voices: [...] }, or just [...].
    const voiceList =
      Array.isArray(data) ? data :
      Array.isArray(data.data) ? data.data :
      Array.isArray(data.voices) ? data.voices : [];

    if (voiceList.length === 0 && data) {
      console.warn('Bolna API response format was not recognized or was empty:', data);
    }

    // Map the Bolna voice structure to what the frontend expects
    const voices = voiceList.map((voice: any) => ({
      id: voice.id || voice.voice_id || voice.name,
      name: voice.name || "Unnamed Voice",
      // Create a 'tags' string from language and other info for display
      tags: `${voice.provider || "Bolna"} – ${voice.accent || voice.language || "No accent info"}`,
      demo: voice.sample_url || voice.demo || "",
    }));

    return NextResponse.json({ voices: voices });

  } catch (error: any) {
    console.error('Failed to fetch Bolna voices:', error.message);
    return NextResponse.json({ message: 'Failed to fetch voices', error: error.message }, { status: 500 });
  }
}