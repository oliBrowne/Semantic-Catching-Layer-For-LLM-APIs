'use client';

import { useRef, type ReactNode } from 'react';
import { usePerformanceTier } from '@/lib/usePerformanceTier';
import gsap from 'gsap';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import type { CardSpec } from '@/content/letter';
import type { WordTiming } from '@/lib/voice';
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
  /**
   * Whether this is the card the reader is on. Following a voice, `active`
   * stays true once a card has been written, so this is what marks the one
   * currently being said.
   */
  live?: boolean;
  /** Typeset ahead of time, without writing anything yet. */
  ready?: boolean;
  /**
   * When there is a reading to follow, one span per word. The card then writes
   * to the voice instead of to its own clock, and is told when to leave rather
   * than deciding for itself.
   */
  times?: WordTiming[];
  /** Go now. Only used when a reading is setting the pace. */
  leaving?: boolean;
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
  live,
  ready = true,
  times,
  leaving = false,
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

  const leave = (delay: number, patience: number) => {
    const host = hostRef.current;
    if (!host) return;
    gsap
      .timeline({ delay })
      .to(host, { opacity: 0, y: -46, duration: FADE * patience, ease: 'power2.inOut' })
      .call(() => handlers.current.onDone?.(), [], `+=${GAP * patience}`);
  };

  const onComplete = () => {
    // With a reading, the card is not finished when the pen is: it stays until
    // the voice has moved on, and `leaving` is what says so.
    if (times || finished.current) return;
    finished.current = true;

    // Someone who has asked for less motion should not be held on a page they
    // cannot scroll for three and a half minutes. Same letter, same order,
    // markedly less waiting.
    const patience = tier.reducedMotion ? 0.4 : 1;
    leave((HOLD + (spec.linger ?? 0)) * patience, patience);
  };

  useIsomorphicLayoutEffect(() => {
    if (!leaving || finished.current) return;
    finished.current = true;
    leave(0, 1);
    // `leave` reads only refs, so it does not need to be a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  return (
    <div
      ref={hostRef}
      className={['card', (live ?? active) ? 'card--live' : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
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
        times={times}
        onWordStart={onWordStart}
        onLineEnd={onLineEnd}
        onLayout={onLayout}
        onComplete={onComplete}
      />
    </div>
  );
}
