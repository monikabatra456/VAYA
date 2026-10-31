export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, hasAdminCredentials } from '@/lib/firebase/admin';
import { isAuthorizedAdmin, ADMIN_EMAILS } from '@/lib/auth/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ ok: false, error: 'Missing ID token' }, { status: 400 });
    }

    // Diagnostic check for missing admin credentials
    if (!hasAdminCredentials) {
      console.error(
        '[admin/session] Missing Firebase Admin credentials. Please place serviceAccountKey.json in the project root OR set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local.'
      );
      return NextResponse.json(
        {
          ok: false,
          error:
            'Firebase Admin credentials missing. Please place serviceAccountKey.json in project root OR set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local.',
        },
        { status: 500 }
      );
    }

    // Verify ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userEmail = (decodedToken.email || '').toLowerCase().trim();
    const isEmailVerified = decodedToken.email_verified === true;

    if (!isAuthorizedAdmin(userEmail)) {
      console.warn(
        `[admin/session] Access denied for "${userEmail}". Authorized admin(s): ${ADMIN_EMAILS.join(', ')}`
      );
      return NextResponse.json(
        {
          ok: false,
          error: `Access denied. "${userEmail}" is not an authorized admin email. Update ADMIN_EMAIL in .env.local if this is your account.`,
        },
        { status: 403 }
      );
    }

    if (!isEmailVerified) {
      return NextResponse.json(
        { ok: false, error: 'Access denied. Please use an email-verified Google account.' },
        { status: 403 }
      );
    }

    // Create 7-day session cookie
    const expiresIn = 7 * 24 * 60 * 60 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const cookieStore = cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[admin/session] Error verifying token:', err?.message || err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.set('session', '', {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return NextResponse.json({ ok: true, message: 'Logged out successfully' });
}
