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
  /** IMPORTANT: RING order = cycle order: top-left, top-right, mid-right, bottom-right, bottom-left, mid-left */
  cards: ProblemCard[];
  onOpen: (id: string) => void; // opens the existing "How VAYA helps" popup
  ghosts?: number; // number of empty depth rectangles behind the cards (10–20), default 16
  plane?: boolean; // show the paper plane (default false). Without it the dotted route just lights up on every hop
  className?: string;
};

const PLANE = (
  <svg viewBox="0 0 32 32" aria-hidden="true">
    {/* paper plane pointing to +x */}
    <path d="M30 16 3 4l5 12L3 28z" fill="#f08a2c" />
    <path d="M30 16 8 16 3 28z" fill="#d9731a" />
  </svg>
);

export default function FloatingCards({ cards, onOpen, className, ghosts = 16, plane = false }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const ghostRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)');
    if (mobile.matches) return; // CSS shows a simple list
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const engine = new FloatingCardsEngine({
      stage: stageRef.current!,
      svg: svgRef.current!,
      plane: plane ? planeRef.current! : undefined,
      cards: cardRefs.current.filter(Boolean) as HTMLElement[],
      ghosts: ghostRefs.current.filter(Boolean) as HTMLElement[],
      reducedMotion: reduced,
    });
    return () => engine.destroy();
  }, [cards.length, ghosts, plane]);

  return (
    <div ref={stageRef} className={`fc-stage ${className ?? ''}`}>
      {Array.from({ length: ghosts }).map((_, i) => (
        <span key={i} ref={(el) => { ghostRefs.current[i] = el; }} className="fc-ghost" aria-hidden="true" />
      ))}

      <svg ref={svgRef} className="fc-lines" aria-hidden="true">
        {cards.map((c) => (
          <path key={c.id} className="fc-spoke" />
        ))}
      </svg>

      {plane && (
        <div ref={planeRef} className="fc-plane">
          {PLANE}
        </div>
      )}

      {cards.map((c, i) => (
        <button
          key={c.id}
          ref={(el) => {
            cardRefs.current[i] = el;
          }}
          type="button"
          className="fc-card"
          data-depth={[1, 2, 0, 1, 2, 0][i % 6]}
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
