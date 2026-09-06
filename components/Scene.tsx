'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import { gsap, ScrollTrigger } from '@/lib/scroll';

export type SceneProps = {
  children: ReactNode | ((state: { entered: boolean }) => ReactNode);
  /** How many viewport heights of scroll the passage is given. */
  scroll?: number;
  /** Where in the viewport the passage begins writing itself. */
  enterAt?: string;
  wide?: boolean;
  className?: string;
  /** Set false for passages that must not dissolve as they leave. */
  fadeOut?: boolean;
  id?: string;
  /** Lets a composer hang scroll-driven layers off this passage. */
  sectionRef?: React.MutableRefObject<HTMLElement | null>;
  /**
   * Rendered behind the passage and filling the whole stage, outside the
   * column and outside anything the scroll fades.
   */
  backdrop?: ReactNode;
};

/**
 * One passage of the letter.
 *
 * The stage is sticky rather than pinned: iOS Safari handles native sticky
 * far more gracefully than a scripted pin, which is what stops the layout
 * lurching when the browser chrome slides in and out.
 */
export default function Scene({
  children,
  scroll = 2.6,
  enterAt = 'top 65%',
  wide = false,
  className,
  fadeOut = true,
  id,
  sectionRef: externalRef,
  backdrop,
}: SceneProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [entered, setEntered] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const inner = innerRef.current;
    if (!section || !inner) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: enterAt,
        once: true,
        onEnter: () => setEntered(true),
      });

      // Rising into place as the passage arrives.
      gsap.fromTo(
        inner,
        { opacity: 0 },
        {
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'top 22%',
            scrub: 0.6,
          },
        },
      );

      if (fadeOut) {
        // Letting go: the passage lifts away rather than scrolling off.
        gsap.to(inner, {
          opacity: 0,
          y: -70,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'bottom bottom+=95%',
            end: 'bottom bottom',
            scrub: 0.7,
          },
        });
      }
    }, section);

    return () => ctx.revert();
  }, [enterAt, fadeOut]);

  return (
    <section
      ref={(node) => {
        sectionRef.current = node;
        if (externalRef) externalRef.current = node;
      }}
      id={id}
      className={`scene${className ? ` ${className}` : ''}`}
      style={{ '--scene-scroll': scroll } as React.CSSProperties}
    >
      <div className="scene__stage">
        {backdrop}
        <div ref={innerRef} className={`scene__inner${wide ? ' scene__inner--wide' : ''}`}>
          {typeof children === 'function' ? children({ entered }) : children}
        </div>
      </div>
    </section>
  );
}
