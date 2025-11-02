import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Agent from "@/models/agentModel";
import { getUserFromRequest } from "@/lib/jwt";
import { getDefaultSystemTools } from "@/lib/systemTools";
import mongoose from "mongoose"; // <-- **Import mongoose**

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const userId = typeof userData === "object" ? userData.userId : userData;

    await connectDB();

    console.log("Creating agent configuration in local DB for Sarvam.ai integration.");

    const agent = new Agent({
      ...body,
      userId,
      systemTools: getDefaultSystemTools(),
    });

    agent.agentId = agent._id.toString();
    
    await agent.save(); // <-- This is where the validation fails

    console.log("✅ Agent configuration saved to DB with id:", agent.agentId);

    return NextResponse.json({
      agent_id: agent._id.toString(),
      name: agent.name,
      message: "AI agent created successfully.",
    });

  } catch (err: any) {
    console.error("FULL ERROR IN ROUTE:", err); 

    // --- **BETTER ERROR HANDLING** ---
    // Check if this is a Mongoose validation error
    if (err instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { 
          message: "Agent validation failed", 
          // Send back the specific fields that failed
          errors: err.errors 
        },
        { status: 400 } // 400 Bad Request is more accurate
      );
    }
    // --- **END BETTER ERROR HANDLING** ---

    // Generic fallback error
    return NextResponse.json(
      { message: "Failed to create agent", error: err.message },
      { status: 500 }
    );
  }
}