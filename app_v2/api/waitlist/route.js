// app/api/waitlist/route.js
// POST /api/waitlist — validates, rate-limits, saves to MongoDB (or mocks if unconfigured)
// Sends welcome email via Resend if RESEND_API_KEY is set.

import { NextResponse } from 'next/server';

const VALID_ROLES    = new Set(['traveller', 'local-guide']);
const VALID_PROBLEMS = new Set(['crowds', 'prices', 'safety', 'planning']);

// In-memory rate limiter (IP → {count, resetAt})
const rateLimitMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) ?? { count: 0, resetAt: now + 60_000 };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 60_000; }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return entry.count > 5; // 5 submissions per minute per IP
}

// ── Sanitise (strip tags, trim) ──────────────────────────────────────────────
function sanitise(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim().slice(0, 320);
}

// ── Resend welcome email ──────────────────────────────────────────────────────
async function sendWelcomeEmail({ email, role }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // skip silently when not configured

  const guideExtra = role === 'local-guide'
    ? `<p>As a local guide, you'll have the unique opportunity to shape how travellers experience your home — on your terms.</p>`
    : '';

  const body = {
    from:    'VAYA <hello@vaya.travel>',
    to:      [email],
    subject: "You're on the VAYA waitlist ✈",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1A2338">
        <h1 style="color:#0B2D5B;letter-spacing:.06em">VAYA</h1>
        <p>You've joined the VAYA launch waitlist. Tighten your seat belt.</p>
        <p>We're building something that changes how people travel — not just <em>where</em> to go, but <em>when</em> to go, and what to expect when you get there.</p>
        ${guideExtra}
        <p>You're invited to become a co-creator of VAYA. Your early feedback will shape the product.</p>
        <p>Join the community: <a href="https://community.vaya.travel" style="color:#27B2C9">community.vaya.travel</a></p>
        <hr style="margin:2rem 0;border:none;border-top:1px solid #eee"/>
        <p style="font-size:.82rem;color:#6B7B96">
          © 2026 VAYA. You're receiving this because you joined the waitlist.<br>
          <a href="https://vaya.travel/unsubscribe" style="color:#6B7B96">Unsubscribe</a>
        </p>
      </div>`,
  };

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn('[Resend warning]', err);
  }
}

// ── MongoDB save ──────────────────────────────────────────────────────────────
async function saveToMongo(doc) {
  const uri = process.env.MONGODB_URI;
  if (!uri) return { mocked: true }; // graceful mock if not configured

  try {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    try {
      await client.connect();
      const col = client.db('vaya').collection('waitlist');
      await col.updateOne(
        { email: doc.email },
        { $setOnInsert: doc },
        { upsert: true }
      );
      return { saved: true };
    } finally {
      await client.close();
    }
  } catch (err) {
    console.warn('[MongoDB mock fallback]', err.message);
    return { mocked: true };
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const raw = await req.json().catch(() => null);
    if (!raw) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

    const email   = sanitise(raw.email ?? '');
    const role    = sanitise(raw.role    ?? '');
    const problem = sanitise(raw.problem ?? '');
    const consent = Boolean(raw.consent);
    const source  = sanitise(raw.source  ?? 'unknown');

    // Validate
    const errors = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Valid email required';
    if (!VALID_ROLES.has(role))                                errors.role    = 'Valid role required';
    if (!VALID_PROBLEMS.has(problem))                          errors.problem = 'Valid problem required';
    if (!consent)                                              errors.consent = 'Consent required';
    if (Object.keys(errors).length) {
      return NextResponse.json({ errors }, { status: 422 });
    }

    const doc = { email, role, problem, consent, source, createdAt: new Date() };

    const [dbResult] = await Promise.allSettled([
      saveToMongo(doc),
      sendWelcomeEmail({ email, role }),
    ]);

    if (dbResult.status === 'rejected') {
      console.error('[waitlist] DB error', dbResult.reason);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    return NextResponse.json(
      { ok: true, mocked: !!dbResult.value?.mocked },
      { status: 200 }
    );
  } catch (err) {
    console.error('[waitlist]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
