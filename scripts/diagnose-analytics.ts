import fs from 'fs';
import path from 'path';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Fallback to load .env.local if not already in process.env
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

async function diagnose() {
  console.log('====================================================');
  console.log('--- VAYA ANALYTICS DIAGNOSTIC REPORT ---');
  console.log('====================================================\n');

  // 1. Count docs in visitors, visitor_days, analytics_daily
  console.log('Fetching collections...');
  const [visitorsSnap, visitorDaysSnap, analyticsDailySnap, waitlistSnap] = await Promise.all([
    db.collection('visitors').get(),
    db.collection('visitor_days').get(),
    db.collection('analytics_daily').get(),
    db.collection('waitlist_submissions').get(),
  ]);

  const totalVisitors = visitorsSnap.size;
  const totalVisitorDays = visitorDaysSnap.size;
  const totalAnalyticsDaily = analyticsDailySnap.size;
  const totalWaitlist = waitlistSnap.size;

  console.log(`Document Counts:`);
  console.log(`  - visitors: ${totalVisitors}`);
  console.log(`  - visitor_days: ${totalVisitorDays}`);
  console.log(`  - analytics_daily: ${totalAnalyticsDaily}`);
  console.log(`  - waitlist_submissions: ${totalWaitlist}\n`);

  // 2. Count docs with isSeed == true
  let seedVisitors = 0;
  let seedVisitorDays = 0;
  let seedAnalyticsDaily = 0;
  let seedWaitlist = 0;

  for (const doc of visitorsSnap.docs) {
    if (doc.data().isSeed === true) seedVisitors++;
  }
  for (const doc of visitorDaysSnap.docs) {
    if (doc.data().isSeed === true) seedVisitorDays++;
  }
  for (const doc of analyticsDailySnap.docs) {
    if (doc.data().isSeed === true) seedAnalyticsDaily++;
  }
  for (const doc of waitlistSnap.docs) {
    if (doc.data().isSeed === true) seedWaitlist++;
  }

  console.log(`Seed Documents (isSeed == true):`);
  console.log(`  - visitors: ${seedVisitors} / ${totalVisitors} (${Math.round((seedVisitors / (totalVisitors || 1)) * 100)}%)`);
  console.log(`  - visitor_days: ${seedVisitorDays} / ${totalVisitorDays} (${Math.round((seedVisitorDays / (totalVisitorDays || 1)) * 100)}%)`);
  console.log(`  - analytics_daily: ${seedAnalyticsDaily} / ${totalAnalyticsDaily} (${Math.round((seedAnalyticsDaily / (totalAnalyticsDaily || 1)) * 100)}%)`);
  console.log(`  - waitlist_submissions: ${seedWaitlist} / ${totalWaitlist} (${Math.round((seedWaitlist / (totalWaitlist || 1)) * 100)}%)\n`);

  // 3. Group visitors by device, referrer (top 10), and firstSeenDay
  const byDevice: Record<string, number> = {};
  const byReferrer: Record<string, number> = {};
  const byFirstSeenDay: Record<string, number> = {};
  let singleVisitCount = 0;

  for (const doc of visitorsSnap.docs) {
    const data = doc.data();

    // Device
    const dev = data.device || 'unknown';
    byDevice[dev] = (byDevice[dev] || 0) + 1;

    // Referrer
    const ref = data.referrer || 'Direct';
    byReferrer[ref] = (byReferrer[ref] || 0) + 1;

    // First seen day
    const day = data.firstSeenDay || 'unknown';
    byFirstSeenDay[day] = (byFirstSeenDay[day] || 0) + 1;

    // Single visit check (visitDays == 1 and never returned)
    // "visitors have visitDays == 1 and never returned"
    if (data.visitDays === 1) {
      singleVisitCount++;
    }
  }

  console.log('Visitors Grouped by Device:');
  for (const [dev, count] of Object.entries(byDevice).sort((a, b) => b[1] - a[1])) {
    console.log(`  - ${dev}: ${count}`);
  }
  console.log('');

  console.log('Visitors Grouped by Referrer (Top 10):');
  const sortedReferrers = Object.entries(byReferrer).sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [ref, count] of sortedReferrers) {
    console.log(`  - ${ref}: ${count}`);
  }
  console.log('');

  console.log('Visitors Grouped by firstSeenDay:');
  const sortedDays = Object.entries(byFirstSeenDay).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [day, count] of sortedDays) {
    console.log(`  - ${day}: ${count}`);
  }
  console.log('');

  // 4. Visitors with visitDays == 1 and never returned
  console.log(`Visitors with visitDays == 1 (never returned): ${singleVisitCount} / ${totalVisitors} (${Math.round((singleVisitCount / (totalVisitors || 1)) * 100)}%)\n`);

  // 5. Total page views recorded in analytics_daily
  let totalPageViewsRecorded = 0;
  let totalSignupsRecorded = 0;
  for (const doc of analyticsDailySnap.docs) {
    const d = doc.data();
    totalPageViewsRecorded += (d.pageViews || 0);
    totalSignupsRecorded += (d.signups || 0);
  }
  console.log(`Aggregated analytics_daily totals:`);
  console.log(`  - Total page views: ${totalPageViewsRecorded}`);
  console.log(`  - Total signups recorded in daily: ${totalSignupsRecorded}`);
  console.log('\n====================================================');
}

diagnose()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Diagnosis failed:', err);
    process.exit(1);
  });
