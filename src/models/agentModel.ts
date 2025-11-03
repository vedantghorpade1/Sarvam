import mongoose, { Document, Schema } from 'mongoose';

// Nested schema for model configuration
const ModelConfigSchema = new Schema({
  provider: { type: String, required: true },
  model_id: { type: String, required: true },
}, { _id: false });

// Specific schema for LLM, which includes temperature
const LLMConfigSchema = new Schema({
  provider: { type: String, required: true },
  model_id: { type: String, required: true },
  temperature: { type: Number, default: 0.3, min: 0, max: 2 },
}, { _id: false });

// Simplified IKnowledgeDocument for frontend compatibility
export interface IKnowledgeDocument {
  type: 'url' | 'text';
  name: string;
  content?: string;
  url?: string;
}

export interface IAgent extends Document {
  userId: mongoose.Types.ObjectId;
  agentId: string; // This will be the local DB _id
  name: string;
  description?: string;

  // Core settings
  firstMessage: string;
  systemPrompt: string;
  templateId?: string;

  // Model Orchestration (Cartesia "Line" Style)
  models: {
    tts: { provider: string, model_id: string }; // e.g., { provider: 'cartesia', model_id: 'anushka' }
    stt: { provider: string, model_id: string }; // e.g., { provider: 'cartesia', model_id: 'ink-whisper' }
    llm: { provider: string, model_id: string, temperature: number }; // e.g., { provider: 'openai', model_id: 'gpt-4o', ... }
  };

  // Language and localization
  language: string;

  // Advanced conversation settings
  maxDurationSeconds: number;

  // Knowledge and tools
  knowledgeDocuments: IKnowledgeDocument[];
  tools: string[];

  // Analytics and usage
  usageMinutes: number;
  lastCalledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AgentSchema = new Schema<IAgent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    agentId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,

    // Core settings
    firstMessage: {
      type: String,
      required: true,
    },
    systemPrompt: {
      type: String,
      required: true,
    },
    templateId: String,

    // Model Orchestration (NEW Cartesia-aligned structure)
    models: {
      tts: ModelConfigSchema,
      stt: ModelConfigSchema,
      llm: LLMConfigSchema,
    },

    // Language and localization
    language: {
      type: String,
      default: 'en',
    },

    // Advanced conversation settings
    maxDurationSeconds: {
      type: Number,
      default: 1800,
    },

    // Knowledge and tools
    knowledgeDocuments: [Schema.Types.Mixed],
    tools: [String],

    // Analytics
    usageMinutes: {
      type: Number,
      default: 0,
    },
    lastCalledAt: Date,
  },
  { timestamps: true }
);


const Agent = mongoose.models.Agent || mongoose.model<IAgent>('Agent', AgentSchema);

export default Agent;