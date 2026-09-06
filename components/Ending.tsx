'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '@/lib/scroll';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import { FINAL_LINE, SIGNATURE } from '@/content/letter';
import { HEART, SIGNATURE_MARK } from '@/lib/font/marks';
import { SCHEDULE } from '@/lib/schedule';
import { useAtmosphere } from '@/lib/particles/context';
import DrawnMark from './DrawnMark';
import Passage from './Passage';
import SecretMessage from './SecretMessage';
import photograph from '@/public/photo.jpg';

const { ending } = SCHEDULE;

/**
 * The end of the letter.
 *
 * One sentence, a heart drawn underneath it by hand, the only photograph in
 * the piece developing up behind them both, and a name. All of it on the
 * scrollbar: nothing here happens on a clock.
 */
export default function Ending() {
  const lineRef = useRef<HTMLDivElement | null>(null);
  const heartRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const curtainTopRef = useRef<HTMLDivElement | null>(null);
  const curtainBottomRef = useRef<HTMLDivElement | null>(null);
  const signatureRef = useRef<HTMLDivElement | null>(null);
  const [near, setNear] = useState(false);
  const [stilled, setStilled] = useState(false);
  const atmosphere = useAtmosphere();

  const vh = () => window.innerHeight;

  const onLineTimeline = (timeline: gsap.core.Timeline) => {
    ScrollTrigger.create({
      animation: timeline,
      start: () => vh() * ending.line.at,
      end: () => vh() * (ending.line.at + ending.line.write),
      scrub: 0.55,
      invalidateOnRefresh: true,
      onLeave: () => {
        // Everything in the air stops once the last sentence is complete.
        if (stilled) return;
        setStilled(true);
        atmosphere.hold(1000 * 60 * 60);
        atmosphere.setDensity(0.04);
        gsap.to('.atmosphere__dim', { opacity: 0.34, duration: 6, ease: 'power2.inOut' });
      },
    });
  };

  const onHeartTimeline = (timeline: gsap.core.Timeline) => {
    ScrollTrigger.create({
      animation: timeline,
      start: () => vh() * ending.heart.from,
      end: () => vh() * ending.heart.to,
      scrub: 0.55,
      invalidateOnRefresh: true,
    });
  };

  const onSignatureTimeline = (timeline: gsap.core.Timeline) => {
    ScrollTrigger.create({
      animation: timeline,
      // The name and its swash are one drawing, so they get one long stretch
      // of scroll: the capital, the run through the rest of it, the dot, and
      // then the stroke underneath that finishes it.
      start: () => vh() * (ending.signature + 0.55),
      end: () => vh() * (ending.flourish + 0.9),
      scrub: 0.6,
      invalidateOnRefresh: true,
    });
  };

  useIsomorphicLayoutEffect(() => {
    const top = curtainTopRef.current;
    const bottom = curtainBottomRef.current;
    const image = imageRef.current;
    const line = lineRef.current;
    const heart = heartRef.current;
    if (!top || !bottom || !image || !line || !heart) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: () => Math.max(0, vh() * (ending.line.at - 1.6)),
        end: () => vh() * (ending.secret + 2),
        onToggle: (self) => setNear(self.isActive || near),
        onRefresh: (self) => {
          if (self.progress > 0) setNear(true);
        },
      });

      // The photograph is uncovered by two curtains sliding apart: a band
      // behind the sentence first, then, if the reader keeps going, all of it.
      const setTop = gsap.quickSetter(top, 'y', 'px');
      const setBottom = gsap.quickSetter(bottom, 'y', 'px');
      const BAND = 0.038;
      const OPEN = 0.62;
      const KNEE = 0.24;
      const reveal = { at: 0 };
      const apply = () => {
        const t = reveal.at;
        const half =
          t < KNEE ? (t / KNEE) * BAND : BAND + ((t - KNEE) / (1 - KNEE)) * (OPEN - BAND);
        const px = vh() * half;
        setTop(-px);
        setBottom(px);
      };
      apply();

      gsap.to(reveal, {
        at: 1,
        ease: 'none',
        onUpdate: apply,
        scrollTrigger: {
          start: () => vh() * ending.photo.band,
          end: () => vh() * ending.photo.open,
          scrub: 0.7,
          invalidateOnRefresh: true,
          onRefresh: apply,
        },
      });

      // A drift so slow it registers as the room breathing, not a zoom.
      gsap.fromTo(
        image,
        { scale: 1 },
        {
          scale: 1.04,
          ease: 'none',
          scrollTrigger: {
            start: () => vh() * ending.photo.band,
            end: () => vh() * (ending.secret - 1),
            scrub: 1.2,
            invalidateOnRefresh: true,
          },
        },
      );

      // The sentence and the heart give way to the name.
      gsap.to([line, heart], {
        opacity: 0,
        y: -46,
        ease: 'none',
        scrollTrigger: {
          start: () => vh() * ending.leave.from,
          end: () => vh() * ending.leave.to,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
    });

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="photo" aria-hidden="true">
        <div ref={imageRef} className="photo__frame">
          <Image
            src={photograph}
            alt=""
            className="photo__image"
            sizes="100vw"
            placeholder="blur"
          />
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
          ready={near}
          scrub
          onTimeline={onLineTimeline}
        />
      </div>

      <div ref={heartRef} className="ending__heart">
        {near ? <DrawnMark mark={HEART} scrub strokeWidth={3.6} onTimeline={onHeartTimeline} /> : null}
      </div>

      <div ref={signatureRef} className="ending__signature">
        <Passage
          text={SIGNATURE.first}
          align="center"
          size={24}
          ready={near}
          scrub
          onTimeline={(timeline) => {
            ScrollTrigger.create({
              animation: timeline,
              start: () => vh() * ending.signature,
              end: () => vh() * (ending.signature + 0.45),
              scrub: 0.55,
              invalidateOnRefresh: true,
            });
          }}
          className="ending__yours"
        />
        {near ? (
          <DrawnMark
            mark={SIGNATURE_MARK}
            className="ending__name"
            scrub
            strokeWidth={2.8}
            speed={900}
            onTimeline={onSignatureTimeline}
            ariaLabel={SIGNATURE.second}
          />
        ) : null}
      </div>

      <div className="ending__secret">
        <SecretMessage ready={near} at={ending.secret} />
      </div>
    </>
  );
}
