import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('[Waitlist Submission]:', data);
    return NextResponse.json({ ok: true, message: 'Joined waitlist successfully' });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
