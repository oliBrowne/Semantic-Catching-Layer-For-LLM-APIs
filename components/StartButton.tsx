'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { RING } from '@/lib/font/marks';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import DrawnMark from './DrawnMark';
import Passage from './Passage';
import Vines from './Vines';
import { primeReading } from '@/lib/audio/reading';

/** How long the vines have the screen to themselves before the letter starts. */
const GROWING = 2.6;

/**
 * The way in.
 *
 * The letter needs a deliberate start for two reasons: the reader should
 * choose when it begins, and no browser will let a page make a sound until
 * someone has touched it. This is that touch, and it is the only thing on the
 * page that asks to be pressed.
 *
 * Pressing it grows vines out of it.
 */
export default function StartButton({
  show,
  onStart,
}: {
  show: boolean;
  onStart: () => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [pressed, setPressed] = useState(false);
  const begun = useRef(false);
  const handOver = useRef(onStart);
  handOver.current = onStart;

  useIsomorphicLayoutEffect(() => {
    const host = hostRef.current;
    if (!host || !show) return;
    const tween = gsap.fromTo(
      host,
      { opacity: 0, scale: 0.96 },
      { opacity: 1, scale: 1, duration: 2.2, ease: 'power2.out' },
    );
    return () => {
      tween.kill();
    };
  }, [show]);

  const press = () => {
    if (begun.current) return;
    begun.current = true;
    setPressed(true);

    // The vines take a couple of seconds to grow before the letter starts, but
    // this press is the only moment a browser will let a recording begin. So
    // it is spent now, silently, and the reading is held until it is wanted.
    primeReading();

    const host = hostRef.current;
    if (host) {
      // The word goes with the first of the vines, so what is left growing is
      // the vine rather than a button that has been pressed.
      gsap.to(host, { opacity: 0, duration: 1.1, delay: 0.45, ease: 'power2.inOut' });
    }
    gsap.delayedCall(GROWING, () => handOver.current());
  };

  if (!show) return null;

  return (
    <>
      <Vines on={pressed} />

      <div ref={hostRef} className="start" style={{ opacity: 0 }}>
        <button
          type="button"
          className="start__button"
          onClick={press}
          disabled={pressed}
          aria-label="Begin the letter"
        >
          <DrawnMark mark={RING} className="start__ring" start speed={260} strokeWidth={2.2} />
          <Passage text="begin" align="center" size={22} speed={620} start className="start__word" />
        </button>
      </div>
    </>
  );
}
