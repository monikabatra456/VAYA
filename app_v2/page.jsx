'use client';
import { useState } from 'react';
import Header from '../components/Header';
import HeroScroll from '../components/HeroScroll';
import WaitlistModal from '../components/WaitlistModal';

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Header onWaitlist={() => setShowModal(true)} />
      <main>
        <HeroScroll onWaitlist={() => setShowModal(true)} />

        {/* ── Below-the-fold sections ───────────────────────── */}
        <section id="problem" className="content-section" aria-label="The problem">
          <div className="container">
            <h2>Travel is broken.</h2>
            <p>
              Overtourism, unpredictable crowds, no honest local insight. Hours wasted on outdated blogs and biased reviews.
            </p>
          </div>
        </section>

        <section id="how" className="content-section content-section--alt" aria-label="How VAYA works">
          <div className="container">
            <h2>How VAYA works</h2>
            <p>
              VAYA estimates how crowded a destination will be on your dates, recommends less-crowded alternatives and best times to visit, and connects travellers with local guides and local reviews.
            </p>
          </div>
        </section>

        <section id="features" className="content-section" aria-label="Features">
          <div className="container">
            <h2>What you get</h2>
            <div className="feature-grid">
              {[
                {
                  icon: '📍',
                  title: 'Crowd forecasts',
                  body: 'Estimated crowd levels for your dates and destination, so you can choose wisely.',
                },
                {
                  icon: '🗺️',
                  title: 'Smart alternatives',
                  body: 'Similar destinations that are quieter, closer, or better priced for your window.',
                },
                {
                  icon: '🧭',
                  title: 'Best-time guidance',
                  body: 'The weeks and seasons where your experience is likely to be at its best.',
                },
                {
                  icon: '🤝',
                  title: 'Local guides',
                  body: "Verified locals who show you the version of a place you won't find on a tour bus.",
                },
              ].map((f) => (
                <div key={f.title} className="feature-card">
                  <span className="feature-icon">{f.icon}</span>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="guides" className="content-section content-section--alt" aria-label="Local guides">
          <div className="container">
            <h2>Become a local guide</h2>
            <p>
              Live somewhere amazing? Share your knowledge, set your own hours, and earn by showing travellers the real side of your home.
            </p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              Apply as a guide →
            </button>
          </div>
        </section>

        <section id="community" className="content-section" aria-label="Community">
          <div className="container">
            <h2>Join the VAYA community</h2>
            <p>
              A space for travellers who care about going better — not just going everywhere.
            </p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              Join waitlist →
            </button>
          </div>
        </section>

        <footer className="site-footer" role="contentinfo">
          <div className="container footer-inner">
            <span>© 2026 VAYA. All rights reserved.</span>
            <nav aria-label="Footer links">
              <a href="#problem">About</a>
              <a href="#features">Features</a>
              <a href="#guides">Guides</a>
              <a href="/privacy" aria-label="Privacy policy">Privacy</a>
            </nav>
          </div>
        </footer>
      </main>

      {showModal && <WaitlistModal onClose={() => setShowModal(false)} />}
    </>
  );
}
