import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Agent from '@/models/agentModel';
import { getUserFromRequest } from '@/lib/jwt';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;

// --- GET: Fetch a single agent's details ---
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userData = await getUserFromRequest(request);
        if (!userData || typeof userData === 'string') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        // The 'id' from the URL corresponds to the MongoDB '_id'
        const agent = await Agent.findOne({ _id: params.id, userId: userData.userId });

        if (!agent) {
            return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
        }

        // Return data in camelCase format, as expected by your frontend form
        return NextResponse.json({
            name: agent.name,
            description: agent.description,
            voiceId: agent.voiceId,
            firstMessage: agent.firstMessage,
            systemPrompt: agent.systemPrompt,
            llmModel: agent.llmModel,
            temperature: agent.temperature,
            language: agent.language,
            maxDurationSeconds: agent.maxDurationSeconds,
            tools: agent.tools,
            disabled: agent.disabled,
            knowledgeDocuments: agent.knowledgeDocuments,
        });

    } catch (error: any) {
        console.error("Error fetching agent:", error);
        return NextResponse.json({ message: "Failed to fetch agent", error: error.message }, { status: 500 });
    }
}

// --- PATCH: Update an agent's details ---
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userData = await getUserFromRequest(request);
        if (!userData || typeof userData === 'string') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        await connectDB();
        const agent = await Agent.findOne({ _id: params.id, userId: userData.userId });
        if (!agent) {
            return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
        }

        // Construct the payload for the ElevenLabs API (which expects snake_case)
        const elevenLabsPayload: any = {
            name: body.name,
            conversation_config: {
                agent: {
                    first_message: body.firstMessage,
                    prompt: {
                        prompt: body.systemPrompt,
                        llm: body.llmModel,
                        temperature: body.temperature,
                    }
                },
                tts: { voice_id: body.voiceId },
                conversation: { max_duration_seconds: body.maxDurationSeconds }
            }
        };

        // Update the agent on the ElevenLabs platform
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agent.agentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "xi-api-key": ELEVENLABS_API_KEY },
            body: JSON.stringify(elevenLabsPayload),
        });

        if (!response.ok) {
            throw new Error(`Failed to update agent with ElevenLabs: ${await response.text()}`);
        }

        // If the API update is successful, update our own database
        agent.set(body); // Mongoose's .set() will update all matching fields from the body
        await agent.save();

        return NextResponse.json({ message: 'Agent updated successfully' });

    } catch (error: any) {
        console.error("Error updating agent:", error);
        return NextResponse.json({ message: 'Failed to update agent', error: error.message }, { status: 500 });
    }
}

// --- DELETE: Remove an agent ---
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userData = await getUserFromRequest(request);
        if (!userData || typeof userData === 'string') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const agent = await Agent.findOne({ _id: params.id, userId: userData.userId });
        if (!agent) {
            return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
        }

        // Delete the agent from the ElevenLabs platform first
        await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agent.agentId}`, {
            method: "DELETE",
            headers: { "xi-api-key": ELEVENLABS_API_KEY },
        });

        // Then, delete the agent from our database
        await Agent.deleteOne({ _id: params.id });

        return NextResponse.json({ message: 'Agent deleted successfully' });
    } catch (error: any) {
        console.error("Error deleting agent:", error);
        return NextResponse.json({ message: 'Failed to delete agent', error: error.message }, { status: 500 });
    }
}