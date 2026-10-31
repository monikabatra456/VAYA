import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

const rawAdminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || 'chotimonino1@gmail.com');
export const ADMIN_EMAILS = rawAdminEmails
  .split(',')
  .map((e) => e.toLowerCase().trim())
  .filter(Boolean);
export const ADMIN_EMAIL = ADMIN_EMAILS[0] || 'chotimonino1@gmail.com';

export function isAuthorizedAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export interface AdminAuthResult {
  authenticated: boolean;
  user?: {
    email: string;
    uid: string;
  };
  error?: string;
  status?: number;
}

/**
 * Server-side helper to verify admin session.
 * Called in Server Components (admin layout/pages) and route handlers.
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    return { authenticated: false, error: 'No session cookie provided', status: 401 };
  }

  try {
    // Verify session cookie cryptographically and check if revoked
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    const userEmail = (decodedClaims.email || '').toLowerCase().trim();
    const isEmailVerified = decodedClaims.email_verified === true;

    if (!isAuthorizedAdmin(userEmail) || !isEmailVerified) {
      console.warn(`[requireAdmin]: Unauthorized attempt by ${userEmail} (verified: ${isEmailVerified}). Authorized admins: ${ADMIN_EMAILS.join(', ')}`);
      return { authenticated: false, error: 'Access denied: unauthorized account', status: 403 };
    }

    return {
      authenticated: true,
      user: {
        email: userEmail,
        uid: decodedClaims.uid,
      },
    };
  } catch (err: any) {
    console.error('[requireAdmin] Session verification failed:', err?.message || err);
    return { authenticated: false, error: 'Invalid or expired session', status: 401 };
  }
}
