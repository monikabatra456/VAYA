export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server';
import { adminDb } from '@/lib/firebase/admin';
import { formatDisplayIST } from '@/lib/utils/date';

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authenticated) {
    return NextResponse.json({ ok: false, error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim();
    const status = searchParams.get('status') || 'all';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 100);
    const startAfterId = searchParams.get('startAfter');

    let query: FirebaseFirestore.Query = adminDb.collection('waitlist_submissions');

    // Filter by status if not 'all'
    if (status === 'new' || status === 'reviewed') {
      query = query.where('status', '==', status);
    }

    // Filter by date range (createdDay)
    if (from) {
      query = query.where('createdDay', '>=', from);
    }
    if (to) {
      query = query.where('createdDay', '<=', to);
    }

    // Search logic: detects @ for email, digits for phone, or name prefix
    if (search) {
      const searchLower = search.toLowerCase();
      if (search.includes('@')) {
        query = query
          .where('emailLower', '>=', searchLower)
          .where('emailLower', '<=', searchLower + '\uf8ff');
      } else if (/^\d+$/.test(search)) {
        query = query
          .where('phoneDigits', '>=', search)
          .where('phoneDigits', '<=', search + '\uf8ff');
      } else {
        query = query
          .where('nameLower', '>=', searchLower)
          .where('nameLower', '<=', searchLower + '\uf8ff');
      }
    } else {
      // Default order: newest first
      query = query.orderBy('createdAt', 'desc');
    }

    // Cursor pagination
    if (startAfterId) {
      const startDoc = await adminDb.collection('waitlist_submissions').doc(startAfterId).get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    }

    query = query.limit(limit);
    const snapshot = await query.get();

    const items: any[] = [];
    snapshot.forEach((doc) => {
      const d = doc.data();
      const createdAtDate = d.createdAt?.toDate ? d.createdAt.toDate() : new Date();
      items.push({
        id: doc.id,
        name: d.name || 'Anonymous',
        email: d.email,
        phone: d.phone || '—',
        role: d.role || 'traveller',
        problem: d.problem || '—',
        travelInterest: d.travelInterest || '—',
        destination: d.destination || '—',
        status: d.status || 'new',
        visitorId: d.visitorId || null,
        submittedOn: formatDisplayIST(createdAtDate),
        createdAtIso: createdAtDate.toISOString(),
      });
    });

    const nextCursor = items.length === limit ? items[items.length - 1].id : null;

    return NextResponse.json({
      ok: true,
      items,
      nextCursor,
    });
  } catch (err: any) {
    console.error('[GET /api/admin/waitlist] Error:', err);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch waitlist submissions' },
      { status: 500 }
    );
  }
}
