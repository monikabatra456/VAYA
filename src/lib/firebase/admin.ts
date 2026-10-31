import { getApps, initializeApp, cert, deleteApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// Ensure this module only runs in Node.js
if (typeof window !== 'undefined') {
  throw new Error('firebase-admin cannot be used on the client.');
}

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'vaya-57d51';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

function getServiceAccount(): any | null {
  // 1. Direct JSON file scan in project root (most reliable and immune to string-escaping bugs)
  try {
    const rootFiles = fs.readdirSync(process.cwd());
    const adminKeyFile = rootFiles.find(
      (f) => (f.includes('firebase-adminsdk') || f.includes('serviceAccount')) && f.endsWith('.json')
    );
    if (adminKeyFile) {
      const fullPath = path.join(process.cwd(), adminKeyFile);
      const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      if (parsed.client_email && parsed.private_key) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }

  // 2. Custom path from env
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const customPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (fs.existsSync(customPath)) {
      try {
        return JSON.parse(fs.readFileSync(customPath, 'utf8'));
      } catch (e) {
        console.error('[firebase-admin] Error reading FIREBASE_SERVICE_ACCOUNT_PATH:', e);
      }
    }
  }

  // 3. Known file names
  const potentialFiles = [
    'vaya-57d51-firebase-adminsdk-fbsvc-1d35e21b2d.json',
    'serviceAccountKey.json',
    'service-account.json',
    'firebase-admin.json',
    'firebase-service-account.json',
  ];

  for (const filename of potentialFiles) {
    const filePath = path.join(process.cwd(), filename);
    if (fs.existsSync(filePath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (parsed.client_email && parsed.private_key) {
          return parsed;
        }
      } catch (e) {
        console.error(`[firebase-admin] Error reading ${filename}:`, e);
      }
    }
  }

  // 4. Direct environment variables
  if (clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey,
    };
  }

  return null;
}

const serviceAccount = getServiceAccount();
export const hasAdminCredentials = !!serviceAccount;

let app: App;

const currentApps = getApps();

if (serviceAccount) {
  const existingApp = currentApps[0];
  // Check if existing app in memory lacks ServiceAccountCredential (e.g. from prior dev server run)
  const isServiceAccount =
    (existingApp?.options as any)?.credential?.constructor?.name === 'ServiceAccountCredential';

  if (existingApp && isServiceAccount) {
    app = existingApp;
  } else {
    if (existingApp) {
      try {
        deleteApp(existingApp);
      } catch (e) {
        // ignore
      }
    }
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || serviceAccount.projectId || projectId,
    });
    console.log('[firebase-admin]: Initialized with ServiceAccountCredential successfully.');
  }
} else {
  if (!currentApps.length) {
    app = initializeApp({
      projectId,
    });
    console.warn(
      '[firebase-admin]: Initialized with projectId only. For admin authentication, service account credential is required.'
    );
  } else {
    app = currentApps[0];
  }
}

export const adminApp = app;
export const adminAuth: Auth = getAuth(app);
export const adminDb: Firestore = getFirestore(app);
export const adminFirestore = {
  FieldValue,
  Timestamp,
};
