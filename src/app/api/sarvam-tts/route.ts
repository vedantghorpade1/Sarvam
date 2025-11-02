import { NextRequest, NextResponse } from 'next/server';
import { SarvamAI, SarvamAIClient } from 'sarvamai';

/**
 * This endpoint is called by Twilio to fetch the audio for the first message of the call.
 * It takes 'text' and 'voice' as URL parameters, generates audio using Sarvam's TTS,
 * and streams it back as an MP3 file.
 */
export async function GET(request: NextRequest) {
  const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

  if (!SARVAM_API_KEY) {
    console.error('[Sarvam TTS] SARVAM_API_KEY is not set.');
    return NextResponse.json(
      { error: 'Server configuration error: API key is not set.' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  const voice = searchParams.get('voice');

  if (!text || !voice) {
    return NextResponse.json({ error: 'Text and voice parameters are required.' }, { status: 400 });
  }

  try {
    const sarvam = new SarvamAIClient({
      apiSubscriptionKey: SARVAM_API_KEY,
    });

    const response = await sarvam.textToSpeech.convert({
      model: 'bulbul:v2',
      text: text,
      target_language_code: 'en-IN', // Defaulting to English (India)
      speaker: voice as SarvamAI.TextToSpeechSpeaker,
    });

    if (!response.audios || response.audios.length === 0) {
      throw new Error("Sarvam API returned no audio data.");
    }

    const base64Audio = response.audios[0];
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    // Return the audio buffer directly with the correct content type
    return new NextResponse(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });

  } catch (error: any) {
    console.error('[Sarvam TTS] Critical error generating speech:', error);
    return NextResponse.json({ error: 'Failed to generate speech with Sarvam.ai' }, { status: 500 });
  }
}