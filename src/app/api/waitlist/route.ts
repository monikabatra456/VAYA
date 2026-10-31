export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { z } from 'zod';
import { adminDb, adminFirestore } from '@/lib/firebase/admin';
import { getTodayIST } from '@/lib/utils/date';

// Rate Limiter: In-memory (best-effort, 5 requests per 10 min per IP hash)
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

import { VALID_PROBLEMS } from '@/lib/constants/waitlist';

// Validation Schema matching Task 5
const WaitlistSchema = z.object({
  email: z.string().email('Please enter a valid email address').max(120),
  role: z.enum(['traveller', 'local_guide']).default('traveller'),
  biggestProblem: z.enum(VALID_PROBLEMS, {
    message: 'Please select your biggest travel problem',
  }),
  consent: z.literal(true, {
    message: 'You must agree to receive updates from VAYA',
  }),
  source: z.string().max(50).optional().default('hero'),
  honeypot: z.string().max(100).optional(),
});

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

    const rawBody = await req.json();

    // 2. Honeypot check
    if (rawBody.honeypot && rawBody.honeypot.trim() !== '') {
      console.warn('[Waitlist] Honeypot triggered, ignoring request.');
      return NextResponse.json({ ok: true, message: "You're on the list!" });
    }

    // 3. Validation
    const parseResult = WaitlistSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid submission data', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const emailTrimmed = data.email.trim();
    const emailLower = emailTrimmed.toLowerCase();

    // Deterministic doc ID from sha256 of lowercase trimmed email
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

    // If service account is not yet configured, log submission gracefully
    if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.warn('[Waitlist]: Service account credentials not set in .env.local. Submission payload received successfully:');
      console.log(submissionData);
      return NextResponse.json({ ok: true, message: 'Successfully joined the waitlist!' });
    }

    const submissionRef = adminDb.collection('waitlist_submissions').doc(docId);

    // 4. Check if document already exists
    const existingDoc = await submissionRef.get();
    if (existingDoc.exists) {
      return NextResponse.json({
        ok: true,
        alreadyJoined: true,
        message: "You're already on the waitlist! Welcome back.",
      });
    }

    // 5. Batch creation
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
    console.error('[POST /api/waitlist] Error:', err);
    return NextResponse.json(
      { ok: false, error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
