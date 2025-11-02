import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Agent from "@/models/agentModel"; // Make sure this path is correct
import { getUserFromRequest } from "@/lib/jwt";
import { getDefaultSystemTools } from "@/lib/systemTools"; // Make sure this path is correct

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 1. Read the request body as JSON
    const body = await request.json();

    // 2. Get the userId
    const userId = typeof userData === "object" ? userData.userId : userData;

    // 3. Connect to your database
    await connectDB();

    // 4. Create and save the agent directly in the route
    console.log("Creating agent configuration in local DB for Sarvam.ai integration.");

    const agent = new Agent({
      ...body, // All data from the frontend form
      userId,  // Add the authenticated user's ID
      systemTools: getDefaultSystemTools(),
    });

    // Manually set the agentId to the string representation of the MongoDB _id.
    agent.agentId = agent._id.toString();
    
    await agent.save();

    console.log("✅ Agent configuration saved to DB with id:", agent.agentId);

    // 5. Return the new agent's ID and success message
    return NextResponse.json({
      agent_id: agent._id.toString(), // Return the new MongoDB document ID
      name: agent.name,
      message: "AI agent created successfully.",
    });

  } catch (err: any) {
    // Log the full error object to see the stack trace and more details
    console.error("FULL ERROR IN ROUTE:", err); 
    return NextResponse.json(
      { message: "Failed to create agent", error: err.message },
      { status: 500 }
    );
  }
}