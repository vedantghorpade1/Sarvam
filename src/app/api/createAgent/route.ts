import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Agent from "@/models/agentModel"; // <-- This imports the updated Cartesia-aligned model
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

    const agent = new Agent({
      ...body,
      userId: new mongoose.Types.ObjectId(userId),
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

    if (err instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { 
          message: "Agent validation failed", 
          errors: err.errors 
        },
        { status: 400 } 
      );
    }

    return NextResponse.json(
      { message: "Failed to create agent", error: err.message },
      { status: 500 }
    );
  }
}