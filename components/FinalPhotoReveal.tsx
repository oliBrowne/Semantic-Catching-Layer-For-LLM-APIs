'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import { gsap, ScrollTrigger } from '@/lib/scroll';
import { FINAL_LINE, SIGNATURE } from '@/content/letter';
import { useAtmosphere } from '@/lib/particles/context';
import Passage from './Passage';
import Scene from './Scene';
import photograph from '@/public/photo.jpg';

/**
 * The end of the letter, and the only photograph in it.
 *
 * The picture does not appear; it develops. A single band of it shows through
 * behind the last sentence, and the rest arrives only if you keep going.
 */
export default function FinalPhotoReveal() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const photoRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);
  // Signing needs both things to be true: the reader has gone far enough, and
  // the sentence above is actually finished. Someone scrolling quickly must not
  // be handed the signature while the last line is still being written.
  const [scrolledToSign, setScrolledToSign] = useState(false);
  const [lineWritten, setLineWritten] = useState(false);
  const [signingName, setSigningName] = useState(false);
  const signing = scrolledToSign && lineWritten;
  const atmosphere = useAtmosphere();

  /** Everything stops when the last sentence lands. */
  const onLastLine = () => {
    setLineWritten(true);
    atmosphere.hold(1000 * 60 * 60);
    atmosphere.setDensity(0.04);
    gsap.to(document.documentElement, {
      '--dim': 0.34,
      duration: 6,
      ease: 'power2.inOut',
      delay: 1.2,
    });

    // The heart is written, held, and then let go of; the words stay.
    const heart = lineRef.current?.querySelectorAll('[data-word]');
    const last = heart?.[heart.length - 1];
    if (last) {
      gsap.to(last, { opacity: 0, duration: 4, ease: 'power2.inOut', delay: 5.5 });
    }
  };

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const photo = photoRef.current;
    const image = imageRef.current;
    if (!section || !photo || !image) return;

    const ctx = gsap.context(() => {
      const vh = () => window.innerHeight;

      // First a band, barely taller than the writing, showing through behind
      // the sentence.
      gsap.fromTo(
        photo,
        { '--band-open': 0 },
        {
          '--band-open': 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: () => `top top-=${vh() * 0.8}`,
            end: () => `top top-=${vh() * 1.35}`,
            scrub: 1,
          },
        },
      );

      // Then, only if the reader keeps going, the rest of the photograph.
      gsap.fromTo(
        photo,
        { '--band': 0 },
        {
          '--band': 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: () => `top top-=${vh() * 1.5}`,
            end: () => `top top-=${vh() * 3.3}`,
            scrub: 1,
          },
        },
      );

      // A drift so slow it registers as the room breathing, not a zoom.
      gsap.fromTo(
        image,
        { scale: 1 },
        {
          scale: 1.04,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: () => `top top-=${vh() * 0.9}`,
            end: 'bottom bottom',
            scrub: 1.4,
          },
        },
      );

      ScrollTrigger.create({
        trigger: section,
        start: () => `top top-=${vh() * 3.4}`,
        once: true,
        onEnter: () => setScrolledToSign(true),
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <Scene
      scroll={6.2}
      enterAt="top 58%"
      fadeOut={false}
      wide
      sectionRef={sectionRef}
      id="final"
      backdrop={
        <div ref={photoRef} className="final__photo" aria-hidden="true">
          <div ref={imageRef} className="final__frame">
            <Image
              src={photograph}
              alt=""
              className="final__image"
              sizes="100vw"
              placeholder="blur"
              priority={false}
            />
          </div>
          <div className="final__warmth" />
          <div className="final__grain" />
          <div className="final__vignette" />
        </div>
      }
    >
      {({ entered }) => (
        <div className="final__content">
          <div ref={lineRef} className="final__line">
            <Passage
              text={FINAL_LINE}
              align="center"
              size={27}
              speed={560}
              start={entered}
              slant={7}
              onComplete={onLastLine}
            />
          </div>

          <div className="final__signature">
            <Passage
              text={SIGNATURE.first}
              align="center"
              size={22}
              speed={430}
              start={signing}
              onComplete={() => window.setTimeout(() => setSigningName(true), 1400)}
            />
            <Passage
              text={SIGNATURE.second}
              align="center"
              size={26}
              speed={380}
              slant={11}
              start={signingName}
              className="final__name"
            />
          </div>
        </div>
      )}
    </Scene>
  );
}
