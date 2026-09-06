'use client';

import { useRef, type MutableRefObject } from 'react';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import { gsap } from '@/lib/scroll';
import Passage from './Passage';
import Scene from './Scene';

type PaperTransitionProps = {
  /** The last words written before the dark, left behind as an afterimage. */
  ghost: string;
  sectionRef: MutableRefObject<HTMLElement | null>;
};

/**
 * The dark between the two halves of the letter.
 *
 * The previous handwriting does not cut away; it stays a moment as an
 * afterimage, the way a bright thing does when you close your eyes.
 */
export default function PaperTransition({ ghost, sectionRef }: PaperTransitionProps) {
  const ghostRef = useRef<HTMLDivElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const node = ghostRef.current;
    const section = sectionRef.current;
    if (!node || !section) return;

    const ctx = gsap.context(() => {
      // Held while the passage settles into the middle of the screen, then
      // let go: the afterimage has to be seen before it can fade.
      gsap.fromTo(
        node,
        { opacity: 0.2 },
        {
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `top top-=${window.innerHeight * 0.6}`,
            scrub: 1,
          },
        },
      );
    }, section);

    return () => ctx.revert();
  }, [sectionRef]);

  return (
    <Scene scroll={2.2} fadeOut={false} sectionRef={sectionRef} id="transition">
      <div ref={ghostRef} className="ghost">
        <Passage text={ghost} align="center" size={26} staticInk glow={false} />
      </div>
    </Scene>
  );
}
