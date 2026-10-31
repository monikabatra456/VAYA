export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server';
import { adminDb } from '@/lib/firebase/admin';
import { formatDisplayIST } from '@/lib/utils/date';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.authenticated) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const doc = await adminDb.collection('waitlist_submissions').doc(params.id).get();
    if (!doc.exists) {
      return NextResponse.json({ ok: false, error: 'Submission not found' }, { status: 404 });
    }

    const d = doc.data() || {};
    const createdAtDate = d.createdAt?.toDate ? d.createdAt.toDate() : new Date();

    // Fetch linked visitor data if available
    let visitorData = null;
    if (d.visitorId) {
      const vDoc = await adminDb.collection('visitors').doc(d.visitorId).get();
      if (vDoc.exists) {
        const vd = vDoc.data() || {};
        const firstSeen = vd.firstSeenAt?.toDate ? vd.firstSeenAt.toDate() : null;
        const lastSeen = vd.lastSeenAt?.toDate ? vd.lastSeenAt.toDate() : null;
        visitorData = {
          visitorId: d.visitorId,
          device: vd.device || 'desktop',
          referrer: vd.referrer || 'Direct',
          utmSource: vd.utmSource || '—',
          utmMedium: vd.utmMedium || '—',
          utmCampaign: vd.utmCampaign || '—',
          visitDays: vd.visitDays || 1,
          firstSeenOn: firstSeen ? formatDisplayIST(firstSeen) : '—',
          lastSeenOn: lastSeen ? formatDisplayIST(lastSeen) : '—',
        };
      }
    }

    return NextResponse.json({
      ok: true,
      submission: {
        id: doc.id,
        email: d.email,
        emailLower: d.emailLower,
        role: d.role || 'traveller',
        biggestProblem: d.biggestProblem || d.problem || '—',
        consent: Boolean(d.consent),
        source: d.source || 'waitlist_modal',
        status: d.status || 'new',
        submittedOn: formatDisplayIST(createdAtDate),
        visitorId: d.visitorId || null,
        visitor: visitorData,
      },
    });
  } catch (err: any) {
    console.error('[GET /api/admin/waitlist/[id]] Error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.authenticated) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { status } = body;

    if (status !== 'new' && status !== 'reviewed') {
      return NextResponse.json({ ok: false, error: 'Invalid status value' }, { status: 400 });
    }

    const docRef = adminDb.collection('waitlist_submissions').doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ ok: false, error: 'Submission not found' }, { status: 404 });
    }

    await docRef.update({ status });

    return NextResponse.json({ ok: true, status });
  } catch (err: any) {
    console.error('[PATCH /api/admin/waitlist/[id]] Error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
