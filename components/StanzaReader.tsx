'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/scroll';
import type { LayoutInfo, WordEvent } from './HandwritingText';
import Passage from './Passage';

export type StanzaReaderProps = {
  /** The whole stanza. Each line of it is read on its own. */
  text: string;
  /** Typeset the lines, without writing any of them yet. */
  ready?: boolean;
  start?: boolean;
  /** Extra seconds a line is held after it is written, before it dissolves. */
  holds?: Record<number, number>;
  /** Line indices written more slowly than the rest. */
  emphasisLines?: number[];
  size?: number;
  minSize?: number;
  speed?: number;
  align?: 'left' | 'center';
  paper?: boolean;
  className?: string;
  onWordStart?: (event: WordEvent) => void;
  onLineEnd?: (lineIndex: number) => void;
  onLayout?: (info: LayoutInfo, lineIndex: number) => void;
  onComplete?: () => void;
};

/** The beat every line is given after the pen leaves it. */
const HOLD = 0.95;
/** How long a finished line takes to go. */
const FADE = 0.95;
/** And how long the dark lasts before the next one starts. */
const GAP = 0.3;

/**
 * A stanza read the way it would be spoken: one line at a time.
 *
 * Every line is mounted from the start, stacked in a single grid cell so they
 * all occupy the same place on screen, and written in turn. A finished line is
 * held long enough to land, lifts slightly, and is gone before the next one
 * begins — except the last, which stays.
 *
 * Mounting them all up front matters: it means every line has been measured
 * before any of it is needed, so nothing reflows mid-stanza and a cue can ask
 * where a word on a later line is going to be.
 */
export default function StanzaReader({
  text,
  ready = true,
  start = false,
  holds,
  emphasisLines,
  size,
  minSize,
  speed,
  align,
  paper,
  className,
  onWordStart,
  onLineEnd,
  onLayout,
  onComplete,
}: StanzaReaderProps) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(-1);

  const handlers = useRef({ onLineEnd, onComplete });
  handlers.current = { onLineEnd, onComplete };

  useEffect(() => {
    if (start) setActive((current) => (current < 0 ? 0 : current));
  }, [start]);

  // Whatever is mid-dissolve when this goes away.
  const running = useRef<gsap.core.Timeline[]>([]);
  useEffect(
    () => () => {
      running.current.forEach((timeline) => timeline.kill());
      running.current = [];
    },
    [],
  );

  const finishLine = (index: number) => {
    handlers.current.onLineEnd?.(index);
    const hold = HOLD + (holds?.[index] ?? 0);

    if (index === lines.length - 1) {
      // The last line of a stanza is the one you are left with.
      gsap.delayedCall(hold, () => handlers.current.onComplete?.());
      return;
    }

    const node = lineRefs.current[index];
    if (!node) return;

    const timeline = gsap
      .timeline({ delay: hold })
      .to(node, { opacity: 0, y: -18, duration: FADE, ease: 'power2.inOut' })
      .call(() => setActive((current) => Math.max(current, index + 1)), [], `+=${GAP}`);
    running.current.push(timeline);
  };

  return (
    <div className={['stanza', className].filter(Boolean).join(' ')}>
      {lines.map((line, index) => (
        <div
          key={index}
          className="stanza__line"
          ref={(node) => {
            lineRefs.current[index] = node;
          }}
        >
          <Passage
            text={line}
            // Sized to the stanza, so the hand does not change between lines.
            fitTo={text}
            size={size}
            minSize={minSize}
            ready={ready}
            speed={speed}
            align={align}
            paper={paper}
            start={index <= active}
            emphasisLines={emphasisLines?.includes(index) ? [0] : undefined}
            onLayout={(info) => onLayout?.(info, index)}
            // Each line is written on its own, so put its place in the stanza
            // back into the event before anything downstream sees it.
            onWordStart={(event) =>
              onWordStart?.({
                ...event,
                word: { ...event.word, sourceLineIndex: index },
              })
            }
            onComplete={() => finishLine(index)}
          />
        </div>
      ))}
    </div>
  );
}
