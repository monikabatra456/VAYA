'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

export const PROBLEMS = [
  'Overcrowding',
  'Unreasonable prices',
  'Finding local guides',
  'Changing plans',
  'Safety concerns',
  'Too much planning',
  'Other',
];

export default function WaitlistModal({ onClose }) {
  const [form, setForm] = useState({
    email: '',
    role: 'traveller', // 'traveller' | 'local_guide'
    biggestProblem: '',
    consent: false,
    honeypot: '',
  });

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | success | duplicate | error
  const [serverMessage, setServerMessage] = useState('');

  const modalRef = useRef(null);
  const emailInputRef = useRef(null);

  // VisualViewport keyboard-safe handling for mobile devices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const onResize = () => {
      const activeEl = document.activeElement;
      if (modalRef.current && activeEl && modalRef.current.contains(activeEl)) {
        setTimeout(() => {
          activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
      }
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, []);

  // Focus input on mount & focus trap
  useEffect(() => {
    emailInputRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const validate = () => {
    const errs = {};
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (!form.biggestProblem) {
      errs.biggestProblem = 'Please select your biggest travel problem';
    }
    if (!form.consent) {
      errs.consent = 'You must agree to receive updates from VAYA';
    }
    return errs;
  };

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErrors((err) => ({ ...err, [name]: undefined }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setStatus('submitting');
    setServerMessage('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          role: form.role,
          biggestProblem: form.biggestProblem,
          consent: form.consent,
          source: 'waitlist_modal',
          honeypot: form.honeypot,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (data.alreadyJoined) {
          setStatus('duplicate');
          setServerMessage(data.message || "You're already on the waitlist! Welcome back.");
        } else {
          setStatus('success');
        }
      } else {
        setStatus('error');
        setServerMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setServerMessage('Unable to connect. Please check your network and try again.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Join the VAYA waitlist"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(10, 14, 26, 0.72)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.22s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '500px',
          background: 'linear-gradient(180deg, #FDF9F2 0%, #F5EDE1 100%)',
          borderRadius: '24px',
          padding: 'clamp(28px, 4.5vw, 40px)',
          boxShadow: '0 24px 64px rgba(15, 23, 42, 0.28), 0 4px 16px rgba(15, 23, 42, 0.08)',
          border: '1px solid rgba(205, 191, 168, 0.45)',
          overflow: 'hidden',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Small gold dotted-path + plane in top-right corner */}
        <svg
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '12px',
            right: '56px',
            width: '90px',
            height: '56px',
            pointerEvents: 'none',
            overflow: 'visible',
            opacity: 0.85,
          }}
          viewBox="0 0 90 56"
          fill="none"
        >
          <path
            d="M 5 48 C 30 45, 55 35, 76 14"
            stroke="#D97706"
            strokeWidth="1.5"
            strokeDasharray="3 4"
            fill="none"
          />
          {/* Tiny gold airplane at end of path */}
          <g transform="translate(74, 8) rotate(-40) scale(0.65)">
            <path
              d="M 16 8 C 14.5 7.2 12.5 7 10 7 L 7 2 L 5.5 2 L 7 7 L 3 7 L 2 5 L 1 5 L 1.8 8 L 1 11 L 2 11 L 3 9 L 7 9 L 5.5 14 L 7 14 L 10 9 C 12.5 9 14.5 8.8 16 8 Z"
              fill="#D97706"
            />
          </g>
        </svg>

        {/* Close Button top-right */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close waitlist modal"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(20, 33, 61, 0.06)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#14213d',
            transition: 'background 0.2s ease, transform 0.15s ease',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(20, 33, 61, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(20, 33, 61, 0.06)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {status === 'success' ? (
          /* Success View */
          <div style={{ textAlign: 'center', padding: '24px 0 12px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#FEF3C7',
                border: '2px solid #F59E0B',
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D97706',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
                fontSize: '26px',
                fontWeight: 700,
                color: '#14213d',
                marginBottom: '10px',
                letterSpacing: '-0.02em',
              }}
            >
              You're on the list.
            </h2>
            <p
              style={{
                fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
                fontSize: '15px',
                color: '#4B5563',
                lineHeight: 1.6,
                marginBottom: '28px',
                maxWidth: '380px',
                marginInline: 'auto',
              }}
            >
              Welcome to the VAYA community. We'll be in touch with early access updates soon.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                height: '48px',
                padding: '0 36px',
                borderRadius: '9999px',
                background: '#14213d',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#25205f'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#14213d'; }}
            >
              Close
            </button>
          </div>
        ) : status === 'duplicate' ? (
          /* Duplicate Email View */
          <div style={{ textAlign: 'center', padding: '24px 0 12px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#EEF2FF',
                border: '2px solid #6366F1',
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4F46E5',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
                fontSize: '24px',
                fontWeight: 700,
                color: '#14213d',
                marginBottom: '10px',
              }}
            >
              Already on the list!
            </h2>
            <p
              style={{
                fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
                fontSize: '15px',
                color: '#4B5563',
                lineHeight: 1.6,
                marginBottom: '28px',
                maxWidth: '380px',
                marginInline: 'auto',
              }}
            >
              {serverMessage || "You're already on the waitlist! We will notify you as soon as invitations roll out."}
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                height: '48px',
                padding: '0 36px',
                borderRadius: '9999px',
                background: '#14213d',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          /* Form View */
          <>
            <h2
              style={{
                fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
                fontSize: 'clamp(24px, 3vw, 28px)',
                fontWeight: 700,
                color: '#14213d',
                margin: '0 0 6px 0',
                letterSpacing: '-0.025em',
              }}
            >
              Join the VAYA waitlist
            </h2>
            <p
              style={{
                fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
                fontSize: '14px',
                color: '#4B5563',
                margin: '0 0 24px 0',
                lineHeight: 1.5,
              }}
            >
              Be a co-creator. Shape how travellers discover the world smarter.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              {/* Honeypot field for bot prevention */}
              <input
                type="text"
                name="honeypot"
                value={form.honeypot}
                onChange={handleChange}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              {/* EMAIL Field */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  htmlFor="wl-email"
                  style={{
                    display: 'block',
                    fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#4B5563',
                    marginBottom: '8px',
                  }}
                >
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9CA3AF',
                      display: 'flex',
                      alignItems: 'center',
                      pointerEvents: 'none',
                    }}
                    aria-hidden="true"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    ref={emailInputRef}
                    id="wl-email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'wl-email-err' : undefined}
                    style={{
                      width: '100%',
                      height: '52px',
                      paddingLeft: '44px',
                      paddingRight: '16px',
                      borderRadius: '12px',
                      border: errors.email ? '1.5px solid #DC2626' : '1px solid #CDBFA8',
                      backgroundColor: '#FFFFFF',
                      fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
                      fontSize: '15px',
                      color: '#14213d',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 0 2px #14213d';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {errors.email && (
                  <p id="wl-email-err" role="alert" style={{ margin: '6px 0 0', fontSize: '12px', color: '#DC2626', fontFamily: 'var(--font-jakarta)' }}>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* I AM A... Radio Cards */}
              <div style={{ marginBottom: '18px' }}>
                <span
                  style={{
                    display: 'block',
                    fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#4B5563',
                    marginBottom: '8px',
                  }}
                >
                  I am a…
                </span>
                <div
                  role="radiogroup"
                  aria-label="Select your role"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}
                >
                  {/* Traveller Card */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      height: '52px',
                      padding: '0 16px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: form.role === 'traveller' ? '2px solid #D97706' : '1px solid #CDBFA8',
                      backgroundColor: form.role === 'traveller' ? '#FEF3C7' : '#FFFFFF',
                      transition: 'all 0.2s ease',
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="traveller"
                      checked={form.role === 'traveller'}
                      onChange={handleChange}
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    />
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={form.role === 'traveller' ? '#D97706' : '#64748B'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.2c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z" />
                    </svg>
                    <span
                      style={{
                        fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
                        fontSize: '14px',
                        fontWeight: form.role === 'traveller' ? 600 : 500,
                        color: form.role === 'traveller' ? '#92400E' : '#14213d',
                      }}
                    >
                      Traveller
                    </span>
                  </label>

                  {/* Local guide Card */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      height: '52px',
                      padding: '0 16px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: form.role === 'local_guide' ? '2px solid #D97706' : '1px solid #CDBFA8',
                      backgroundColor: form.role === 'local_guide' ? '#FEF3C7' : '#FFFFFF',
                      transition: 'all 0.2s ease',
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="local_guide"
                      checked={form.role === 'local_guide'}
                      onChange={handleChange}
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    />
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={form.role === 'local_guide' ? '#D97706' : '#64748B'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 21s-8-6.5-8-12a8 8 0 1 1 16 0c0 5.5-8 12-8 12z" />
                      <circle cx="12" cy="9" r="3" />
                    </svg>
                    <span
                      style={{
                        fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
                        fontSize: '14px',
                        fontWeight: form.role === 'local_guide' ? 600 : 500,
                        color: form.role === 'local_guide' ? '#92400E' : '#14213d',
                      }}
                    >
                      Local guide
                    </span>
                  </label>
                </div>
              </div>

              {/* BIGGEST TRAVEL PROBLEM? Select */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  htmlFor="wl-problem"
                  style={{
                    display: 'block',
                    fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#4B5563',
                    marginBottom: '8px',
                  }}
                >
                  Biggest travel problem?
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    id="wl-problem"
                    name="biggestProblem"
                    value={form.biggestProblem}
                    onChange={handleChange}
                    aria-invalid={!!errors.biggestProblem}
                    aria-describedby={errors.biggestProblem ? 'wl-prob-err' : undefined}
                    style={{
                      width: '100%',
                      height: '52px',
                      paddingLeft: '16px',
                      paddingRight: '40px',
                      borderRadius: '12px',
                      border: errors.biggestProblem ? '1.5px solid #DC2626' : '1px solid #CDBFA8',
                      backgroundColor: '#FFFFFF',
                      fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
                      fontSize: '14.5px',
                      color: form.biggestProblem ? '#14213d' : '#6B7280',
                      outline: 'none',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 0 2px #14213d';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <option value="" disabled>Select your biggest challenge…</option>
                    {PROBLEMS.map((prob) => (
                      <option key={prob} value={prob} style={{ color: '#14213d' }}>
                        {prob}
                      </option>
                    ))}
                  </select>
                  <span
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: '#64748B',
                    }}
                    aria-hidden="true"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </div>
                {errors.biggestProblem && (
                  <p id="wl-prob-err" role="alert" style={{ margin: '6px 0 0', fontSize: '12px', color: '#DC2626', fontFamily: 'var(--font-jakarta)' }}>
                    {errors.biggestProblem}
                  </p>
                )}
              </div>

              {/* CONSENT Checkbox */}
              <div style={{ marginBottom: '22px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    name="consent"
                    checked={form.consent}
                    onChange={handleChange}
                    aria-invalid={!!errors.consent}
                    aria-describedby={errors.consent ? 'wl-consent-err' : undefined}
                    style={{
                      marginTop: '2px',
                      width: '18px',
                      height: '18px',
                      accentColor: '#D97706',
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
                      fontSize: '13px',
                      color: '#4B5563',
                      lineHeight: 1.45,
                    }}
                  >
                    I agree to receive updates from VAYA.
                  </span>
                </label>
                {errors.consent && (
                  <p id="wl-consent-err" role="alert" style={{ margin: '6px 0 0', fontSize: '12px', color: '#DC2626', fontFamily: 'var(--font-jakarta)' }}>
                    {errors.consent}
                  </p>
                )}
              </div>

              {/* Error message from server */}
              {status === 'error' && serverMessage && (
                <p
                  role="alert"
                  style={{
                    margin: '0 0 16px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#FEE2E2',
                    color: '#991B1B',
                    fontSize: '13px',
                    fontFamily: 'var(--font-jakarta)',
                  }}
                >
                  {serverMessage}
                </p>
              )}

              {/* Full-width Navy Pill Submit Button */}
              <button
                type="submit"
                disabled={status === 'submitting'}
                style={{
                  width: '100%',
                  height: '52px',
                  borderRadius: '9999px',
                  background: '#14213d',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 600,
                  fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
                  border: 'none',
                  cursor: status === 'submitting' ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 16px rgba(20, 33, 61, 0.25)',
                  transition: 'background 0.2s ease, transform 0.18s ease',
                  opacity: status === 'submitting' ? 0.8 : 1,
                }}
                onMouseEnter={(e) => {
                  if (status !== 'submitting') {
                    e.currentTarget.style.background = '#25205f';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#14213d';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {status === 'submitting' ? (
                  <>
                    <svg
                      style={{
                        animation: 'spin 0.8s linear infinite',
                        width: '20px',
                        height: '20px',
                      }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                    </svg>
                    <span>Joining…</span>
                  </>
                ) : (
                  <>
                    <span>Join waitlist</span>
                    <span style={{ fontSize: '18px', lineHeight: 1 }}>→</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
