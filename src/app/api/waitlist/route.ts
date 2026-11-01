export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { z } from 'zod';
import { adminDb, adminFirestore } from '@/lib/firebase/admin';
import { getTodayIST } from '@/lib/utils/date';
import { VALID_PROBLEMS } from '@/lib/constants/waitlist';

// ── In-Memory Rate Limiter (Max 5 requests per 10 minutes per IP) ────────────
const RATE_LIMIT_WINDOW = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const ipRateMap = new Map<string, { count: number; expiresAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const salt = process.env.VISITOR_HASH_SALT || 'vaya-rate-limit';
  const ipHash = crypto.createHmac('sha256', salt).update(ip).digest('hex');

  const record = ipRateMap.get(ipHash);
  if (!record || record.expiresAt < now) {
    ipRateMap.set(ipHash, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (record.count >= MAX_REQUESTS) {
    return true;
  }

  record.count += 1;
  return false;
}

// ── Validation Schema ────────────────────────────────────────────────────────
const WaitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address')
    .max(254, 'Email is too long'),
  role: z.enum(['traveller', 'local_guide']).default('traveller'),
  biggestProblem: z.enum(VALID_PROBLEMS, {
    message: 'Please select your biggest travel problem',
  }),
  consent: z.literal(true, {
    message: 'You must agree to receive updates from VAYA',
  }),
  source: z.string().max(50).optional().default('waitlist_modal'),
  honeypot: z.string().max(100).optional(),
  recaptchaToken: z.string().optional(),
});

// ── Optional reCAPTCHA v3 / App Check Verification ───────────────────────────
async function verifyRecaptcha(token?: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    // If not configured in environment, skip gracefully to prevent breaking submissions
    return true;
  }
  if (!token) {
    return false;
  }

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
    });
    const result = await res.json();
    return Boolean(result.success && (result.score === undefined || result.score >= 0.5));
  } catch (err) {
    console.warn('[Waitlist]: reCAPTCHA verification request error:', err);
    // On external network error, allow submission gracefully
    return true;
  }
}

export async function POST(req: Request) {
  try {
    // 1. IP Rate Limiting
    const forwardedFor = req.headers.get('x-forwarded-for') || '';
    const ip = forwardedFor.split(',')[0].trim() || '127.0.0.1';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { ok: false, error: 'Too many requests. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    const rawBody = await req.json().catch(() => ({}));

    // 2. Honeypot check: If filled by automated bot, silently return success
    if (rawBody.honeypot && typeof rawBody.honeypot === 'string' && rawBody.honeypot.trim() !== '') {
      return NextResponse.json({ ok: true, message: "You're on the list!" });
    }

    // 3. Validation
    const parseResult = WaitlistSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { ok: false, error: 'Please check your inputs and try again.' },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // 4. reCAPTCHA verification if enabled
    const isHuman = await verifyRecaptcha(data.recaptchaToken);
    if (!isHuman) {
      return NextResponse.json(
        { ok: false, error: 'Spam verification failed. Please refresh and try again.' },
        { status: 400 }
      );
    }

    const emailTrimmed = data.email;
    const emailLower = emailTrimmed.toLowerCase();

    // Deterministic doc ID from sha256 of lowercase trimmed email (prevents duplicate documents)
    const docId = crypto.createHash('sha256').update(emailLower).digest('hex');

    const cookieStore = cookies();
    const visitorId = cookieStore.get('vaya_vid')?.value || null;
    const todayIST = getTodayIST();

    const submissionData = {
      email: emailTrimmed,
      emailLower,
      role: data.role,
      biggestProblem: data.biggestProblem,
      consent: true,
      status: 'new' as const,
      source: data.source,
      visitorId,
      createdDay: todayIST,
    };

    // If Firebase Admin credentials are not set, return graceful response without logging PII
    if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.warn('[Waitlist]: Service account credentials not set in environment.');
      return NextResponse.json({ ok: true, message: 'Successfully joined the waitlist!' });
    }

    const submissionRef = adminDb.collection('waitlist_submissions').doc(docId);

    // 5. Duplicate Check
    const existingDoc = await submissionRef.get();
    if (existingDoc.exists) {
      return NextResponse.json({
        ok: true,
        alreadyJoined: true,
        message: "You're already on the waitlist! Welcome back.",
      });
    }

    // 6. Atomic Batch Write
    const batch = adminDb.batch();

    batch.set(submissionRef, {
      ...submissionData,
      createdAt: adminFirestore.FieldValue.serverTimestamp(),
    });

    if (visitorId) {
      const visitorRef = adminDb.collection('visitors').doc(visitorId);
      batch.set(visitorRef, { hasJoined: true }, { merge: true });
    }

    const dailyRef = adminDb.collection('analytics_daily').doc(todayIST);
    batch.set(
      dailyRef,
      { signups: adminFirestore.FieldValue.increment(1) },
      { merge: true }
    );

    await batch.commit();

    return NextResponse.json({ ok: true, message: 'Successfully joined the waitlist!' });
  } catch (err: any) {
    console.error('[POST /api/waitlist] Internal submission error:', err?.message || err);
    return NextResponse.json(
      { ok: false, error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
