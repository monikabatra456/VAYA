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

  // UI / Animation states
  const [emailFocused, setEmailFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [rolePop, setRolePop] = useState(null); // 'traveller' | 'local_guide' | null
  const [hasPulsed, setHasPulsed] = useState(false);

  const modalRef = useRef(null);
  const emailInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const isEmailValid = Boolean(form.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()));
  const isFormComplete = Boolean(isEmailValid && form.role && form.biggestProblem && form.consent);

  // Pulse effect when form becomes complete
  useEffect(() => {
    if (isFormComplete && !hasPulsed) {
      setHasPulsed(true);
    } else if (!isFormComplete && hasPulsed) {
      setHasPulsed(false);
    }
  }, [isFormComplete, hasPulsed]);

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

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Focus input on mount & focus trap
  useEffect(() => {
    emailInputRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
          return;
        }
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
  }, [onClose, isDropdownOpen]);

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

  const handleRoleSelect = (roleValue) => {
    setRolePop(roleValue);
    setForm((f) => ({ ...f, role: roleValue }));
    setErrors((err) => ({ ...err, role: undefined }));
    setTimeout(() => setRolePop(null), 250);
  };

  const handleProblemSelect = (prob) => {
    setForm((f) => ({ ...f, biggestProblem: prob }));
    setErrors((err) => ({ ...err, biggestProblem: undefined }));
    setIsDropdownOpen(false);
  };

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
      className="wl-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={modalRef} className="wl-modal">
        {/* Soft gold glow top-left corner */}
        <div className="wl-ambient-glow" aria-hidden="true" />

        {/* Small gold dotted-path + plane floating in top-right corner */}
        <div className="wl-floating-plane" aria-hidden="true">
          <svg
            style={{
              width: '90px',
              height: '56px',
              overflow: 'visible',
            }}
            viewBox="0 0 90 56"
            fill="none"
          >
            <path
              d="M 5 48 C 30 45, 55 35, 76 14"
              stroke="#C98B3C"
              strokeWidth="1.5"
              strokeDasharray="3 4"
              fill="none"
              opacity="0.85"
            />
            <g transform="translate(74, 8) rotate(-40) scale(0.65)">
              <path
                d="M 16 8 C 14.5 7.2 12.5 7 10 7 L 7 2 L 5.5 2 L 7 7 L 3 7 L 2 5 L 1 5 L 1.8 8 L 1 11 L 2 11 L 3 9 L 7 9 L 5.5 14 L 7 14 L 10 9 C 12.5 9 14.5 8.8 16 8 Z"
                fill="#C98B3C"
              />
            </g>
          </svg>
        </div>

        {/* Close Button top-right (rotates 90deg on hover) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close waitlist modal"
          className="wl-close-btn"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {status === 'success' ? (
          /* Success View */
          <div className="wl-success-view">
            {/* Confetti particles burst */}
            <div className="wl-confetti-container" aria-hidden="true">
              {[...Array(16)].map((_, i) => (
                <span
                  key={i}
                  className={`wl-confetti wl-confetti-${i}`}
                  style={{
                    backgroundColor: ['#C98B3C', '#E8C48A', '#3E6FB0', '#12213F'][i % 4],
                  }}
                />
              ))}
            </div>

            {/* Large gold check circle with draw animation */}
            <div className="wl-success-badge" aria-hidden="true">
              <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
                <circle
                  cx="34"
                  cy="34"
                  r="30"
                  stroke="#C98B3C"
                  strokeWidth="3"
                  className="wl-draw-circle"
                />
                <polyline
                  points="21 35 30 44 47 25"
                  stroke="#C98B3C"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="wl-draw-check"
                />
              </svg>
            </div>

            <h2 className="wl-success-title">You&apos;re on the list!</h2>
            <p className="wl-success-desc">
              We&apos;ll let you know as soon as VAYA takes off.
            </p>

            {/* Flying Paper Plane left to right */}
            <div className="wl-paper-plane-wrapper" aria-hidden="true">
              <svg className="wl-paper-plane" viewBox="0 0 24 24" fill="none" stroke="#C98B3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2 11 13" />
                <path d="M22 2 15 22 11 13 2 9 22 2z" />
              </svg>
            </div>

            <button type="button" onClick={onClose} className="wl-action-btn">
              Close
            </button>
          </div>
        ) : status === 'duplicate' ? (
          /* Duplicate Email View */
          <div className="wl-success-view">
            <div className="wl-duplicate-badge" aria-hidden="true">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <h2 className="wl-success-title">Already on the list!</h2>
            <p className="wl-success-desc">
              {serverMessage || "You're already on the waitlist! We will notify you as soon as invitations roll out."}
            </p>
            <button type="button" onClick={onClose} className="wl-action-btn">
              Done
            </button>
          </div>
        ) : (
          /* Form View */
          <>
            <h2 className="wl-title">Join the VAYA waitlist</h2>
            <p className="wl-subtitle">
              Be a co-creator. Shape how travellers discover the world smarter.
            </p>

            {/* 3-Step Progress Bar (Email -> Role -> Challenge) */}
            <div className="wl-progress-bar" aria-hidden="true">
              <div className={`wl-progress-seg ${isEmailValid ? 'active' : ''}`}>
                <div className="wl-progress-track">
                  <div className="wl-progress-fill" style={{ width: isEmailValid ? '100%' : '0%' }} />
                </div>
                <span className="wl-progress-text">1. Email</span>
              </div>
              <div className={`wl-progress-seg ${form.role ? 'active' : ''}`}>
                <div className="wl-progress-track">
                  <div className="wl-progress-fill" style={{ width: form.role ? '100%' : '0%' }} />
                </div>
                <span className="wl-progress-text">2. Role</span>
              </div>
              <div className={`wl-progress-seg ${form.biggestProblem ? 'active' : ''}`}>
                <div className="wl-progress-track">
                  <div className="wl-progress-fill" style={{ width: form.biggestProblem ? '100%' : '0%' }} />
                </div>
                <span className="wl-progress-text">3. Challenge</span>
              </div>
            </div>

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

              {/* 1. EMAIL Field */}
              <div className="wl-field-group">
                <label
                  htmlFor="wl-email"
                  className={`wl-label ${emailFocused ? 'focused' : ''}`}
                >
                  Email
                </label>
                <div className={`wl-input-wrapper ${errors.email ? 'has-error' : ''}`}>
                  <span
                    className={`wl-mail-icon ${emailFocused ? 'focused' : ''}`}
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
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'wl-email-err' : undefined}
                    className="wl-input"
                  />
                  {/* Green-Gold checkmark when email is valid */}
                  {isEmailValid && (
                    <span className="wl-email-valid-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C98B3C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </div>
                {errors.email && (
                  <p id="wl-email-err" role="alert" className="wl-error-msg">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* 2. I AM A... Radio Cards */}
              <div className="wl-field-group">
                <span className="wl-label">I am a…</span>
                <div
                  role="radiogroup"
                  aria-label="Select your role"
                  className="wl-roles-grid"
                >
                  {/* Traveller Card */}
                  <label
                    onClick={() => handleRoleSelect('traveller')}
                    className={`wl-role-card ${form.role === 'traveller' ? 'selected' : ''} ${rolePop === 'traveller' ? 'pop' : ''}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="traveller"
                      checked={form.role === 'traveller'}
                      onChange={handleChange}
                      className="wl-sr-only"
                    />

                    {/* Check badge in top-right */}
                    {form.role === 'traveller' && (
                      <span className="wl-role-badge" aria-hidden="true">
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M12.207 4.793a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L6.5 9.086l4.293-4.293a1 1 0 0 1 1.414 0z" />
                        </svg>
                      </span>
                    )}

                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`wl-role-icon wl-plane-icon ${form.role === 'traveller' ? 'tilted' : ''}`}
                      aria-hidden="true"
                    >
                      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.2c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z" />
                    </svg>

                    <span className="wl-role-name">Traveller</span>
                  </label>

                  {/* Local guide Card */}
                  <label
                    onClick={() => handleRoleSelect('local_guide')}
                    className={`wl-role-card ${form.role === 'local_guide' ? 'selected' : ''} ${rolePop === 'local_guide' ? 'pop' : ''}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="local_guide"
                      checked={form.role === 'local_guide'}
                      onChange={handleChange}
                      className="wl-sr-only"
                    />

                    {/* Check badge in top-right */}
                    {form.role === 'local_guide' && (
                      <span className="wl-role-badge" aria-hidden="true">
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M12.207 4.793a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L6.5 9.086l4.293-4.293a1 1 0 0 1 1.414 0z" />
                        </svg>
                      </span>
                    )}

                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`wl-role-icon wl-pin-icon ${form.role === 'local_guide' ? 'bouncing' : ''}`}
                      aria-hidden="true"
                    >
                      <path d="M12 21s-8-6.5-8-12a8 8 0 1 1 16 0c0 5.5-8 12-8 12z" />
                      <circle cx="12" cy="9" r="3" />
                    </svg>

                    <span className="wl-role-name">Local guide</span>
                  </label>
                </div>
              </div>

              {/* 3. BIGGEST TRAVEL PROBLEM? Custom Dropdown */}
              {/* Each .wl-field-group is its own stacking context (z-index 2), so the open
                  menu (z-index 50) was trapped inside it and the later "I agree" field
                  painted on top. Lift this group while the menu is open. */}
              <div
                className="wl-field-group"
                ref={dropdownRef}
                style={isDropdownOpen ? { zIndex: 20 } : undefined}
              >
                <label htmlFor="wl-problem" className="wl-label">
                  Biggest travel problem?
                </label>
                <div className="wl-dropdown-container">
                  <button
                    type="button"
                    id="wl-problem"
                    aria-haspopup="listbox"
                    aria-expanded={isDropdownOpen}
                    onClick={() => setIsDropdownOpen((v) => !v)}
                    className={`wl-dropdown-trigger ${isDropdownOpen ? 'open' : ''} ${errors.biggestProblem ? 'has-error' : ''}`}
                  >
                    <span className={form.biggestProblem ? 'wl-dropdown-val' : 'wl-dropdown-placeholder'}>
                      {form.biggestProblem || 'Select your biggest challenge…'}
                    </span>
                    <span className={`wl-chevron ${isDropdownOpen ? 'rotated' : ''}`} aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </button>

                  {/* Hidden standard select to maintain standard keyboard/form compatibility */}
                  <select
                    name="biggestProblem"
                    value={form.biggestProblem}
                    onChange={handleChange}
                    className="wl-sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <option value="" disabled>Select your biggest challenge…</option>
                    {PROBLEMS.map((prob) => (
                      <option key={prob} value={prob}>{prob}</option>
                    ))}
                  </select>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <ul role="listbox" className="wl-dropdown-menu">
                      {PROBLEMS.map((prob) => {
                        const isSelected = form.biggestProblem === prob;
                        return (
                          <li
                            key={prob}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleProblemSelect(prob)}
                            className={`wl-dropdown-item ${isSelected ? 'selected' : ''}`}
                          >
                            <span>{prob}</span>
                            {isSelected && (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C98B3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                {errors.biggestProblem && (
                  <p id="wl-prob-err" role="alert" className="wl-error-msg">
                    {errors.biggestProblem}
                  </p>
                )}
              </div>

              {/* 4. CONSENT Checkbox with Stroke Draw Animation */}
              <div className="wl-field-group">
                <label className="wl-consent-label">
                  <input
                    type="checkbox"
                    name="consent"
                    checked={form.consent}
                    onChange={handleChange}
                    aria-invalid={!!errors.consent}
                    aria-describedby={errors.consent ? 'wl-consent-err' : undefined}
                    className="wl-sr-only"
                  />
                  <div className={`wl-custom-checkbox ${form.consent ? 'checked' : ''} ${errors.consent ? 'has-error' : ''}`}>
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <polyline
                        points="1.5 5 4.5 8 10.5 2"
                        stroke="#FFFFFF"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`wl-check-stroke ${form.consent ? 'drawn' : ''}`}
                      />
                    </svg>
                  </div>
                  <span className="wl-consent-text">
                    I agree to receive updates from VAYA.
                  </span>
                </label>
                {errors.consent && (
                  <p id="wl-consent-err" role="alert" className="wl-error-msg">
                    {errors.consent}
                  </p>
                )}
              </div>

              {/* Error message from server */}
              {status === 'error' && serverMessage && (
                <div role="alert" className="wl-server-error">
                  {serverMessage}
                </div>
              )}

              {/* 5. "Join waitlist" Submit Button with Shimmer & Arrow Slide */}
              <button
                type="submit"
                disabled={status === 'submitting'}
                className={`wl-submit-btn ${!isFormComplete && status !== 'submitting' ? 'incomplete' : ''} ${hasPulsed ? 'pulse-ready' : ''}`}
              >
                {/* Shimmer line moving on hover */}
                <span className="wl-btn-shimmer" aria-hidden="true" />

                {status === 'submitting' ? (
                  <div className="wl-btn-content">
                    <svg
                      className="wl-spinner"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                    </svg>
                    <span>Joining…</span>
                  </div>
                ) : (
                  <div className="wl-btn-content">
                    <span>Join waitlist</span>
                    <span className="wl-btn-arrow" aria-hidden="true">→</span>
                  </div>
                )}
              </button>
            </form>
          </>
        )}
      </div>

      <style jsx>{`
        /* ── Overlay & Modal Entry/Exit (Rule 7 & 9) ── */
        .wl-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background-color: rgba(18, 33, 63, 0.72);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: overlayFadeIn 0.35s ease-out;
        }

        .wl-modal {
          position: relative;
          width: 100%;
          max-width: 500px;
          background: linear-gradient(180deg, #FDF7EE 0%, #F9F0E1 100%);
          border-radius: 24px;
          padding: clamp(28px, 4.5vw, 40px);
          box-shadow: 0 24px 64px rgba(18, 33, 63, 0.28), 0 4px 16px rgba(18, 33, 63, 0.08);
          border: 1px solid rgba(227, 213, 188, 0.7);
          overflow: hidden;
          max-height: 90vh;
          overflow-y: auto;
          box-sizing: border-box;
          animation: modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .wl-ambient-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 260px;
          height: 200px;
          background: radial-gradient(ellipse 65% 55% at 0% 0%, rgba(201, 139, 60, 0.14) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .wl-floating-plane {
          position: absolute;
          top: 14px;
          right: 56px;
          pointer-events: none;
          animation: planeFloat 3s ease-in-out infinite;
          z-index: 1;
        }

        .wl-close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 36px;
          height: 36px;
          min-height: 36px;
          border-radius: 50%;
          background: rgba(18, 33, 63, 0.06);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #12213F;
          transition: background 0.2s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 10;
        }

        .wl-close-btn:hover {
          background: rgba(18, 33, 63, 0.12);
          transform: rotate(90deg);
        }

        .wl-close-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(201, 139, 60, 0.35);
        }

        /* ── Typography & Header ── */
        .wl-title {
          font-family: var(--font-outfit), 'Outfit', sans-serif;
          font-size: clamp(23px, 2.8vw, 27px);
          font-weight: 700;
          color: #12213F;
          margin: 0 0 6px 0;
          letter-spacing: -0.025em;
          position: relative;
          z-index: 2;
        }

        .wl-subtitle {
          font-family: var(--font-jakarta), 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          color: #4B5563;
          margin: 0 0 16px 0;
          line-height: 1.5;
          position: relative;
          z-index: 2;
        }

        /* ── Progress Bar (Rule 6) ── */
        .wl-progress-bar {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
          margin-bottom: 22px;
          position: relative;
          z-index: 2;
        }

        .wl-progress-seg {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .wl-progress-track {
          width: 100%;
          height: 4px;
          background: rgba(227, 213, 188, 0.6);
          border-radius: 99px;
          overflow: hidden;
        }

        .wl-progress-fill {
          height: 100%;
          background: #C98B3C;
          border-radius: 99px;
          transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .wl-progress-text {
          font-family: var(--font-jakarta), 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: color 0.25s ease;
        }

        .wl-progress-seg.active .wl-progress-text {
          color: #C98B3C;
        }

        /* ── Form Fields Common ── */
        .wl-field-group {
          margin-bottom: 18px;
          position: relative;
          z-index: 2;
        }

        .wl-label {
          display: block;
          font-family: var(--font-jakarta), 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #4B5563;
          margin-bottom: 8px;
          transition: color 0.2s ease;
        }

        .wl-label.focused {
          color: #12213F;
        }

        /* ── Email Input (Rule 2) ── */
        .wl-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .wl-input-wrapper.has-error {
          animation: inputShake 0.3s ease-in-out;
        }

        .wl-mail-icon {
          position: absolute;
          left: 16px;
          color: #3E6FB0;
          display: flex;
          align-items: center;
          pointer-events: none;
          transition: color 0.2s ease;
        }

        .wl-mail-icon.focused {
          color: #C98B3C;
        }

        .wl-input {
          width: 100%;
          height: 52px;
          min-height: 44px;
          padding-left: 44px;
          padding-right: 42px;
          border-radius: 14px;
          border: 1px solid #E3D5BC;
          background-color: #FFFFFF;
          font-family: var(--font-jakarta), 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          color: #12213F;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .wl-input:focus {
          border-color: #C98B3C;
          box-shadow: 0 0 0 4px rgba(201, 139, 60, 0.18);
        }

        .wl-input-wrapper.has-error .wl-input {
          border: 1.5px solid #C0453A;
        }

        .wl-email-valid-icon {
          position: absolute;
          right: 14px;
          display: flex;
          align-items: center;
          animation: fadeIn 0.25s ease-out;
        }

        .wl-error-msg {
          margin: 6px 0 0;
          font-size: 12px;
          color: #C0453A;
          font-family: var(--font-jakarta), 'Plus Jakarta Sans', sans-serif;
          font-weight: 500;
        }

        /* ── Role Cards (Rule 1) ── */
        .wl-roles-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .wl-role-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          height: 54px;
          min-height: 44px;
          padding: 0 16px;
          border-radius: 14px;
          cursor: pointer;
          border: 1px solid #E3D5BC;
          background-color: #FFFFFF;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
          box-sizing: border-box;
          color: #12213F;
        }

        .wl-role-card:hover {
          border-color: #C98B3C;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(201, 139, 60, 0.12);
        }

        .wl-role-card.selected {
          background: linear-gradient(135deg, #12213F 0%, #1E3563 100%);
          border: 2px solid #C98B3C;
          color: #FFFFFF;
          box-shadow: 0 4px 16px rgba(18, 33, 63, 0.22);
        }

        .wl-role-card.pop {
          animation: rolePop 0.25s ease-out;
        }

        .wl-role-card:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(201, 139, 60, 0.35);
        }

        .wl-role-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #C98B3C;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: popBadge 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .wl-role-icon {
          color: #3E6FB0;
          flex-shrink: 0;
          transition: color 0.2s ease, transform 0.25s ease;
        }

        .wl-role-card.selected .wl-role-icon {
          color: #E8C48A;
        }

        .wl-plane-icon.tilted {
          transform: rotate(-10deg);
        }

        .wl-pin-icon.bouncing {
          animation: pinBounce 0.4s ease;
        }

        .wl-role-name {
          font-family: var(--font-jakarta), 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        /* ── Custom Dropdown (Rule 3) ── */
        .wl-dropdown-container {
          position: relative;
        }

        .wl-dropdown-trigger {
          width: 100%;
          height: 52px;
          min-height: 44px;
          padding: 0 16px;
          border-radius: 14px;
          border: 1px solid #E3D5BC;
          background-color: #FFFFFF;
          font-family: var(--font-jakarta), 'Plus Jakarta Sans', sans-serif;
          font-size: 14.5px;
          color: #12213F;
          outline: none;
          cursor: pointer;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          text-align: left;
        }

        .wl-dropdown-trigger:focus,
        .wl-dropdown-trigger.open {
          border-color: #C98B3C;
          box-shadow: 0 0 0 4px rgba(201, 139, 60, 0.18);
        }

        .wl-dropdown-trigger.has-error {
          border: 1.5px solid #C0453A;
          animation: inputShake 0.3s ease-in-out;
        }

        .wl-dropdown-placeholder {
          color: #6B7280;
        }

        .wl-dropdown-val {
          color: #12213F;
          font-weight: 500;
        }

        .wl-chevron {
          display: flex;
          align-items: center;
          color: #3E6FB0;
          transition: transform 0.25s ease, color 0.2s ease;
        }

        .wl-chevron.rotated {
          transform: rotate(180deg);
          color: #C98B3C;
        }

        .wl-dropdown-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #FFFFFF;
          border: 1px solid #E3D5BC;
          border-radius: 14px;
          box-shadow: 0 12px 32px rgba(18, 33, 63, 0.14);
          max-height: 220px;
          overflow-y: auto;
          margin: 0;
          padding: 6px;
          list-style: none;
          z-index: 50;
          animation: menuSlideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .wl-dropdown-item {
          padding: 10px 14px;
          border-radius: 8px;
          font-family: var(--font-jakarta), 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          color: #12213F;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .wl-dropdown-item:hover {
          background-color: #F6E7CC;
        }

        .wl-dropdown-item.selected {
          font-weight: 600;
          color: #12213F;
        }

        /* ── Consent Checkbox (Rule 4) ── */
        .wl-consent-label {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          user-select: none;
          min-height: 44px;
          padding-top: 4px;
        }

        .wl-custom-checkbox {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          border: 1.5px solid #E3D5BC;
          background-color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
          margin-top: 1px;
        }

        .wl-custom-checkbox.has-error {
          border-color: #C0453A;
        }

        .wl-custom-checkbox.checked {
          background-color: #12213F;
          border-color: #12213F;
        }

        .wl-consent-label:hover .wl-custom-checkbox:not(.checked) {
          border-color: #C98B3C;
        }

        .wl-check-stroke {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          transition: stroke-dashoffset 0.2s ease-out;
        }

        .wl-check-stroke.drawn {
          stroke-dashoffset: 0;
        }

        .wl-consent-text {
          font-family: var(--font-jakarta), 'Plus Jakarta Sans', sans-serif;
          font-size: 13.5px;
          color: #4B5563;
          line-height: 1.45;
        }

        /* ── Server Error ── */
        .wl-server-error {
          margin: 0 0 16px;
          padding: 10px 14px;
          border-radius: 10px;
          background: #FDF2F2;
          border: 1px solid rgba(192, 69, 58, 0.25);
          color: #C0453A;
          font-size: 13px;
          font-family: var(--font-jakarta), 'Plus Jakarta Sans', sans-serif;
        }

        /* ── Submit Button (Rule 5) ── */
        .wl-submit-btn {
          position: relative;
          width: 100%;
          height: 52px;
          min-height: 44px;
          border-radius: 9999px;
          background: linear-gradient(135deg, #12213F 0%, #1E3563 100%);
          color: #FFFFFF;
          font-size: 15px;
          font-weight: 600;
          font-family: var(--font-jakarta), 'Plus Jakarta Sans', sans-serif;
          border: none;
          cursor: pointer;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(18, 33, 63, 0.25);
          transition: opacity 0.25s ease, transform 0.15s ease, box-shadow 0.2s ease;
        }

        .wl-submit-btn:disabled {
          cursor: wait;
        }

        .wl-submit-btn.incomplete {
          opacity: 0.65;
        }

        .wl-submit-btn:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(18, 33, 63, 0.32);
        }

        .wl-submit-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .wl-submit-btn.pulse-ready {
          animation: btnPulse 0.6s ease;
        }

        .wl-submit-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(201, 139, 60, 0.45);
        }

        .wl-btn-shimmer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent 0%, rgba(232, 196, 138, 0.4) 50%, transparent 100%);
          transform: translateX(-100%);
          transition: transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
        }

        .wl-submit-btn:hover:not(:disabled) .wl-btn-shimmer {
          transform: translateX(100%);
        }

        .wl-btn-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .wl-btn-arrow {
          font-size: 18px;
          line-height: 1;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .wl-submit-btn:hover:not(:disabled) .wl-btn-arrow {
          transform: translateX(4px);
        }

        .wl-spinner {
          width: 20px;
          height: 20px;
          animation: spin 0.8s linear infinite;
        }

        /* ── Success State (Rule 8) ── */
        .wl-success-view {
          position: relative;
          text-align: center;
          padding: 24px 0 12px;
          animation: fadeIn 0.4s ease-out;
        }

        .wl-confetti-container {
          position: absolute;
          top: 30px;
          left: 50%;
          width: 0;
          height: 0;
          pointer-events: none;
        }

        .wl-confetti {
          position: absolute;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          opacity: 0;
          animation: confettiBurst 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .wl-confetti-0  { --tx: -55px;  --ty: -60px; }
        .wl-confetti-1  { --tx: -20px;  --ty: -80px; }
        .wl-confetti-2  { --tx: 25px;   --ty: -85px; }
        .wl-confetti-3  { --tx: 65px;   --ty: -65px; }
        .wl-confetti-4  { --tx: 85px;   --ty: -30px; }
        .wl-confetti-5  { --tx: 80px;   --ty: 15px; }
        .wl-confetti-6  { --tx: 60px;   --ty: 50px; }
        .wl-confetti-7  { --tx: 20px;   --ty: 70px; }
        .wl-confetti-8  { --tx: -25px;  --ty: 70px; }
        .wl-confetti-9  { --tx: -65px;  --ty: 45px; }
        .wl-confetti-10 { --tx: -85px;  --ty: 10px; }
        .wl-confetti-11 { --tx: -80px;  --ty: -30px; }
        .wl-confetti-12 { --tx: -40px;  --ty: -45px; }
        .wl-confetti-13 { --tx: 40px;   --ty: -45px; }
        .wl-confetti-14 { --tx: 45px;   --ty: 35px; }
        .wl-confetti-15 { --tx: -45px;  --ty: 35px; }

        .wl-success-badge {
          margin: 0 auto 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wl-draw-circle {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: drawStroke 0.6s ease-out forwards;
        }

        .wl-draw-check {
          stroke-dasharray: 45;
          stroke-dashoffset: 45;
          animation: drawStroke 0.4s ease-out 0.25s forwards;
        }

        .wl-success-title {
          font-family: var(--font-outfit), 'Outfit', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #12213F;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .wl-success-desc {
          font-family: var(--font-jakarta), 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          color: #4B5563;
          line-height: 1.6;
          margin-bottom: 24px;
          max-width: 360px;
          margin-inline: auto;
        }

        .wl-paper-plane-wrapper {
          width: 100%;
          height: 36px;
          position: relative;
          margin-bottom: 24px;
          overflow: hidden;
        }

        .wl-paper-plane {
          width: 24px;
          height: 24px;
          position: absolute;
          left: 0;
          top: 6px;
          animation: paperPlaneFlight 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .wl-duplicate-badge {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(62, 111, 176, 0.12);
          border: 2px solid #3E6FB0;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3E6FB0;
        }

        .wl-action-btn {
          height: 48px;
          min-height: 44px;
          padding: 0 36px;
          border-radius: 9999px;
          background: #12213F;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 600;
          font-family: var(--font-jakarta), 'Plus Jakarta Sans', sans-serif;
          border: none;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.15s ease;
        }

        .wl-action-btn:hover {
          background: #1E3563;
          transform: translateY(-1px);
        }

        .wl-sr-only {
          position: absolute;
          opacity: 0;
          pointer-events: none;
          height: 0;
          width: 0;
        }

        /* ── Animations (Keyframes) ── */
        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes planeFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes rolePop {
          0% { transform: scale(1); }
          30% { transform: scale(0.97); }
          70% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }

        @keyframes popBadge {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes pinBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes inputShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }

        @keyframes menuSlideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes btnPulse {
          0% { transform: scale(1); box-shadow: 0 4px 16px rgba(18, 33, 63, 0.25); }
          50% { transform: scale(1.02); box-shadow: 0 6px 24px rgba(201, 139, 60, 0.35); }
          100% { transform: scale(1); box-shadow: 0 4px 16px rgba(18, 33, 63, 0.25); }
        }

        @keyframes drawStroke {
          to { stroke-dashoffset: 0; }
        }

        @keyframes paperPlaneFlight {
          0% {
            opacity: 0;
            transform: translate(20px, 15px) rotate(-15deg);
          }
          30% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(320px, -20px) rotate(-35deg);
          }
        }

        @keyframes confettiBurst {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          80% {
            opacity: 0.9;
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) scale(0.4);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ── Mobile / Tablet (<=1023px) Responsive Modal ── */
        @media (max-width: 1023px) {
          .wl-overlay {
            padding: 20px;
            overscroll-behavior: contain;
          }

          .wl-modal {
            max-width: 540px;
            max-height: 92vh;
            max-height: 92dvh;
            padding: 32px 32px calc(32px + env(safe-area-inset-bottom, 0px));
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
          }

          .wl-close-btn {
            top: 14px;
            right: 14px;
            width: 44px;
            height: 44px;
            min-height: 44px;
            background: rgba(18, 33, 63, 0.08);
          }

          .wl-title {
            font-size: clamp(22px, 5.4vw, 28px);
            line-height: 1.2;
            padding-right: 52px;
          }

          .wl-subtitle {
            font-size: 15px;
            margin-bottom: 18px;
          }

          .wl-floating-plane {
            top: 8px;
            right: 66px;
          }

          .wl-input {
            height: 54px;
            font-size: 16px;
          }

          .wl-role-card {
            height: 56px;
            min-height: 48px;
          }

          .wl-role-name {
            font-size: 15px;
          }

          .wl-dropdown-trigger {
            height: 54px;
            font-size: 16px;
          }

          .wl-dropdown-menu {
            position: relative;
            top: auto;
            left: auto;
            right: auto;
            margin-top: 8px;
            max-height: 232px;
            -webkit-overflow-scrolling: touch;
          }

          .wl-dropdown-item {
            box-sizing: border-box;
            min-height: 48px;
            padding: 12px 14px;
            font-size: 15px;
          }

          .wl-consent-label {
            min-height: 44px;
            align-items: center;
            padding: 4px 0;
          }

          .wl-consent-text {
            font-size: 14px;
          }

          .wl-submit-btn {
            min-height: 54px;
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .wl-overlay {
            padding: 12px;
          }

          .wl-modal {
            padding: 24px 18px calc(24px + env(safe-area-inset-bottom, 0px));
            border-radius: 20px;
          }

          .wl-roles-grid {
            gap: 8px;
          }
        }

        /* ── Prefers-reduced-motion (Rule 9) ── */
        @media (prefers-reduced-motion: reduce) {
          .wl-overlay,
          .wl-modal,
          .wl-floating-plane,
          .wl-role-card,
          .wl-role-badge,
          .wl-pin-icon,
          .wl-input-wrapper,
          .wl-dropdown-menu,
          .wl-submit-btn,
          .wl-btn-shimmer,
          .wl-btn-arrow,
          .wl-spinner,
          .wl-confetti,
          .wl-draw-circle,
          .wl-draw-check,
          .wl-paper-plane {
            animation: none !important;
            transition: none !important;
          }

          .wl-draw-circle,
          .wl-draw-check {
            stroke-dashoffset: 0 !important;
          }

          .wl-check-stroke {
            stroke-dashoffset: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
