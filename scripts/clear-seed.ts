import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

async function deleteCollectionSeed(collectionName: string) {
  console.log(`Checking ${collectionName} for seed documents…`);
  const snapshot = await db.collection(collectionName).where('isSeed', '==', true).get();

  if (snapshot.empty) {
    console.log(`No seed documents in ${collectionName}.`);
    return;
  }

  console.log(`Deleting ${snapshot.size} seed documents in ${collectionName}…`);
  const batches = [];
  let currentBatch = db.batch();
  let count = 0;

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
  console.log(`Deleted ${snapshot.size} documents from ${collectionName}.`);
}

async function runClear() {
  console.log('--- Starting Seed Data Cleanup ---');
  await deleteCollectionSeed('waitlist_submissions');
  await deleteCollectionSeed('visitor_days');
  await deleteCollectionSeed('visitors');
  await deleteCollectionSeed('analytics_daily');
  console.log('--- Seed Data Cleanup Finished ---');
}

runClear()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to clear seed data:', err);
    process.exit(1);
  });
