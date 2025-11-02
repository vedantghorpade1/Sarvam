import { NextResponse } from 'next/server';
import { SarvamAIClient } from 'sarvamai'; 

export async function POST(req: Request) {
  const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

  if (!SARVAM_API_KEY) {
    console.error('SARVAM_API_KEY is not set or not loaded. Check .env.local and restart the server.');
    return NextResponse.json(
      { error: 'Server configuration error: SARVAM_API_KEY is not set.' },
      { status: 500 }
    );
  }

  const { text, voice } = await req.json();
  if (!text) return NextResponse.json({ error: 'Text to speak is required.' }, { status: 400 });
  if (!voice) return NextResponse.json({ error: 'A voice ID is required.' }, { status: 400 });

  try {
    const sarvam = new SarvamAIClient({
      apiSubscriptionKey: SARVAM_API_KEY,
    }); 

    // The Sarvam docs use 'speaker' as the parameter name.
    // The model is 'bulbul:v2'
    const audioStream = await sarvam.textToSpeech.generate({
      model: 'bulbul:v2', 
      input: text,
      speaker: voice, // Use 'speaker' instead of 'voice'
    });

    console.log('Successfully received audio stream from Sarvam.ai.');

    return new NextResponse(audioStream.body, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });

  } catch (error) {
    console.error('Critical error generating speech with Sarvam.ai:', error);
    return NextResponse.json({ error: 'Failed to generate speech with Sarvam.ai' }, { status: 500 });
  }
}