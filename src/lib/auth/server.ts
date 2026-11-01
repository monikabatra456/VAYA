import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

const rawAdminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || 'go.vayaus@gmail.com');
export const ADMIN_EMAILS = rawAdminEmails
  .split(',')
  .map((e) => e.toLowerCase().trim())
  .filter(Boolean);
export const ADMIN_EMAIL = ADMIN_EMAILS[0] || 'go.vayaus@gmail.com';

export function isAuthorizedAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export interface AdminAuthResult {
  authenticated: boolean;
  user?: {
    email: string;
    uid: string;
    admin: boolean;
  };
  error?: string;
  status?: number;
}

/**
 * Server-side helper to verify admin session.
 * Called in Server Components (admin layout/pages) and route handlers.
 * Verifies Firebase session cookie cryptographically and validates admin claim or authorized email.
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
    const hasAdminClaim = decodedClaims.admin === true;
    const isAuthorized = isAuthorizedAdmin(userEmail);

    if ((!hasAdminClaim && !isAuthorized) || !isEmailVerified) {
      console.warn(
        `[requireAdmin]: Unauthorized attempt by ${userEmail} (claim: ${hasAdminClaim}, email: ${isAuthorized}, verified: ${isEmailVerified})`
      );
      return { authenticated: false, error: 'Access denied: unauthorized account', status: 403 };
    }

    return {
      authenticated: true,
      user: {
        email: userEmail,
        uid: decodedClaims.uid,
        admin: true,
      },
    };
  } catch (err: any) {
    console.error('[requireAdmin] Session verification failed:', err?.message || err);
    return { authenticated: false, error: 'Invalid or expired session', status: 401 };
  }
}
