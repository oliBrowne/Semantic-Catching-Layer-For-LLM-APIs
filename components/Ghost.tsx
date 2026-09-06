'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import Passage from './Passage';

/**
 * The afterimage.
 *
 * The last words before the dark do not cut away; they hang for a moment the
 * way a bright thing does when you close your eyes, and are gone by the time
 * the paper underneath them starts to show.
 */
export default function Ghost({ text, on }: { text: string; on: boolean }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useIsomorphicLayoutEffect(() => {
    if (on) setReady(true);
  }, [on]);

  useIsomorphicLayoutEffect(() => {
    const host = hostRef.current;
    if (!host || !on) return;
    const tl = gsap
      .timeline()
      .fromTo(host, { opacity: 0 }, { opacity: 0.2, duration: 0.8, ease: 'none' })
      .to(host, { opacity: 0, duration: 3.4, ease: 'power2.in' }, '+=0.6');
    return () => {
      tl.kill();
    };
  }, [on]);

  return (
    <div ref={hostRef} className="card ghost" style={{ opacity: 0 }} aria-hidden="true">
      <Passage text={text} align="center" size={26} ready={ready} staticInk glow={false} />
    </div>
  );
}
