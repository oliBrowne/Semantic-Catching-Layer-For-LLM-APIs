'use client';

import { useRef, type ReactNode } from 'react';
import { usePerformanceTier } from '@/lib/usePerformanceTier';
import gsap from 'gsap';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import type { CardSpec } from '@/content/letter';
import type { LayoutInfo, WordEvent } from './HandwritingText';
import Passage from './Passage';

/** The beat every card gets after its last word, before it can be let go of. */
export const HOLD = 1.15;
/** How long it takes to leave. */
export const FADE = 0.85;
/** And how much dark there is before the next one begins. */
export const GAP = 0.3;

export type CardProps = {
  spec: CardSpec;
  /** The letter is here now. Write. */
  active: boolean;
  /** Typeset ahead of time, without writing anything yet. */
  ready?: boolean;
  /** Called once the card has been written, held, and has left the frame. */
  onDone?: () => void;
  fitTo?: string;
  size?: number;
  minSize?: number;
  speed?: number;
  paper?: boolean;
  align?: 'left' | 'center';
  className?: string;
  children?: ReactNode;
  onWordStart?: (event: WordEvent) => void;
  onLineEnd?: (lineIndex: number) => void;
  onLayout?: (info: LayoutInfo) => void;
};

/**
 * Two or three lines of the letter.
 *
 * The card never moves down the page — nothing here does. It occupies the same
 * place in a frame fixed to the window, writes itself when the letter reaches
 * it, is held long enough to land, and lifts away.
 */
export default function Card({
  spec,
  active,
  ready = true,
  onDone,
  fitTo,
  size = 24,
  minSize = 19,
  speed = 1250,
  paper,
  align,
  className,
  children,
  onWordStart,
  onLineEnd,
  onLayout,
}: CardProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const finished = useRef(false);
  const tier = usePerformanceTier();
  const handlers = useRef({ onDone });
  handlers.current = { onDone };

  // Reset if the letter is ever played again from the top.
  useIsomorphicLayoutEffect(() => {
    if (active) finished.current = false;
  }, [active]);

  const onComplete = () => {
    if (finished.current) return;
    finished.current = true;
    const host = hostRef.current;
    if (!host) return;

    // Someone who has asked for less motion should not be held on a page they
    // cannot scroll for three and a half minutes. Same letter, same order,
    // markedly less waiting.
    const patience = tier.reducedMotion ? 0.4 : 1;

    gsap
      .timeline({ delay: (HOLD + (spec.linger ?? 0)) * patience })
      .to(host, { opacity: 0, y: -46, duration: FADE * patience, ease: 'power2.inOut' })
      .call(() => handlers.current.onDone?.(), [], `+=${GAP * patience}`);
  };

  return (
    <div
      ref={hostRef}
      className={['card', active ? 'card--live' : '', className ?? ''].filter(Boolean).join(' ')}
      data-cue={spec.id}
    >
      {children}
      <Passage
        text={spec.lines.join('\n')}
        fitTo={fitTo}
        size={size}
        minSize={minSize}
        speed={speed}
        paper={paper}
        align={align}
        ready={ready}
        start={active}
        onWordStart={onWordStart}
        onLineEnd={onLineEnd}
        onLayout={onLayout}
        onComplete={onComplete}
      />
    </div>
  );
}
