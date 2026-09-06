'use client';

import { useEffect, useRef, useState } from 'react';
// Deliberately gsap itself, not lib/scroll: the opening has no scroll
// behaviour, and importing from there would pull ScrollTrigger in with it.
import gsap from 'gsap';
import { OPENING } from '@/content/letter';
import Passage from './Passage';
import SoundControl from './SoundControl';

/**
 * Black, for long enough that it stops feeling like a loading screen and
 * starts feeling like a room with the lights off. Then a hand starts writing.
 */
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

export default function IntroScene() {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const beaconRef = useRef<HTMLDivElement | null>(null);
  const [secondLine, setSecondLine] = useState(false);
  const [done, setDone] = useState(false);
  const [beat] = useState(openingBeat);

  useEffect(() => {
    if (!done) return;
    const inner = innerRef.current;
    const beacon = beaconRef.current;
    if (!inner || !beacon) return;

    const tl = gsap.timeline({ delay: 1.5 });
    tl.to(inner, { opacity: 0, duration: 2.6, ease: 'power2.inOut' });
    tl.fromTo(
      beacon,
      { opacity: 0 },
      { opacity: 1, duration: 2.2, ease: 'power2.out' },
      '-=1.4',
    );
    return () => {
      tl.kill();
    };
  }, [done]);

  // The beacon has done its job the moment the letter is being read.
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 40 && beaconRef.current) {
        gsap.to(beaconRef.current, { opacity: 0, duration: 1.1, ease: 'power2.out' });
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="scene intro" style={{ '--scene-scroll': 1.9 } as React.CSSProperties}>
      <div className="scene__stage">
        <div className="intro__sound">
          <SoundControl />
        </div>

        <div ref={innerRef} className="intro__inner">
          <Passage
            text={OPENING.first}
            align="center"
            size={40}
            speed={430}
            delay={beat}
            slant={7}
            start
            onComplete={() => setSecondLine(true)}
          />
          <Passage
            text={OPENING.second}
            align="center"
            size={19}
            speed={880}
            delay={1.0}
            lineHeight={165}
            pauseAfterLine={{ 0: 0.5 }}
            start={secondLine}
            onComplete={() => setDone(true)}
            className="intro__second"
          />
        </div>

        <div ref={beaconRef} className="intro__beacon" aria-hidden="true">
          <span className="intro__beacon-dot" />
        </div>
      </div>
    </section>
  );
}
