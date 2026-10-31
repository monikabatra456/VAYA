export const runtime = 'nodejs';

import { requireAdmin } from '@/lib/auth/server';
import { adminDb } from '@/lib/firebase/admin';
import { getTodayIST, formatDisplayIST } from '@/lib/utils/date';

/**
 * Protect against CSV injection by escaping cells starting with dangerous characters
 */
function sanitizeCsvCell(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  // If string starts with =, +, -, @, prefix with a single quote
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  // Escape internal double quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim();
    const status = searchParams.get('status') || 'all';
    const role = searchParams.get('role') || 'all';
    const problem = searchParams.get('problem') || 'all';
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query: FirebaseFirestore.Query = adminDb.collection('waitlist_submissions');

    if (status === 'new' || status === 'reviewed') {
      query = query.where('status', '==', status);
    }
    if (role === 'traveller' || role === 'local_guide' || role === 'local-guide') {
      query = query.where('role', '==', role);
    }
    if (problem !== 'all') {
      query = query.where('biggestProblem', '==', problem);
    }
    if (from) {
      query = query.where('createdDay', '>=', from);
    }
    if (to) {
      query = query.where('createdDay', '<=', to);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      query = query.where('emailLower', '>=', searchLower).where('emailLower', '<=', searchLower + '\uf8ff');
    } else {
      query = query.orderBy('createdAt', 'desc');
    }

    const todayIST = getTodayIST();
    const filename = `vaya-waitlist-${todayIST}.csv`;

    const headers = [
      'Email',
      'I am a (Role)',
      'Biggest Problem',
      'Consent',
      'Status',
      'Submitted On (IST)',
      'Visitor ID',
    ];

    // Build streamed response with UTF-8 BOM
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // 1. Output UTF-8 BOM (\uFEFF)
        controller.enqueue(new Uint8Array([0xef, 0xbb, 0xbf]));

        // 2. Output CSV Header row
        controller.enqueue(encoder.encode(headers.map(sanitizeCsvCell).join(',') + '\r\n'));

        // 3. Page through Firestore in batches of 500
        const BATCH_SIZE = 500;
        let lastDoc: FirebaseFirestore.DocumentSnapshot | null = null;
        let hasMore = true;

        while (hasMore) {
          let pagedQuery = query.limit(BATCH_SIZE);
          if (lastDoc) {
            pagedQuery = pagedQuery.startAfter(lastDoc);
          }

          const snapshot = await pagedQuery.get();
          if (snapshot.empty) {
            hasMore = false;
            break;
          }

          let chunk = '';
          snapshot.forEach((doc) => {
            const d = doc.data();
            const createdAtDate = d.createdAt?.toDate ? d.createdAt.toDate() : new Date();
            const roleLabel = d.role === 'local_guide' || d.role === 'local-guide' ? 'Local guide' : 'Traveller';
            const biggestProblem = d.biggestProblem || d.problem || '—';
            const consentLabel = d.consent ? 'Yes' : 'No';

            const row = [
              d.email || '',
              roleLabel,
              biggestProblem,
              consentLabel,
              d.status === 'reviewed' ? 'Reviewed' : 'New',
              formatDisplayIST(createdAtDate),
              d.visitorId || '',
            ];
            chunk += row.map(sanitizeCsvCell).join(',') + '\r\n';
          });

          controller.enqueue(encoder.encode(chunk));

          if (snapshot.size < BATCH_SIZE) {
            hasMore = false;
          } else {
            lastDoc = snapshot.docs[snapshot.docs.length - 1];
          }
        }

        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    console.error('[GET /api/admin/export] Error:', err);
    return new Response(JSON.stringify({ error: 'Failed to generate CSV export' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
