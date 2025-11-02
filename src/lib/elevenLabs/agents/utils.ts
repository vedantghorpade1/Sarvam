// /lib/elevenlabs/agent/utils.ts

import { combineTools } from "@/lib/systemTools";
interface AgentData {
  name: string;
  voice: string;
  tools?: any[]; // You can define a more specific tool type
  language: string;
}

// ✅ Sanitize agent config before sending to ElevenLabs API
export function sanitizeAgentConfigForEL(agentData: AgentData) {
  const { name, voice, tools, language } = agentData;
  return {
    name,
    voice,
    language,
    tools: combineTools(tools || []),
  };
}

// ✅ Build any predefined “built-in” tools (like FAQs, knowledge base)
export function buildBuiltInTools() {
  return [
    { name: "KnowledgeBase", enabled: true },
    { name: "FAQ", enabled: true },
  ];
}
