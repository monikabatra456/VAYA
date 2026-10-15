'use client';
import { useRef, useEffect } from 'react';
import { PROBLEM_PAIRS } from '../lib/content';

// Scatter positions: each card gets a deterministic transform so the layout
// feels organic. Positions are % offsets within each column half.
const LEFT_POSITIONS = [
  { top: '8%',  left: '5%',  w: 260, rotate: -1.5 },
  { top: '22%', left: '42%', w: 240, rotate: 1.2  },
  { top: '38%', left: '8%',  w: 280, rotate: -0.8 },
  { top: '52%', left: '38%', w: 230, rotate: 1.8  },
  { top: '66%', left: '6%',  w: 255, rotate: -1.1 },
  { top: '78%', left: '36%', w: 265, rotate: 0.7  },
];

const RIGHT_POSITIONS = [
  { top: '5%',  left: '8%',  w: 265, rotate: 1.0  },
  { top: '20%', left: '40%', w: 250, rotate: -1.5 },
  { top: '36%', left: '6%',  w: 280, rotate: 0.9  },
  { top: '50%', left: '36%', w: 240, rotate: -1.8 },
  { top: '63%', left: '4%',  w: 270, rotate: 1.4  },
  { top: '76%', left: '38%', w: 250, rotate: -0.6 },
];

export default function Problems() {
  const sectionRef = useRef(null);
  const leftCardsRef = useRef([]);
  const rightCardsRef = useRef([]);

  // Pop-out on pointer enter, return on leave
  const handleCardEnter = (e) => {
    const card = e.currentTarget;
    card.style.transform = `${card.dataset.baseTransform} scale(1.06) translateY(-6px)`;
    card.style.zIndex = '10';
    card.style.boxShadow = card.dataset.side === 'left'
      ? '0 24px 60px rgba(37,32,95,0.18), 0 8px 20px rgba(37,32,95,0.1)'
      : '0 24px 60px rgba(29,111,181,0.22), 0 8px 20px rgba(245,199,126,0.15)';
  };

  const handleCardLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = card.dataset.baseTransform;
    card.style.zIndex = card.dataset.zIndex;
    card.style.boxShadow = '';
  };

  // Fade cards in with IntersectionObserver
  useEffect(() => {
    const allCards = [
      ...leftCardsRef.current,
      ...rightCardsRef.current,
    ].filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('card-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    allCards.forEach((card, i) => {
      card.style.transitionDelay = `${(i % 6) * 0.07}s`;
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="problems"
      className="problems-section"
      aria-label="The old way vs the VAYA way"
    >
      {/* ── Column headers ── */}
      <div className="problems-headers">
        <div className="col-header col-header-left">
          <div className="col-label-pill old-way-pill">The old way of travel</div>
        </div>
        <div className="glowing-divider" aria-hidden="true" />
        <div className="col-header col-header-right">
          <div className="col-label-pill vaya-pill">The VAYA way</div>
        </div>
      </div>

      {/* ── Card columns ── */}
      <div className="problems-columns">
        {/* LEFT: Old-way cards */}
        <div className="cards-col cards-col-left" aria-label="Old travel problems">
          {PROBLEM_PAIRS.map(({ oldWay }, i) => {
            const pos = LEFT_POSITIONS[i];
            const base = `rotate(${pos.rotate}deg) translateY(0px)`;
            const zIdx = 3 + (i % 3);
            return (
              <div
                key={i}
                ref={el => (leftCardsRef.current[i] = el)}
                className="problem-card old-card float-card"
                data-base-transform={base}
                data-z-index={zIdx}
                data-side="left"
                style={{
                  top: pos.top,
                  left: pos.left,
                  width: pos.w,
                  transform: base,
                  zIndex: zIdx,
                  animationDelay: `${i * 1.1}s`,
                }}
                onMouseEnter={handleCardEnter}
                onMouseLeave={handleCardLeave}
              >
                <span className="card-emoji" aria-hidden="true">{oldWay.emoji}</span>
                <h3 className="card-title">{oldWay.title}</h3>
                <p className="card-body">{oldWay.body}</p>
              </div>
            );
          })}
        </div>

        {/* DIVIDER */}
        <div className="col-divider" aria-hidden="true">
          <div className="col-divider-line" />
        </div>

        {/* RIGHT: VAYA-way cards */}
        <div className="cards-col cards-col-right" aria-label="VAYA solutions">
          {PROBLEM_PAIRS.map(({ vaya }, i) => {
            const pos = RIGHT_POSITIONS[i];
            const base = `rotate(${pos.rotate}deg) translateY(0px)`;
            const zIdx = 3 + (i % 3);
            return (
              <div
                key={i}
                ref={el => (rightCardsRef.current[i] = el)}
                className="problem-card vaya-card float-card"
                data-base-transform={base}
                data-z-index={zIdx}
                data-side="right"
                style={{
                  top: pos.top,
                  left: pos.left,
                  width: pos.w,
                  transform: base,
                  zIndex: zIdx,
                  animationDelay: `${i * 1.1 + 0.4}s`,
                }}
                onMouseEnter={handleCardEnter}
                onMouseLeave={handleCardLeave}
              >
                <span className="card-emoji" aria-hidden="true">{vaya.emoji}</span>
                <h3 className="card-title">{vaya.title}</h3>
                <p className="card-body">{vaya.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
