import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Agent from '@/models/agentModel';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(request: Request) {
  try {
    const userData = await getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = typeof userData === 'object' ? userData.userId : userData;

    await connectDB();
    
    const agents = await Agent.find({ userId }).sort({ createdAt: -1 });
    
    return NextResponse.json({ agents });
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ message: 'Failed to fetch agents', error: error.message }, { status: 500 });
  }
}