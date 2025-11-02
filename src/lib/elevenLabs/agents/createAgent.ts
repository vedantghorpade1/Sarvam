// /lib/elevenlabs/agent/createAgent.ts

import connectDB from "@/lib/db";
import Agent from "@/models/agentModel";
import { combineTools } from "@/lib/systemTools";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  throw new Error("ELEVENLABS_API_KEY environment variable is not set");
}

interface CreateAgentData {
  userId: string;
  name: string;
  description?: string;
  voice_id: string;
  first_message: string;
  system_prompt: string;
  template_id?: string;
  template_name?: string;
  llm_model?: string;
  temperature?: number;
  language?: string;
  max_duration_seconds?: number;
  knowledge_documents?: Array<{
    document_id: string;
    name: string;
    type: 'file' | 'url' | 'text';
    content?: string;
    url?: string;
    file_name?: string;
    created_at: Date;
  }>;
  tools?: string[];
}
export async function createAgent(agentData: any) {
  await connectDB();

  try {
    // Construct the payload according to ElevenLabs API documentation
    const payload = {
      name: agentData.name,
      conversation_config: {
        agent: {
          prompt: {
            system: agentData.system_prompt,
            first_message: agentData.first_message,
            knowledge_base: (agentData.knowledge_documents || [])
              .filter((doc: any) => doc.document_id)
              .map((doc: any) => ({ id: doc.document_id })),
          },
          llm: {
            model: agentData.llm_model,
            temperature: agentData.temperature,
          },
          language: agentData.language,
          tools: combineTools(agentData.tools, agentData.systemTools),
        },
        tts: {
          model: "eleven-multilingual-v1", // Or make this configurable
          voice_id: agentData.voice_id,
        },
        asr: {
          model: "nova-2-general",
          language: "auto",
        },
        conversation: {
          max_duration_seconds: agentData.max_duration_seconds,
        },
      },
    };

    const response = await fetch("https://api.elevenlabs.io/v1/agents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    // --- FIX: Add error handling for the API call ---
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("ElevenLabs API Error:", errorBody);
      throw new Error(`Failed to create agent with ElevenLabs API: ${response.statusText}`);
    }

    const result = await response.json();

    // --- FIX: Ensure the agentId from the response is saved ---
    const newAgent = await Agent.create({
      ...agentData,
      agentId: result.id, // Use the ID from the ElevenLabs response
    });

    return newAgent;
  } catch (error) {
    console.error("Error creating agent:", error);
    throw error;
  }
}
