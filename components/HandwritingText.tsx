'use client';

import { useId, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { layoutText, naturalWidth, type LaidOutWord } from '@/lib/handwriting/layout';
import { createRng, hashString, range } from '@/lib/rng';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import type { WordTiming } from '@/lib/voice';
import { usePerformanceTier } from '@/lib/usePerformanceTier';

export type LayoutInfo = {
  words: LaidOutWord[];
  /** Where a word sits in the viewport, once it has been laid out. */
  pointOf: (word: LaidOutWord) => { x: number; y: number } | null;
};

export type WordEvent = {
  word: LaidOutWord;
  /** Centre of the word in viewport coordinates, for aiming atmosphere at it. */
  point: { x: number; y: number } | null;
};

export type HandwritingTextProps = {
  text: string;
  /** Height of one em, in pixels. Treated as a maximum when `fit` is on. */
  size?: number;
  /**
   * Shrink the hand until the longest written line fits the column, so the
   * passage keeps its own line breaks rather than the browser's.
   */
  fit?: boolean;
  /** The point below which shrinking stops and lines are allowed to wrap. */
  minSize?: number;
  /**
   * Measure this when choosing the type size, but write `text`.
   *
   * A stanza read one line at a time still has to be written in one hand: every
   * line is sized to the longest line of the whole stanza, not to itself.
   */
  fitTo?: string;
  align?: 'left' | 'center';
  /** Design units of pen travel per second. Lower is more deliberate. */
  speed?: number;
  /** Seconds to wait after `start` before the nib touches down. */
  delay?: number;
  /** Extra seconds held after the last word of a given source line. */
  pauseAfterLine?: Record<number, number>;
  /** Source line indices written more slowly than the rest. */
  emphasisLines?: number[];
  /**
   * When there is a reading to follow, one span per word, in seconds from the
   * start of the passage. The pen stops keeping its own time and keeps the
   * reader's instead: a word begins when it is spoken and is given exactly as
   * long as it took to say.
   */
  times?: WordTiming[];
  lineHeight?: number;
  letterSpacing?: number;
  slant?: number;
  jitter?: number;
  strokeWidth?: number;
  className?: string;
  /**
   * Whether to typeset at all. Building the paths is the expensive part, so a
   * passage far down the page can hold off until it is nearly needed.
   */
  ready?: boolean;
  /** Nothing is written until this turns true. */
  start?: boolean;
  /**
   * Build the writing paused and hand the timeline over, so scroll can drive
   * the pen instead of a clock.
   */
  scrub?: boolean;
  onTimeline?: (timeline: gsap.core.Timeline) => void;
  /** Render the passage already written, for ghosts and echoes. */
  staticInk?: boolean;
  glow?: boolean;
  onWordStart?: (event: WordEvent) => void;
  onWordEnd?: (event: WordEvent) => void;
  onLineEnd?: (sourceLineIndex: number) => void;
  onComplete?: () => void;
  /** Fires once the passage has been measured, before a mark is made. */
  onLayout?: (info: LayoutInfo) => void;
  /** Fires as each stroke begins, with its duration. Drives the pen sound. */
  onStrokeRef?: React.MutableRefObject<((duration: number) => void) | null>;
};

export default function HandwritingText({
  text,
  size = 30,
  fit = true,
  minSize = 17,
  fitTo,
  align = 'left',
  speed = 640,
  delay = 0,
  pauseAfterLine,
  emphasisLines,
  times,
  lineHeight = 152,
  letterSpacing = 5,
  slant = 8,
  jitter = 1,
  strokeWidth = 4.9,
  className,
  ready = true,
  start = false,
  scrub = false,
  onTimeline,
  staticInk = false,
  glow = true,
  onWordStart,
  onWordEnd,
  onLineEnd,
  onComplete,
  onLayout,
  onStrokeRef,
}: HandwritingTextProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [width, setWidth] = useState(0);
  const tier = usePerformanceTier();

  // Latest callbacks, so the timeline never has to be rebuilt to pick them up.
  const handlers = useRef({ onWordStart, onWordEnd, onLineEnd, onComplete, onLayout, onTimeline });
  handlers.current = { onWordStart, onWordEnd, onLineEnd, onComplete, onLayout, onTimeline };

  const nibRef = useRef<SVGCircleElement | null>(null);
  const nibGradientId = `nib-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  useIsomorphicLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () => setWidth(host.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(() => {
    if (width === 0 || !ready) return null;

    // A hand adjusts its size to the paper. On a phone `size` is the ceiling;
    // on a wider column the writing is allowed to grow with it, up to a point,
    // so the desktop reading does not become a postage stamp of type.
    const ceiling = Math.max(size, Math.min(size * 1.6, width / 15));
    const natural = naturalWidth(fitTo ?? text, letterSpacing) * 1.03;
    // Shrink until the longest line fits, and only once that would stop being
    // legible, let it wrap.
    const scale =
      fit && natural > 0
        ? Math.max(minSize, Math.min(ceiling, (width / natural) * 100))
        : size;

    return layoutText(text, {
      // The column is measured in ems so the writing scales with the type.
      maxWidth: (width / scale) * 100,
      lineHeight,
      letterSpacing,
      slant,
      jitter,
      align,
      seed: text,
    });
  }, [text, fitTo, ready, width, size, fit, minSize, lineHeight, letterSpacing, slant, jitter, align]);

  // Resolved fresh on every call: a word's place on screen depends on where
  // the sticky stage happens to be at the moment something asks.
  const pointOf = useRef<(word: LaidOutWord) => { x: number; y: number } | null>(() => null);
  pointOf.current = (word: LaidOutWord) => {
    const node = svgRef.current;
    if (!node || !layout) return null;
    const rect = node.getBoundingClientRect();
    if (rect.width === 0) return null;
    const [vx, vy, vw, vh] = layout.viewBox.split(' ').map(Number);
    return {
      x: rect.left + ((word.bounds.x + word.bounds.width / 2 - vx) / vw) * rect.width,
      y: rect.top + ((word.bounds.y + word.bounds.height / 2 - vy) / vh) * rect.height,
    };
  };

  useIsomorphicLayoutEffect(() => {
    if (!layout) return;
    handlers.current.onLayout?.({
      words: layout.words,
      pointOf: (word) => pointOf.current(word),
    });
  }, [layout]);

  useIsomorphicLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || !layout) return;

    if (staticInk) {
      gsap.set(svg.querySelectorAll('path'), { strokeDashoffset: 0 });
      gsap.set(svg.querySelectorAll('[data-word]'), { opacity: 0.95 });
      return;
    }

    if (!start && !scrub) return;

    const groups = Array.from(svg.querySelectorAll<SVGGElement>('[data-word]'));
    const reduced = tier.reducedMotion;

    const pointFor = (word: LaidOutWord) => pointOf.current(word);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        paused: scrub,
        onComplete: () => handlers.current.onComplete?.(),
      });

      if (reduced) {
        // No pen, no wobbleless compromise: the words simply arrive, in order.
        groups.forEach((group, index) => {
          const word = layout.words[index];
          const at = delay + index * 0.09;
          gsap.set(group.querySelectorAll('path'), { strokeDashoffset: 0 });
          tl.fromTo(
            group,
            { opacity: 0 },
            { opacity: 0.97, duration: 0.5, ease: 'power2.out' },
            at,
          );
          tl.call(() => handlers.current.onWordStart?.({ word, point: pointFor(word) }), [], at);
          tl.call(
            () => {
              handlers.current.onWordEnd?.({ word, point: pointFor(word) });
              if (word.endsSourceLine) handlers.current.onLineEnd?.(word.sourceLineIndex);
            },
            [],
            at + 0.5,
          );
        });
        // Reduced motion or not, scroll is still the playhead.
        if (scrub) handlers.current.onTimeline?.(tl);
        return;
      }

      const rng = createRng(hashString(`${text}::timing`));
      let cursor = scrub ? 0 : delay;
      const nib = nibRef.current;
      const firstWord = layout.words[0];

      if (nib && firstWord) {
        gsap.set(nib, {
          attr: {
            cx: firstWord.bounds.x + firstWord.bounds.width / 2,
            cy: firstWord.bounds.y + firstWord.bounds.height / 2,
          },
          opacity: 0,
        });
      }

      groups.forEach((group, index) => {
        const word = layout.words[index];
        const paths = Array.from(group.querySelectorAll<SVGPathElement>('path'));

        // Short words come off the hand quickly; long ones take their time.
        const emphasised = emphasisLines?.includes(word.sourceLineIndex) ?? false;
        const wordSpeed = speed * range(rng, 0.86, 1.16) * (emphasised ? 0.82 : 1);

        // Every stroke of the word, and the moment the nib lifts between them.
        const lifts = paths.map(() => range(rng, 0.012, 0.032));
        const natural = paths.map((_, strokeIndex) =>
          Math.max(0.045, (word.strokes[strokeIndex]?.length ?? 0) / wordSpeed),
        );

        // With a reading to follow, the word is moved to where it is spoken
        // and its strokes are stretched or hurried to fill exactly that long,
        // which is what puts the pen on the mouth rather than near it.
        const spoken = times?.[index];
        if (spoken) cursor = spoken.start;
        const ink = natural.reduce((a, b) => a + b, 0) + lifts.reduce((a, b) => a + b, 0);
        const pace = spoken ? Math.max(0.08, spoken.end - spoken.start) / Math.max(ink, 1e-4) : 1;
        const wordStart = cursor;

        tl.call(
          () => handlers.current.onWordStart?.({ word, point: pointFor(word) }),
          [],
          wordStart,
        );
        tl.set(group, { opacity: 0.87 }, wordStart);

        paths.forEach((path, strokeIndex) => {
          const duration = natural[strokeIndex] * pace;
          const at = cursor;
          tl.to(path, { strokeDashoffset: 0, duration, ease: 'none' }, at);
          tl.call(() => onStrokeRef?.current?.(duration), [], at);
          // The nib lifts between strokes of the same letter.
          cursor = at + duration + lifts[strokeIndex] * pace;
        });

        const wordEnd = cursor;

        // Ink pools where the pen rested, darkens, then settles as it dries.
        tl.to(group, { opacity: 1, duration: 0.16, ease: 'power1.out' }, wordEnd);
        tl.to(group, { opacity: 0.965, duration: 0.75, ease: 'power2.out' }, wordEnd + 0.16);

        if (nib && glow && tier.level !== 'low') {
          // A point of warm light carried along with the pen. Every part of it
          // is a tween, which is what lets the reader run the writing backwards
          // without leaving a bloom stranded on a word that is no longer there.
          tl.to(
            nib,
            {
              attr: {
                cx: word.bounds.x + word.bounds.width / 2,
                cy: word.bounds.y + word.bounds.height / 2,
              },
              duration: Math.max(0.05, wordEnd - wordStart),
              ease: 'none',
            },
            wordStart,
          );
          if (index === 0) tl.to(nib, { opacity: 1, duration: 0.25 }, wordStart);
          if (index === groups.length - 1) {
            tl.to(nib, { opacity: 0, duration: 0.5, ease: 'power2.out' }, wordEnd);
          }
        }

        tl.call(
          () => {
            handlers.current.onWordEnd?.({ word, point: pointFor(word) });
            if (word.endsSourceLine) handlers.current.onLineEnd?.(word.sourceLineIndex);
          },
          [],
          wordEnd,
        );

        cursor = wordEnd + (scrub ? 0.02 : range(rng, 0.07, 0.15));
        if (word.endsSourceLine) {
          cursor += scrub ? 0.1 : 0.34 + (pauseAfterLine?.[word.sourceLineIndex] ?? 0);
        }
      });
      if (scrub) handlers.current.onTimeline?.(tl);
    }, svg);

    return () => ctx.revert();
    // The timeline is a one-shot performance; only `start` may re-trigger it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, start, scrub, staticInk, times, tier.reducedMotion, tier.level]);

  return (
    <div ref={hostRef} className={className}>
      <span className="sr-only">{text}</span>
      {layout ? (
        <svg
          ref={svgRef}
          className="hand"
          viewBox={layout.viewBox}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          focusable="false"
        >
          {glow ? (
            <defs>
              <radialGradient id={nibGradientId}>
                <stop offset="0%" stopColor="rgb(255, 231, 193)" stopOpacity="0.5" />
                <stop offset="40%" stopColor="rgb(255, 216, 168)" stopOpacity="0.14" />
                <stop offset="100%" stopColor="rgb(255, 205, 150)" stopOpacity="0" />
              </radialGradient>
            </defs>
          ) : null}
          {glow ? (
            <circle
              ref={nibRef}
              className="hand__nib"
              // Explicit defaults: GSAP restores an attribute to what it found
              // on revert, and what it found on a circle without these was
              // nothing at all, which is not a valid length.
              cx={0}
              cy={0}
              r={52}
              fill={`url(#${nibGradientId})`}
              opacity={0}
            />
          ) : null}
          {layout.words.map((word) => (
            <g key={word.index} data-word={word.index} style={{ opacity: 0 }}>
              {word.strokes.map((stroke, strokeIndex) => (
                <path
                  key={strokeIndex}
                  className="hand__stroke"
                  d={stroke.d}
                  pathLength={1}
                  strokeWidth={strokeWidth * stroke.weight}
                  strokeOpacity={stroke.opacity}
                  style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
                />
              ))}
            </g>
          ))}
        </svg>
      ) : null}
    </div>
  );
}
