import fs from 'fs';
import path from 'path';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Load .env.local if present and not in environment
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'vaya-57d51';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

const apps = getApps();
const app = !apps.length
  ? clientEmail && privateKey
    ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
    : initializeApp({ projectId })
  : apps[0];

const db = getFirestore(app);

// Helper to batch delete all documents in a collection (450 docs per batch)
async function deleteCollectionDocs(collectionName: string) {
  console.log(`Fetching documents from '${collectionName}'...`);
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) {
    console.log(`  No documents to delete in '${collectionName}'.`);
    return 0;
  }

  console.log(`  Deleting ${snapshot.size} documents from '${collectionName}' in batches of <= 450...`);
  let count = 0;
  let currentBatch = db.batch();
  const batches = [];

  for (const doc of snapshot.docs) {
    currentBatch.delete(doc.ref);
    count++;
    if (count % 450 === 0) {
      batches.push(currentBatch.commit());
      currentBatch = db.batch();
    }
  }

  if (count % 450 !== 0) {
    batches.push(currentBatch.commit());
  }

  await Promise.all(batches);
  console.log(`  Successfully deleted ${count} documents from '${collectionName}'.`);
  return count;
}

// Helper to format date in IST (YYYY-MM-DD)
function formatDateIST(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

async function run() {
  const isConfirm = process.argv.includes('--confirm');

  console.log('====================================================');
  console.log('--- VAYA ANALYTICS RESET TOOL ---');
  console.log(`Mode: ${isConfirm ? 'EXECUTE (--confirm provided)' : 'DRY RUN (default)'}`);
  console.log('====================================================\n');

  // 1. Fetch current status
  const [visitorsSnap, visitorDaysSnap, analyticsDailySnap, waitlistSnap] = await Promise.all([
    db.collection('visitors').get(),
    db.collection('visitor_days').get(),
    db.collection('analytics_daily').get(),
    db.collection('waitlist_submissions').get(),
  ]);

  console.log('Current Document Counts:');
  console.log(`  - visitors: ${visitorsSnap.size}`);
  console.log(`  - visitor_days: ${visitorDaysSnap.size}`);
  console.log(`  - analytics_daily: ${analyticsDailySnap.size}`);
  console.log(`  - waitlist_submissions: ${waitlistSnap.size} (NEVER deleted)\n`);

  // 2. Calculate signups by createdDay from waitlist_submissions
  const signupsByDay: Record<string, number> = {};
  for (const doc of waitlistSnap.docs) {
    const data = doc.data();
    let day = data.createdDay;
    if (!day && data.createdAt) {
      const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      day = formatDateIST(date);
    }
    if (day) {
      signupsByDay[day] = (signupsByDay[day] || 0) + 1;
    }
  }

  console.log('Waitlist Submissions to Backfill into analytics_daily.signups:');
  for (const [day, count] of Object.entries(signupsByDay).sort()) {
    console.log(`  - Day ${day}: ${count} signup(s)`);
  }
  console.log('');

  if (!isConfirm) {
    console.log('----------------------------------------------------');
    console.log('[DRY RUN] Actions that WOULD be taken with --confirm:');
    console.log(`  1. Delete ${visitorsSnap.size} docs from 'visitors'`);
    console.log(`  2. Delete ${visitorDaysSnap.size} docs from 'visitor_days'`);
    console.log(`  3. Delete ${analyticsDailySnap.size} docs from 'analytics_daily'`);
    console.log(`  4. Recreate 'analytics_daily' docs with backfilled signups and pageViews = 0`);
    console.log(`  5. 'waitlist_submissions' (${waitlistSnap.size} docs) will be strictly preserved.`);
    console.log('\nTo execute these changes, re-run with:');
    console.log('  npx tsx scripts/reset-analytics.ts --confirm');
    console.log('----------------------------------------------------');
    return;
  }

  // Confirm execution
  console.log('Executing reset...');

  // Step A: Delete visitors, visitor_days, analytics_daily
  await deleteCollectionDocs('visitors');
  await deleteCollectionDocs('visitor_days');
  await deleteCollectionDocs('analytics_daily');

  // Step B: Backfill analytics_daily signups from waitlist_submissions
  console.log('\nBackfilling analytics_daily documents with existing waitlist signups...');
  const backfillDays = Object.keys(signupsByDay);
  if (backfillDays.length > 0) {
    const batch = db.batch();
    for (const day of backfillDays) {
      const docRef = db.collection('analytics_daily').doc(day);
      batch.set(docRef, {
        pageViews: 0,
        signups: signupsByDay[day],
        lastUpdated: new Date(),
      }, { merge: true });
    }
    await batch.commit();
    console.log(`  Successfully created/updated ${backfillDays.length} analytics_daily document(s).`);
  } else {
    console.log('  No waitlist signups found to backfill.');
  }

  console.log('\n====================================================');
  console.log('RESET COMPLETED SUCCESSFULLY!');
  console.log('Note: The server-side in-memory analytics cache (60s TTL) will self-expire');
  console.log('within 60 seconds or upon the next server deployment / cold start.');
  console.log('====================================================');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Reset failed:', err);
    process.exit(1);
  });
