import { NextRequest, NextResponse } from 'next/server';
import { twiml } from 'twilio';

/**
 * This is the webhook that Twilio will call to continue the conversation.
 * It receives the transcribed text from the user's speech and returns
 * new TwiML instructions to respond and listen again.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const speechResult = (formData.get('SpeechResult') as string | null) || '';
    // The voiceId is passed in the URL's query string.
    const { searchParams } = new URL(request.url);
    const voiceId = searchParams.get('voiceId');

    const voiceResponse = new twiml.VoiceResponse();

    if (speechResult) {
      // 1. Respond instantly with a "thinking" message to avoid timeouts.
      voiceResponse.say({ voice: 'Polly.Joanna-Neural' }, "One moment.");
      
      // 2. Redirect to the 'think' webhook to do the slow LLM work.
      //    Using method: 'POST' forwards the user's speech to the next endpoint.
      const thinkUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/think`);
      thinkUrl.searchParams.append('SpeechResult', speechResult);
      if (voiceId) {
        thinkUrl.searchParams.append('voiceId', voiceId);
      }

      voiceResponse.redirect({ method: 'POST' }, thinkUrl.toString());
    } else {
      // If the user said nothing, say so and hang up.
      voiceResponse.say("We didn't hear you. Goodbye.");
      voiceResponse.hangup();
    }

    // Return the new TwiML instructions to Twilio.
    return new NextResponse(voiceResponse.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error: any) {
    console.error('[Twilio Gather Webhook] Error:', error);
    return new NextResponse('An error occurred.', { status: 500 });
  }
}
