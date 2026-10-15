import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, name } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Vaya <welcome@vaya.app>',
          to: [email],
          subject: "You've joined the Vaya app launch waitlist",
          html: `<p>Hi ${name || 'there'},</p><p>You've joined the Vaya app launch waitlist. Fasten your seatbelts - be a co-creator of Vaya and part of the Vaya community.</p>`,
        }),
      });
    } else {
      console.log(`[Email Mock Sent to ${email}]: You've joined the Vaya app launch waitlist. Fasten your seatbelts - be a co-creator of Vaya and part of the Vaya community.`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[confirm-email error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
