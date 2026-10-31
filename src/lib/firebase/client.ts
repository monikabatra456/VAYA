import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC5ZSxgJAoY4g0ZEzSUiwJh5Z0cvXIXzms",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "vaya-57d51.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "vaya-57d51",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:597181430540:web:acd5a62ae90be572f82729",
};

// Singleton Client App initialization
const clientApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const clientAuth = getAuth(clientApp);
export const clientDb = getFirestore(clientApp);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
