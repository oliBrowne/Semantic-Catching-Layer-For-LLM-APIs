'use client';

import { useEffect, useRef, useState } from 'react';
// Deliberately gsap itself, not lib/scroll: the opening has no scroll
// behaviour, and importing from there would pull ScrollTrigger in with it.
import gsap from 'gsap';
import { OPENING } from '@/content/letter';
import { INTRO_SCROLL } from '@/lib/schedule';
import Passage from './Passage';
import SoundControl from './SoundControl';

/**
 * How long to hold the black before the first line.
 *
 * The beat is meant to be measured from the moment the screen appears, not
 * from whenever the script finishes parsing. On a slow phone over a slow
 * connection those are seconds apart, and adding another pause on top of that
 * wait is how a deliberate opening starts to look like a broken page.
 */
function openingBeat(): number {
  const FULL = 0.8;
  if (typeof performance === 'undefined') return FULL;
  const painted = performance
    .getEntriesByType('paint')
    .find((entry) => entry.name === 'first-paint')?.startTime;
  if (painted === undefined) return FULL;
  return Math.max(0.15, FULL - (performance.now() - painted) / 1000);
}

/**
 * Black, for long enough that it stops feeling like a loading screen and
 * starts feeling like a room with the lights off. Then a hand starts writing.
 *
 * This is the one part of the piece that is not on the scrollbar — it has to
 * come alive on its own, because at this point the reader has done nothing but
 * point a camera at a piece of paper.
 */
export default function IntroScene() {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const beaconRef = useRef<HTMLDivElement | null>(null);
  const [secondLine, setSecondLine] = useState(false);
  const [beat] = useState(openingBeat);

  // It hands over to the letter as soon as the reader starts moving.
  useEffect(() => {
    const inner = innerRef.current;
    const beacon = beaconRef.current;
    if (!inner) return;

    const onScroll = () => {
      const progress = Math.min(1, window.scrollY / (window.innerHeight * INTRO_SCROLL));
      gsap.set(inner, { opacity: 1 - Math.min(1, progress * 1.9), y: -progress * 40 });
      if (beacon) gsap.set(beacon, { opacity: 1 - Math.min(1, progress * 4) });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div className="intro__sound">
        <SoundControl />
      </div>

      <div ref={innerRef} className="card card--centre intro">
        <Passage
          text={OPENING.first}
          align="center"
          size={44}
          speed={600}
          delay={beat}
          slant={7}
          start
          onComplete={() => setSecondLine(true)}
        />
        <Passage
          text={OPENING.second}
          align="center"
          size={20}
          speed={1350}
          delay={1.0}
          lineHeight={165}
          pauseAfterLine={{ 0: 0.5 }}
          start={secondLine}
          className="intro__second"
        />
      </div>

      <div ref={beaconRef} className="intro__beacon" aria-hidden="true">
        <span className="intro__beacon-dot" />
      </div>
    </>
  );
}
