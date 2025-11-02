import { NextRequest, NextResponse } from 'next/server';
import { twiml } from 'twilio';
import OpenAI from 'openai';

// Initialize the Sarvam/OpenAI client
const sarvam = new OpenAI({
  apiKey: process.env.SARVAM_API_KEY,
  baseURL: "https://api.sarvam.ai/v1",
});

/**
 * This webhook is responsible ONLY for the "thinking" part (calling the LLM).
 * It's called via a Redirect from the 'gather' webhook.
 */
export async function POST(request: NextRequest) {
  try {
    // When coming from a <Redirect>, the parameters are in the URL, not the body.
    const { searchParams } = new URL(request.url);
    const speechResult = searchParams.get('SpeechResult') || '';
    const voiceId = searchParams.get('voiceId') || 'anushka'; // Get voiceId, with a fallback

    let agentReplyText: string;

    if (speechResult) {
      console.log('[LLM] Asking Sarvam for a reply...');
      const completion = await sarvam.chat.completions.create({
        model: "sarvam-m",
        messages: [ // You can add a system prompt to define the agent's personality
          { role: "system", content: "You are a helpful and friendly voice assistant. Keep your responses concise." },
          { role: "user", content: speechResult },
        ],
      });
      agentReplyText = completion.choices[0]?.message?.content || "I'm not sure how to respond to that.";
    } else {
      agentReplyText = 'I did not hear anything. Could you please repeat that?';
    }

    console.log(`[Twilio Webhook] Agent replying: "${agentReplyText}"`);

    const voiceResponse = new twiml.VoiceResponse();
    const gather = voiceResponse.gather({
      input: ['speech'],
      speechTimeout: 'auto',
      action: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/gather?voiceId=${encodeURIComponent(voiceId)}`, // Loop back, PASSING THE VOICEID
    });

    // Construct the URL for our Sarvam TTS endpoint to generate the audio with the correct voice.
    const ttsUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/api/sarvam-tts`);
    ttsUrl.searchParams.append("text", agentReplyText);
    ttsUrl.searchParams.append("voice", voiceId);
    gather.play(ttsUrl.toString());
    
    return new NextResponse(voiceResponse.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });

  } catch (error: any) {
    console.error('[Twilio Think Webhook] Error:', error);
    return new NextResponse('An error occurred.', { status: 500 });
  }
}