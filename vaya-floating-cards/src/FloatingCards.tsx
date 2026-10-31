'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { FloatingCardsEngine } from './floatingCardsEngine';
import './floating-cards.css';

export type ProblemCard = {
  id: string;
  title: string;
  desc: string;
  icon: ReactNode;
  cta?: string; // default "How VAYA helps you • Tap to see"
};

type Props = {
  /** IMPORTANT: keep this order alternating left / right column: L, R, L, R, L, R */
  cards: ProblemCard[];
  onOpen: (id: string) => void; // opens the existing "How VAYA helps" popup
  className?: string;
};

const PLANE = (
  <svg viewBox="0 0 32 32" aria-hidden="true">
    {/* paper plane pointing to +x */}
    <path d="M30 16 3 4l5 12L3 28z" fill="#f08a2c" />
    <path d="M30 16 8 16 3 28z" fill="#d9731a" />
  </svg>
);

export default function FloatingCards({ cards, onOpen, className }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)');
    if (mobile.matches) return; // CSS shows a simple list
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const engine = new FloatingCardsEngine({
      stage: stageRef.current!,
      svg: svgRef.current!,
      plane: planeRef.current!,
      cards: cardRefs.current.filter(Boolean) as HTMLElement[],
      reducedMotion: reduced,
    });
    return () => engine.destroy();
  }, [cards.length]);

  return (
    <div ref={stageRef} className={`fc-stage ${className ?? ''}`}>
      <svg ref={svgRef} className="fc-lines" aria-hidden="true">
        {cards.map((c) => (
          <path key={c.id} className="fc-spoke" />
        ))}
      </svg>

      <div ref={planeRef} className="fc-plane">
        {PLANE}
      </div>

      {cards.map((c, i) => (
        <button
          key={c.id}
          ref={(el) => {
            cardRefs.current[i] = el;
          }}
          type="button"
          className="fc-card"
          data-depth={[1, 2, 0, 1, 0, 2][i % 6]}
          aria-label={`${c.title}. ${c.desc}`}
          onClick={() => onOpen(c.id)}
        >
          <span className="fc-glow" aria-hidden="true" />
          <span className="fc-face">
            <span className="fc-icon">{c.icon}</span>
            <span className="fc-body">
              <span className="fc-title">{c.title}</span>
              <span className="fc-desc">{c.desc}</span>
              <span className="fc-pill">✦ {c.cta ?? 'How VAYA helps you • Tap to see'}</span>
            </span>
            <span className="fc-go" aria-hidden="true">↗</span>
          </span>
        </button>
      ))}
    </div>
  );
}
