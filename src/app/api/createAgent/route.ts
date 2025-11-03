import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Agent from "@/models/agentModel"; // <-- This now imports the updated Cartesia-aligned model
import { getUserFromRequest } from "@/lib/jwt";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const userId = typeof userData === "object" ? userData.userId : userData;

    await connectDB();

    console.log("Creating agent configuration in local DB for Cartesia integration.");

    // The ...body spread will now contain the nested 'models' object
    // from the frontend, which matches our new Agent schema.
    const agent = new Agent({
      ...body,
      userId,
      // systemTools: getDefaultSystemTools(), // <-- REMOVED: This is no longer in our simplified model
    });

    // Use the internal DB _id as the agentId
    agent.agentId = agent._id.toString(); 
    
    await agent.save(); // <-- This will validate against the new Cartesia-aligned schema

    console.log("✅ Agent configuration saved to DB with id:", agent.agentId);

    return NextResponse.json({
      agent_id: agent._id.toString(),
      name: agent.name,
      message: "AI agent created successfully.",
    });

  } catch (err: any) {
    console.error("FULL ERROR IN ROUTE:", err); 

    // Check if this is a Mongoose validation error
    if (err instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { 
          message: "Agent validation failed", 
          // Send back the specific fields that failed
          errors: err.errors 
        },
        { status: 400 } // 400 Bad Request
      );
    }

    // Generic fallback error
    return NextResponse.json(
      { message: "Failed to create agent", error: err.message },
      { status: 500 }
    );
  }
}