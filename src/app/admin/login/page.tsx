'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';
import { clientAuth, googleProvider } from '@/lib/firebase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Popup Google sign-in
      const result = await signInWithPopup(clientAuth, googleProvider);
      const user = result.user;

      if (!user) {
        throw new Error('No user returned from Google authentication');
      }

      // 2. Get ID token
      const idToken = await user.getIdToken();

      // 3. Send ID token to server session route
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Sign out client immediately on authorization failure
        await clientAuth.signOut();
        setError(data?.error || 'Access denied. This Google account is not authorized.');
        setLoading(false);
        return;
      }

      // 4. Navigate to admin dashboard
      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      console.error('[Admin Login] Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        // User voluntarily closed the popup, do nothing
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled in Firebase. Please enable the Google provider in Firebase Console > Authentication > Sign-in method.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Domain not authorized in Firebase. Please add this domain in Firebase Console > Authentication > Settings > Authorized domains.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups and try again.');
      } else {
        setError(err?.message || 'Authentication failed. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F7F0E5',
        padding: '24px',
        fontFamily: "var(--font-outfit, 'Outfit', sans-serif)",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#FAF4EA',
          border: '1px solid #CDBFA8',
          borderRadius: '20px',
          boxShadow: '0 8px 30px rgba(15, 27, 51, 0.08)',
          padding: '40px 32px',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/vaya-logo-500.webp"
            alt="VAYA"
            style={{ height: '52px', width: 'auto', objectFit: 'contain' }}
          />
        </div>

        <h1
          style={{
            fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)",
            fontSize: '28px',
            fontWeight: 600,
            color: '#0F1B33',
            marginBottom: '8px',
          }}
        >
          Admin Portal
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#3F4A5E',
            lineHeight: 1.6,
            marginBottom: '32px',
          }}
        >
          Sign in with your authorized administrator Google account to access analytics and waitlist management.
        </p>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              color: '#B42318',
              fontSize: '13px',
              marginBottom: '24px',
              textAlign: 'left',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: '#14264A',
            color: '#FFFFFF',
            border: '1px solid #14264A',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'background 0.2s, transform 0.1s',
            boxShadow: '0 2px 8px rgba(15, 27, 51, 0.15)',
          }}
        >
          {/* Google Icon SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{loading ? 'Authenticating…' : 'Continue with Google'}</span>
        </button>

        <div
          style={{
            marginTop: '28px',
            fontSize: '11px',
            color: '#9CA3AF',
            letterSpacing: '0.04em',
          }}
        >
          Protected System • 256-Bit Encrypted Session
        </div>
      </div>
    </div>
  );
}
