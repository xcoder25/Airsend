import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Minimal in-memory state for real-time hackathon demo across devices
let globalState = {
  stage: 'idle', // 'idle' | 'requested' | 'transferring' | 'catching_ready' | 'success'
  amount: 5000,
  recipientName: 'Damilola',
  timestamp: Date.now()
};

export async function GET() {
  return NextResponse.json(globalState);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    globalState = { ...globalState, ...body, timestamp: Date.now() };
    return NextResponse.json(globalState);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update state' }, { status: 400 });
  }
}
