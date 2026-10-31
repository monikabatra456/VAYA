import crypto from 'crypto';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

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

const NAMES = [
  'Aarav Sharma', 'Aditi Verma', 'Rohan Gupta', 'Priya Patel', 'Vikram Malhotra',
  'Ananya Iyer', 'Kabir Mehta', 'Ishita Sen', 'Rahul Nair', 'Meera Rao',
  'Dev Kapoor', 'Riya Desai', 'Siddharth Bose', 'Tanvi Joshi', 'Arjun Saxena',
  'Neha Reddy', 'Karan Singhal', 'Pooja Bhatt', 'Manish Choudhury', 'Sneha Pillai',
  'Varun Chopra', 'Deepika Menon', 'Akash Jain', 'Shreya Banerjee', 'Naveen Kulkarni',
  'Kavita Agarwal', 'Sanjay Mishra', 'Anjali Nair', 'Gaurav Pandey', 'Divya Chauhan',
  'Harsh Vardhan', 'Bhavna Tiwari', 'Abhishek Das', 'Swati Mukherjee', 'Rajesh Goel',
  'Alisha Merchant', 'Mohit Rawat', 'Sunita Sundaram', 'Vishal Nambiar', 'Tara Bhatnagar'
];

const ROLES = ['traveller', 'local-guide'];
const PROBLEMS = ['crowds', 'prices', 'safety', 'planning'];
const DESTINATIONS = ['Goa', 'Kashmir', 'Ladakh', 'Kerala', 'Jaipur', 'Varanasi', 'Himachal', 'Andaman', 'Udaipur'];
const DEVICES = ['mobile', 'desktop', 'tablet'] as const;
const REFERRERS = ['https://instagram.com', 'https://google.com', 'https://twitter.com', 'Direct', 'https://linkedin.com'];

async function runSeed() {
  console.log('--- Starting VAYA Database Seeding (30 Days) ---');

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // 1. Generate ~300 visits over 30 days
  const visitorIds: string[] = [];
  for (let i = 0; i < 180; i++) {
    visitorIds.push(crypto.randomUUID());
  }

  console.log(`Generated ${visitorIds.length} unique visitor identities.`);

  let totalVisitsCreated = 0;

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const dayDate = new Date(now - dayOffset * dayMs);
    const dayStr = dayDate.toISOString().slice(0, 10);

    const visitsThisDay = Math.floor(Math.random() * 11) + 8;
    const batch = db.batch();

    let pageViewsCount = 0;

    for (let v = 0; v < visitsThisDay; v++) {
      const vid = visitorIds[Math.floor(Math.random() * visitorIds.length)];
      const isReturning = Math.random() > 0.45;
      const device = DEVICES[Math.floor(Math.random() * DEVICES.length)];
      const referrer = REFERRERS[Math.floor(Math.random() * REFERRERS.length)];

      const visitorRef = db.collection('visitors').doc(vid);
      batch.set(
        visitorRef,
        {
          lastSeenAt: Timestamp.fromDate(dayDate),
          lastSeenDay: dayStr,
          firstSeenAt: Timestamp.fromDate(new Date(dayDate.getTime() - (isReturning ? 5 * dayMs : 0))),
          firstSeenDay: isReturning ? new Date(dayDate.getTime() - 5 * dayMs).toISOString().slice(0, 10) : dayStr,
          visitDays: isReturning ? Math.floor(Math.random() * 4) + 2 : 1,
          device,
          referrer,
          utmSource: 'organic',
          utmMedium: 'social',
          utmCampaign: 'launch-preview',
          hasJoined: false,
          isSeed: true,
        },
        { merge: true }
      );

      const visitorDayDocId = `${dayStr}_${vid}`;
      const visitorDayRef = db.collection('visitor_days').doc(visitorDayDocId);
      batch.set(visitorDayRef, {
        day: dayStr,
        visitorId: vid,
        isReturning,
        createdAt: Timestamp.fromDate(dayDate),
        isSeed: true,
      });

      pageViewsCount += Math.floor(Math.random() * 3) + 1;
      totalVisitsCreated++;
    }

    const dailyRef = db.collection('analytics_daily').doc(dayStr);
    batch.set(
      dailyRef,
      {
        pageViews: pageViewsCount,
        signups: 0,
        isSeed: true,
      },
      { merge: true }
    );

    await batch.commit();
  }

  console.log(`Successfully created ${totalVisitsCreated} visits across 30 days.`);

  // 2. Generate 40 Waitlist Submissions
  console.log('Generating 40 waitlist submissions…');
  const submissionBatch = db.batch();

  for (let s = 0; s < NAMES.length; s++) {
    const name = NAMES[s];
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    const emailLower = email.toLowerCase();
    const docId = crypto.createHash('sha256').update(emailLower).digest('hex');

    const dayOffset = Math.floor(Math.random() * 28);
    const subDate = new Date(now - dayOffset * dayMs);
    const dayStr = subDate.toISOString().slice(0, 10);

    const linkedVid = visitorIds[Math.floor(Math.random() * visitorIds.length)];

    const subRef = db.collection('waitlist_submissions').doc(docId);
    submissionBatch.set(subRef, {
      name,
      nameLower: name.toLowerCase(),
      email,
      emailLower,
      phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
      phoneDigits: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: ROLES[s % ROLES.length],
      problem: PROBLEMS[s % PROBLEMS.length],
      travelInterest: PROBLEMS[s % PROBLEMS.length],
      destination: DESTINATIONS[s % DESTINATIONS.length],
      consent: true,
      status: s % 3 === 0 ? 'reviewed' : 'new',
      visitorId: linkedVid,
      createdAt: Timestamp.fromDate(subDate),
      createdDay: dayStr,
      isSeed: true,
    });

    const dailyRef = db.collection('analytics_daily').doc(dayStr);
    submissionBatch.set(
      dailyRef,
      { signups: FieldValue.increment(1) },
      { merge: true }
    );
  }

  await submissionBatch.commit();
  console.log('Seeded 40 waitlist submissions successfully! All marked with isSeed: true.');
}

runSeed()
  .then(() => {
    console.log('--- Database Seeding Complete ---');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
