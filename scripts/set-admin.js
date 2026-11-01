#!/usr/bin/env node

/**
 * scripts/set-admin.js
 * One-time secure administrative script to assign the { admin: true } custom claim
 * to a target user in Firebase Authentication.
 *
 * Usage:
 *   node scripts/set-admin.js user@example.com
 *
 * Reads Firebase credentials securely from environment variables or local service account file.
 */

const fs = require('fs');
const path = require('path');

// 1. Load .env.local manually if not in environment
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
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
  });
}

const admin = require('firebase-admin');

function getServiceAccount() {
  // Check for local file in root
  const rootFiles = fs.readdirSync(process.cwd());
  const adminKeyFile = rootFiles.find(
    (f) => (f.includes('firebase-adminsdk') || f.includes('serviceAccount')) && f.endsWith('.json')
  );
  if (adminKeyFile) {
    const fullPath = path.join(process.cwd(), adminKeyFile);
    try {
      const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      if (parsed.client_email && parsed.private_key) return parsed;
    } catch {}
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID || 'vaya-57d51';

  if (clientEmail && privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    return {
      projectId,
      clientEmail,
      privateKey,
    };
  }

  return null;
}

const serviceAccount = getServiceAccount();
if (!serviceAccount) {
  console.error('Error: Firebase Admin credentials not found in environment or service account file.');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id || serviceAccount.projectId || process.env.FIREBASE_PROJECT_ID || 'vaya-57d51',
  });
}

const targetEmail = (process.argv[2] || process.env.ADMIN_EMAIL || 'go.vayaus@gmail.com').toLowerCase().trim();

async function main() {
  console.log(`Setting admin custom claim for: ${targetEmail}`);
  try {
    const user = await admin.auth().getUserByEmail(targetEmail);
    console.log(`User found: UID ${user.uid}`);

    // Set custom claim { admin: true }
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    // Verify claim was set
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log('Custom claims successfully applied:', updatedUser.customClaims);
    console.log(`\nSUCCESS: User ${targetEmail} is now verified as an administrator.`);
    process.exit(0);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.error(`User with email "${targetEmail}" does not exist in Firebase Auth.`);
      console.error('The user must sign in via Google at least once before claims can be set.');
    } else {
      console.error('Error applying admin claim:', err.message || err);
    }
    process.exit(1);
  }
}

main();
