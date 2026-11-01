export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { adminAuth, hasAdminCredentials } from '@/lib/firebase/admin';
import { isAuthorizedAdmin, ADMIN_EMAILS } from '@/lib/auth/server';

// ── In-Memory Rate Limiter for Admin Login (Max 5 failed attempts / 15 minutes) ──
const LOGIN_RATE_WINDOW = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const failedLoginMap = new Map<string, { count: number; lockUntil: number }>();

function checkLoginRateLimit(key: string): { blocked: boolean; remainingMs?: number } {
  const now = Date.now();
  const record = failedLoginMap.get(key);
  if (!record) return { blocked: false };

  if (record.lockUntil > now) {
    return { blocked: true, remainingMs: record.lockUntil - now };
  }

  if (record.count >= MAX_FAILED_ATTEMPTS && record.lockUntil <= now) {
    failedLoginMap.delete(key);
    return { blocked: false };
  }

  return { blocked: false };
}

function recordFailedLogin(key: string) {
  const now = Date.now();
  const record = failedLoginMap.get(key);
  if (!record) {
    failedLoginMap.set(key, { count: 1, lockUntil: 0 });
    return;
  }

  record.count += 1;
  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockUntil = now + LOGIN_RATE_WINDOW;
  }
}

function clearFailedLogin(key: string) {
  failedLoginMap.delete(key);
}

export async function POST(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for') || '';
  const ip = forwardedFor.split(',')[0].trim() || '127.0.0.1';
  const salt = process.env.VISITOR_HASH_SALT || 'vaya-admin-rate';
  const rateKey = crypto.createHmac('sha256', salt).update(ip).digest('hex');

  const rateCheck = checkLoginRateLimit(rateKey);
  if (rateCheck.blocked) {
    const minutesLeft = Math.ceil((rateCheck.remainingMs || LOGIN_RATE_WINDOW) / (60 * 1000));
    return NextResponse.json(
      { ok: false, error: `Too many failed login attempts. Account temporarily locked. Please try again in ${minutesLeft} minutes.` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== 'string') {
      recordFailedLogin(rateKey);
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 400 });
    }

    if (!hasAdminCredentials) {
      console.error(
        '[admin/session] Missing Firebase Admin credentials in environment.'
      );
      return NextResponse.json(
        { ok: false, error: 'Authentication service temporarily unavailable.' },
        { status: 500 }
      );
    }

    // Verify ID token cryptographically
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken, true);
    } catch (tokenErr) {
      recordFailedLogin(rateKey);
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const userEmail = (decodedToken.email || '').toLowerCase().trim();
    const isEmailVerified = decodedToken.email_verified === true;
    const hasAdminClaim = decodedToken.admin === true;
    const isEmailAuthorized = isAuthorizedAdmin(userEmail);

    // Validate admin authority (either custom claim admin:true or authorized email) and verified email
    if ((!hasAdminClaim && !isEmailAuthorized) || !isEmailVerified) {
      recordFailedLogin(rateKey);
      console.warn(`[admin/session] Unauthorized sign-in attempt from ${userEmail}`);
      // Return generic error message to prevent account enumeration
      return NextResponse.json(
        { ok: false, error: 'Invalid credentials' },
        { status: 403 }
      );
    }

    // Login successful: reset failed attempt counter
    clearFailedLogin(rateKey);

    // Create 5-day session cookie (per security specification: 5 days max)
    const expiresIn = 5 * 24 * 60 * 60 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const cookieStore = cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    recordFailedLogin(rateKey);
    console.error('[admin/session] Authentication failure:', err?.message || err);
    return NextResponse.json(
      { ok: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  // Revoke refresh tokens on logout
  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
      if (decoded?.uid) {
        await adminAuth.revokeRefreshTokens(decoded.uid);
      }
    } catch {
      // Ignore token verification errors during logout
    }
  }

  cookieStore.set('session', '', {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  return NextResponse.json({ ok: true, message: 'Logged out successfully' });
}
