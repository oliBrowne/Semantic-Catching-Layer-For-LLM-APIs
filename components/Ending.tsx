'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import { FINAL_LINE, SIGNATURE } from '@/content/letter';
import { HEART, SIGNATURE_MARK } from '@/lib/font/marks';
import { useAtmosphere } from '@/lib/particles/context';
import DrawnMark from './DrawnMark';
import Passage from './Passage';
import photograph from '@/public/photo.jpg';

/** Each beat of the ending, and how long the one before it is held. */
type Beat = 'line' | 'heart' | 'photo' | 'sign' | 'name' | 'done';

/**
 * The end of the letter.
 *
 * One sentence, a heart drawn underneath it by hand, the only photograph in
 * the piece developing up behind them both, and a name. It runs itself
 * through, and when the name is finished it says so, which is what gives the
 * reader the page back.
 */
export default function Ending({
  active,
  onFinished,
}: {
  active: boolean;
  onFinished: () => void;
}) {
  const lineRef = useRef<HTMLDivElement | null>(null);
  const heartRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const curtainTopRef = useRef<HTMLDivElement | null>(null);
  const curtainBottomRef = useRef<HTMLDivElement | null>(null);
  const [beat, setBeat] = useState<Beat | null>(null);
  const atmosphere = useAtmosphere();
  const finished = useRef(false);

  useIsomorphicLayoutEffect(() => {
    if (active && beat === null) setBeat('line');
  }, [active, beat]);

  /** Everything in the air stops once the last sentence is complete. */
  const onLineWritten = () => {
    atmosphere.hold(1000 * 60 * 60);
    atmosphere.setDensity(0.04);
    gsap.to('.atmosphere__dim', { opacity: 0.34, duration: 6, ease: 'power2.inOut', delay: 1 });
    gsap.delayedCall(2.6, () => setBeat('heart'));
  };

  const onHeartDrawn = () => {
    gsap.delayedCall(1.4, () => setBeat('photo'));
  };

  // The photograph is uncovered by two curtains sliding apart: a band behind
  // the sentence first, then all of it. Transforms, so the compositor does it.
  useIsomorphicLayoutEffect(() => {
    if (beat !== 'photo') return;
    const top = curtainTopRef.current;
    const bottom = curtainBottomRef.current;
    const image = imageRef.current;
    const line = lineRef.current;
    const heart = heartRef.current;
    if (!top || !bottom || !image || !line || !heart) return;

    const vh = window.innerHeight;
    const tl = gsap.timeline();
    tl.to([top, bottom], {
      y: (i) => (i === 0 ? -vh * 0.038 : vh * 0.038),
      duration: 1.6,
      ease: 'power2.out',
    });
    tl.to(
      [top, bottom],
      { y: (i) => (i === 0 ? -vh * 0.62 : vh * 0.62), duration: 7, ease: 'sine.inOut' },
      '+=1.6',
    );
    tl.fromTo(image, { scale: 1 }, { scale: 1.04, duration: 22, ease: 'none' }, 0);
    // The sentence and the heart give way to the name.
    tl.to([line, heart], { opacity: 0, y: -40, duration: 2, ease: 'power2.inOut' }, '-=2.4');
    tl.call(() => setBeat('sign'));

    return () => {
      tl.kill();
    };
  }, [beat]);

  return (
    <>
      <div className="photo" aria-hidden="true">
        <div ref={imageRef} className="photo__frame">
          <Image src={photograph} alt="" className="photo__image" sizes="100vw" placeholder="blur" />
        </div>
        <div className="photo__warmth" />
        <div className="photo__grain" />
        <div className="photo__vignette" />
        <div ref={curtainTopRef} className="photo__curtain photo__curtain--top" />
        <div ref={curtainBottomRef} className="photo__curtain photo__curtain--bottom" />
      </div>

      <div ref={lineRef} className="card card--centre ending__line">
        <Passage
          text={FINAL_LINE}
          align="center"
          size={31}
          minSize={24}
          speed={950}
          ready={active}
          start={beat !== null}
          onComplete={onLineWritten}
        />
      </div>

      <div ref={heartRef} className="ending__heart">
        {beat !== null ? (
          <DrawnMark
            mark={HEART}
            start={beat === 'heart' || beat === 'photo' || beat === 'sign' || beat === 'name'}
            speed={150}
            strokeWidth={3.6}
            onComplete={onHeartDrawn}
          />
        ) : null}
      </div>

      <div className="ending__signature">
        <Passage
          text={SIGNATURE.first}
          align="center"
          size={24}
          speed={900}
          ready={active}
          start={beat === 'sign' || beat === 'name' || beat === 'done'}
          onComplete={() => gsap.delayedCall(1.1, () => setBeat('name'))}
          className="ending__yours"
        />
        {beat !== null ? (
          <DrawnMark
            mark={SIGNATURE_MARK}
            className="ending__name"
            start={beat === 'name' || beat === 'done'}
            speed={330}
            strokeWidth={2.8}
            ariaLabel={SIGNATURE.second}
            onComplete={() => {
              if (finished.current) return;
              finished.current = true;
              // The letter has been said. Give the reader the page back.
              gsap.delayedCall(2.8, () => {
                setBeat('done');
                onFinished();
              });
            }}
          />
        ) : null}
      </div>
    </>
  );
}
