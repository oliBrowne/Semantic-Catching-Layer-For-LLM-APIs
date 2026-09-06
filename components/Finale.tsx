'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import { ALL_LINES, FINAL_LINE } from '@/content/letter';
import Passage from './Passage';

const LINES = [...ALL_LINES.split('\n'), FINAL_LINE];

/** How far apart the hands start, in seconds. */
const CASCADE = 0.34;

/**
 * The whole letter, all at once.
 *
 * Every line the reader has already watched written and watched leave comes
 * back, and this time none of them leave: twenty hands starting a third of a
 * second apart, cascading down the page until the poem is standing there
 * complete, which is the one thing the piece has never shown.
 */
export default function Finale({ on }: { on: boolean }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [writing, setWriting] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    gsap.to(host, {
      opacity: on ? 1 : 0,
      duration: on ? 2 : 1,
      ease: 'power2.out',
      onStart: () => {
        if (on) setWriting(true);
      },
    });
  }, [on]);

  return (
    <div ref={hostRef} className="finale" style={{ opacity: 0 }}>
      {LINES.map((line, index) => (
        <FinaleLine key={index} text={line} delay={index * CASCADE} start={writing} />
      ))}
    </div>
  );
}

/** One line, arriving slightly from below and settling as it is written. */
function FinaleLine({ text, delay, start }: { text: string; delay: number; start: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node || !start) return;
    const tween = gsap.fromTo(
      node,
      { y: 12, opacity: 0.25 },
      { y: 0, opacity: 1, duration: 1.6, delay, ease: 'power2.out' },
    );
    return () => {
      tween.kill();
    };
  }, [start, delay]);

  return (
    <div ref={ref} className="finale__line" style={{ opacity: 0 }}>
      <Passage
        text={text}
        fitTo={ALL_LINES}
        size={15}
        minSize={11}
        speed={620}
        lineHeight={132}
        delay={delay}
        ready={start}
        start={start}
        glow={false}
      />
    </div>
  );
}
