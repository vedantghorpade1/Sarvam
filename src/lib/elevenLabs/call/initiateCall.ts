// /lib/elevenLabs/call/initiateCall.ts
// (This is the FINAL, UN-MOCKED code for live calls)

import Twilio from "twilio";
import connectDB from "@/lib/db";
import Agent from "@/models/agentModel"; // Your Mongoose Agent model

// 1. Get ALL required env variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// 2. This is the public URL of your DEPLOYED application
// (This MUST be your public ngrok URL for testing)
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL; 

// 3. Initialize the Twilio client using your variables
if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER || !APP_BASE_URL) {
    console.error("One or more environment variables are missing: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, NEXT_PUBLIC_APP_URL");
    throw new Error("Telephony or App URL environment variables are not set.");
}

const twilioClient = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * This function initiates a REAL call via Twilio and uses your
 * /api/sarvam-tts route to generate the first message.
 */
export async function initiateCall(
    userId: string, 
    agentId: string, 
    phoneNumber: string, 
    contactName: string
) {
    await connectDB();

    // 4. Find the agent using the agentId (_id)
    const agent = await Agent.findOne({ userId, _id: agentId });

    if (!agent) {
        console.error(`Agent not found for userId: ${userId}, agentId: ${agentId}`);
        throw new Error("Agent not found");
    }

    // 5. Get the voice and first message from the agent
    const voice = agent.voiceId; // e.g., "abhilash"
    let message = agent.firstMessage || "Hello, how can I help you today?";

    // 6. Personalize the message
    message = message.replace(/\[Name\]/gi, contactName);
    message = message.replace(/\[Company\]/gi, "our company"); 

    // 7. Create the full, public URL to your Sarvam TTS route
    const ttsUrl = new URL(`${APP_BASE_URL}/api/sarvam-tts`);
    ttsUrl.searchParams.append("text", message);
    ttsUrl.searchParams.append("voice", voice); // 'voice' is the param your TTS route expects

    // 8. Create the TwiML XML instructions for Twilio
    // Use the Twilio helper library to generate TwiML. This correctly handles XML escaping.
    const voiceResponse = new Twilio.twiml.VoiceResponse();
    const gather = voiceResponse.gather({
      input: ['speech'],
      speechTimeout: 'auto',
      action: `${APP_BASE_URL}/api/webhooks/twilio/gather?voiceId=${encodeURIComponent(voice)}`,
      method: 'POST',
    });
    gather.play(ttsUrl.toString());
    voiceResponse.say('We did not receive any input. Goodbye.');

    try {
        // 9. Tell Twilio to make the call
        const call = await twilioClient.calls.create({
            twiml: voiceResponse.toString(),
            to: phoneNumber,
            from: TWILIO_PHONE_NUMBER!,
        });

        console.log(`Call initiated via Twilio, SID: ${call.sid}`);

        // 10. Return the call SID (Twilio's ID)
        return {
            callSid: call.sid,
            status: call.status,
            message: "Call initiated successfully."
        };

    } catch (error: any) {
        console.error("Error initiating Twilio call:", error.message);
        if (error.code === 21211) { // Twilio error for invalid 'To' number
             throw new Error(`Invalid phone number: ${phoneNumber}. Must be in E.164 format (e.g., +15551234567).`);
        }
        throw new Error(error.message || "Failed to initiate call with telephony provider.");
    }
}