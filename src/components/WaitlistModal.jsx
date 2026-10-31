'use client';
import { useState, useCallback } from 'react';

// ─── Waitlist Modal ──────────────────────────────────────────────────────────
export default function WaitlistModal({ onClose }) {
  const [form, setForm] = useState({
    email: '',
    role: 'traveller',
    problem: '',
    consent: false,
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error

  const validate = () => {
    const e = {};
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Please enter a valid email.';
    if (!form.problem) e.problem = 'Please select your biggest travel challenge.';
    if (!form.consent) e.consent = 'Please accept to continue.';
    return e;
  };

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErrors((err) => ({ ...err, [name]: undefined }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setStatus('submitting');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'hero' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok || data.alreadyJoined) {
        setStatus('success');
      } else {
        throw new Error(data.error || 'server');
      }
    } catch {
      setStatus('error');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Join the VAYA waitlist"
      className="wl-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={handleKeyDown}
    >
      <div className="wl-modal" tabIndex={-1}>
        <button className="wl-close" onClick={onClose} aria-label="Close">✕</button>

        {status === 'success' ? (
          <div className="wl-success">
            <span className="wl-success-icon">✈</span>
            <h2>You're on the list.</h2>
            <p>Tighten your seat belts — we'll be in touch soon.</p>
            <button className="btn-primary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <h2 className="wl-title">Join the VAYA waitlist</h2>
            <p className="wl-subtitle">
              Be a co-creator. Shape how travellers discover the world smarter.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              {/* Honeypot field for bot prevention */}
              <input
                type="text"
                name="honeypot"
                value={form.honeypot || ''}
                onChange={handleChange}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <div className="wl-field">
                <label htmlFor="wl-email">Email</label>
                <input
                  id="wl-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-describedby={errors.email ? 'email-err' : undefined}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <span id="email-err" className="wl-error" role="alert">{errors.email}</span>}
              </div>

              <div className="wl-field">
                <label>I am a…</label>
                <div className="wl-radio-group" role="radiogroup">
                  {['traveller', 'local-guide'].map((r) => (
                    <label key={r} className={`wl-radio ${form.role === r ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="role"
                        value={r}
                        checked={form.role === r}
                        onChange={handleChange}
                      />
                      {r === 'traveller' ? 'Traveller' : 'Local guide'}
                    </label>
                  ))}
                </div>
              </div>

              <div className="wl-field">
                <label htmlFor="wl-problem">Biggest travel problem?</label>
                <select
                  id="wl-problem"
                  name="problem"
                  value={form.problem}
                  onChange={handleChange}
                  aria-invalid={!!errors.problem}
                  aria-describedby={errors.problem ? 'prob-err' : undefined}
                >
                  <option value="">Select one…</option>
                  <option value="crowds">Crowds</option>
                  <option value="prices">Prices</option>
                  <option value="safety">Safety</option>
                  <option value="planning">Planning</option>
                </select>
                {errors.problem && <span id="prob-err" className="wl-error" role="alert">{errors.problem}</span>}
              </div>

              <div className="wl-field wl-consent">
                <label>
                  <input
                    type="checkbox"
                    name="consent"
                    checked={form.consent}
                    onChange={handleChange}
                    aria-invalid={!!errors.consent}
                    aria-describedby={errors.consent ? 'consent-err' : undefined}
                  />
                  I agree to receive updates from VAYA.
                </label>
                {errors.consent && <span id="consent-err" className="wl-error" role="alert">{errors.consent}</span>}
              </div>

              {status === 'error' && (
                <p className="wl-error" role="alert" style={{ marginBottom: '0.5rem' }}>
                  Something went wrong. Please try again.
                </p>
              )}

              <button
                type="submit"
                className="btn-primary wl-submit"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Joining…' : 'Join waitlist →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
