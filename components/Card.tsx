'use client';

import { useRef, useState, type ReactNode } from 'react';
import { gsap, ScrollTrigger } from '@/lib/scroll';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import type { Cue } from '@/lib/reel';
import type { LayoutInfo, WordEvent } from './HandwritingText';
import Passage from './Passage';

export type CardProps = {
  cue: Cue;
  /** Sized against the whole letter, so the hand never changes between cards. */
  fitTo?: string;
  size?: number;
  minSize?: number;
  paper?: boolean;
  align?: 'left' | 'center';
  wide?: boolean;
  className?: string;
  children?: ReactNode;
  onWordStart?: (event: WordEvent) => void;
  onLineEnd?: (lineIndex: number) => void;
  onLayout?: (info: LayoutInfo) => void;
};

/**
 * Two or three lines of the letter, written by the scrollbar.
 *
 * The card never moves down the page — nothing here does. It occupies the same
 * place in a frame that is fixed to the window, and scroll runs the pen across
 * it, forwards or backwards, at whatever speed the reader's thumb chooses.
 */
export default function Card({
  cue,
  fitTo,
  size = 24,
  minSize = 19,
  paper,
  align,
  wide,
  className,
  children,
  onWordStart,
  onLineEnd,
  onLayout,
}: CardProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [near, setNear] = useState(false);
  const [live, setLive] = useState(false);

  const text = cue.lines.join('\n');
  const vh = () => window.innerHeight;

  // Typesetting is expensive; a card a long way off does not do it yet.
  useIsomorphicLayoutEffect(() => {
    const trigger = ScrollTrigger.create({
      start: () => Math.max(0, vh() * (cue.at - 1.4)),
      end: () => vh() * (cue.at + cue.write + cue.hold + cue.exit),
      onToggle: (self) => {
        if (self.isActive) setNear(true);
        setLive(self.isActive);
      },
      onRefresh: (self) => {
        if (self.progress > 0) setNear(true);
      },
    });
    return () => trigger.kill();
  }, [cue.at, cue.write, cue.hold, cue.exit]);

  const onTimeline = (timeline: gsap.core.Timeline) => {
    const host = hostRef.current;
    if (!host) return;

    // The writing is the animation and the scrollbar is its playhead. Scrubbing
    // rather than playing is the whole difference between a page you scroll
    // past and a page you are moving through.
    ScrollTrigger.create({
      animation: timeline,
      start: () => vh() * cue.at,
      end: () => vh() * (cue.at + cue.write),
      scrub: 0.55,
      invalidateOnRefresh: true,
    });

    // And then it lets go, while the next card is already being written.
    gsap.fromTo(
      host,
      { opacity: 1, y: 0 },
      {
        opacity: 0,
        y: -54,
        ease: 'none',
        scrollTrigger: {
          start: () => vh() * (cue.at + cue.write + cue.hold),
          end: () => vh() * (cue.at + cue.write + cue.hold + cue.exit),
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      },
    );
  };

  return (
    <div
      ref={hostRef}
      className={[
        'card',
        wide ? 'card--wide' : '',
        live ? 'card--live' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-cue={cue.id}
    >
      {children}
      <Passage
        text={text}
        fitTo={fitTo}
        size={size}
        minSize={minSize}
        paper={paper}
        align={align}
        ready={near}
        scrub
        onTimeline={onTimeline}
        onWordStart={onWordStart}
        onLineEnd={onLineEnd}
        onLayout={onLayout}
      />
    </div>
  );
}
