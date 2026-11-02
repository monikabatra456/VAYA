import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
// Canonical email helper mirroring src/lib/utils/email.ts
function canonicalEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex === -1) return trimmed;

  let localPart = trimmed.slice(0, atIndex);
  let domain = trimmed.slice(atIndex + 1);

  const plusIndex = localPart.indexOf('+');
  if (plusIndex !== -1) {
    localPart = localPart.slice(0, plusIndex);
  }

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    localPart = localPart.replace(/\./g, '');
    domain = 'gmail.com';
  }

  return `${localPart}@${domain}`;
}

// Load .env.local if present
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

interface SubmissionRecord {
  id: string;
  data: any;
  email: string;
  emailKey: string;
  createdDay: string;
  createdAtDate: Date;
}

async function dedupe() {
  const isConfirm = process.argv.includes('--confirm');

  console.log('====================================================');
  console.log('--- VAYA WAITLIST DEDUPLICATION & MIGRATION ---');
  console.log(`Mode: ${isConfirm ? 'EXECUTE (--confirm provided)' : 'DRY RUN (default)'}`);
  console.log('====================================================\n');

  console.log('Fetching all waitlist submissions...');
  const snapshot = await db.collection('waitlist_submissions').get();
  console.log(`Found ${snapshot.size} total waitlist submission(s).\n`);

  if (snapshot.empty) {
    console.log('No submissions to process.');
    return;
  }

  // 1. Compute canonical emailKey and parse creation dates
  const records: SubmissionRecord[] = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const email = data.email || data.emailLower || '';
    const emailKey = data.emailKey || canonicalEmail(email);

    let createdAtDate = new Date();
    if (data.createdAt?.toDate) {
      createdAtDate = data.createdAt.toDate();
    } else if (data.createdAt) {
      createdAtDate = new Date(data.createdAt);
    }

    let createdDay = data.createdDay;
    if (!createdDay) {
      createdDay = formatDateIST(createdAtDate);
    }

    records.push({
      id: doc.id,
      data,
      email,
      emailKey,
      createdDay,
      createdAtDate,
    });
  }

  // 2. Group by emailKey
  const groups: Record<string, SubmissionRecord[]> = {};
  for (const rec of records) {
    if (!groups[rec.emailKey]) {
      groups[rec.emailKey] = [];
    }
    groups[rec.emailKey].push(rec);
  }

  const keptRecords: SubmissionRecord[] = [];
  const duplicateRecords: SubmissionRecord[] = [];

  for (const [key, list] of Object.entries(groups)) {
    // Sort ascending by creation date so the earliest is kept
    list.sort((a, b) => a.createdAtDate.getTime() - b.createdAtDate.getTime());
    keptRecords.push(list[0]);
    if (list.length > 1) {
      for (let i = 1; i < list.length; i++) {
        duplicateRecords.push(list[i]);
      }
    }
  }

  console.log(`Unique Canonical Emails: ${keptRecords.length}`);
  console.log(`Duplicate Records Found: ${duplicateRecords.length}\n`);

  if (duplicateRecords.length > 0) {
    console.log('--- Duplicate Records to Delete ---');
    duplicateRecords.forEach((d, idx) => {
      console.log(
        `  ${idx + 1}. Email: "${d.email}" (Key: "${d.emailKey}") | ID: ${d.id} | Created: ${d.createdAtDate.toISOString()} | Day: ${d.createdDay}`
      );
    });
    console.log('');
  } else {
    console.log('No duplicate submissions detected in Firestore.\n');
  }

  if (!isConfirm) {
    console.log('----------------------------------------------------');
    console.log('[DRY RUN] Summary of actions with --confirm:');
    console.log(`  1. Delete ${duplicateRecords.length} duplicate submission doc(s).`);
    console.log(`  2. Backfill 'emailKey' on ${keptRecords.length} kept submission doc(s).`);
    console.log(`  3. Create/update ${keptRecords.length} lock doc(s) in 'waitlist_email_keys'.`);
    console.log(`  4. Recompute 'analytics_daily.signups' from the ${keptRecords.length} remaining submissions.`);
    console.log('\nTo execute, re-run with:');
    console.log('  node --experimental-strip-types scripts/dedupe-waitlist.ts --confirm');
    console.log('----------------------------------------------------');
    return;
  }

  // ── EXECUTE CONFIRMED MIGRATION ──
  console.log('Executing deduplication and migration...');

  // Step A: Delete duplicates in batches
  if (duplicateRecords.length > 0) {
    console.log(`\nDeleting ${duplicateRecords.length} duplicate document(s)...`);
    let count = 0;
    let batch = db.batch();
    const batches = [];

    for (const dup of duplicateRecords) {
      batch.delete(db.collection('waitlist_submissions').doc(dup.id));
      count++;
      if (count % 450 === 0) {
        batches.push(batch.commit());
        batch = db.batch();
      }
    }
    if (count % 450 !== 0) {
      batches.push(batch.commit());
    }
    await Promise.all(batches);
    console.log(`  Successfully deleted ${count} duplicate document(s).`);
  }

  // Step B: Backfill emailKey on kept docs and create waitlist_email_keys lock docs
  console.log(`\nBackfilling emailKey and creating waitlist_email_keys lock docs for ${keptRecords.length} kept submission(s)...`);
  let count = 0;
  let batch = db.batch();
  const batches = [];

  for (const kept of keptRecords) {
    const lockHash = crypto.createHash('sha256').update(kept.emailKey).digest('hex');
    const lockRef = db.collection('waitlist_email_keys').doc(lockHash);
    const subRef = db.collection('waitlist_submissions').doc(kept.id);

    // Update submission with canonical emailKey
    batch.set(subRef, { emailKey: kept.emailKey }, { merge: true });

    // Set lock doc
    batch.set(lockRef, {
      emailKey: kept.emailKey,
      submissionId: kept.id,
      createdAt: kept.data.createdAt || kept.createdAtDate,
    }, { merge: true });

    count++;
    if (count % 200 === 0) {
      batches.push(batch.commit());
      batch = db.batch();
    }
  }

  if (count % 200 !== 0) {
    batches.push(batch.commit());
  }
  await Promise.all(batches);
  console.log(`  Successfully backfilled ${keptRecords.length} kept document(s) and created lock docs.`);

  // Step C: Recompute analytics_daily.signups per createdDay from kept submissions
  console.log('\nRecomputing analytics_daily.signups from kept submissions...');
  const signupsByDay: Record<string, number> = {};
  for (const kept of keptRecords) {
    signupsByDay[kept.createdDay] = (signupsByDay[kept.createdDay] || 0) + 1;
  }

  const dailySnap = await db.collection('analytics_daily').get();
  const dailyBatch = db.batch();
  const updatedDays = new Set<string>();

  for (const doc of dailySnap.docs) {
    const day = doc.id;
    const correctSignups = signupsByDay[day] || 0;
    dailyBatch.set(doc.ref, { signups: correctSignups, lastUpdated: new Date() }, { merge: true });
    updatedDays.add(day);
  }

  // Add any missing day that had signups
  for (const [day, count] of Object.entries(signupsByDay)) {
    if (!updatedDays.has(day)) {
      const docRef = db.collection('analytics_daily').doc(day);
      dailyBatch.set(docRef, { pageViews: 0, signups: count, lastUpdated: new Date() }, { merge: true });
    }
  }

  await dailyBatch.commit();
  console.log('  Successfully synchronized analytics_daily signups:');
  for (const [day, count] of Object.entries(signupsByDay)) {
    console.log(`    - Day ${day}: ${count} signup(s)`);
  }

  console.log('\n====================================================');
  console.log('DEDUPLICATION & MIGRATION COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

dedupe()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
