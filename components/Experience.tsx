'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DECLARATION, EYES, PROMISE, SMILE } from '@/content/letter';
import { useAtmosphere } from '@/lib/particles/context';
import { usePerformanceTier } from '@/lib/usePerformanceTier';
import type { LaidOutWord } from '@/lib/handwriting/layout';
import type { LayoutInfo, WordEvent } from './HandwritingText';
import EmberGlow, { type EmberPhase } from './EmberGlow';
import FinalPhotoReveal from './FinalPhotoReveal';
import IntroScene from './IntroScene';
import PaperSurface from './PaperSurface';
import PaperTransition from './PaperTransition';
import ParticleField from './ParticleField';
import StanzaReader from './StanzaReader';
import Scene from './Scene';
import SecretMessage from './SecretMessage';

/**
 * The whole letter, in order.
 *
 * Each passage owns its own writing; this file owns the cues between them —
 * when the dust leans in, when the room holds its breath, when the paper comes
 * up out of the dark.
 */
export default function Experience() {
  const atmosphere = useAtmosphere();
  const tier = usePerformanceTier();

  const transitionRef = useRef<HTMLElement | null>(null);
  const promiseRef = useRef<HTMLElement | null>(null);

  // The air is almost still until the reader starts moving through the letter.
  useEffect(() => {
    const onFirstScroll = () => {
      if (window.scrollY > 24) {
        atmosphere.setDensity(0.62);
        window.removeEventListener('scroll', onFirstScroll);
      }
    };
    window.addEventListener('scroll', onFirstScroll, { passive: true });
    return () => window.removeEventListener('scroll', onFirstScroll);
  }, [atmosphere]);

  return (
    <>
      <ParticleField />

      <main className="stage">
        <IntroScene />

        {/* ── the only ones ─────────────────────────────────────────────── */}
        <Scene scroll={4.6} enterAt="top 68%">
          {({ entered }) => (
            <StanzaReader
              text={EYES.text}
              size={24}
              minSize={19}
              speed={880}
              start={entered}
              holds={EYES.holds}
              emphasisLines={[1]}
              onWordStart={({ word, point }) => {
                // As the last line is written, the dust drifts in toward it.
                if (word.sourceLineIndex === EYES.gatherLine && point) {
                  atmosphere.gather(point.x, point.y, 52, 6000);
                }
              }}
            />
          )}
        </Scene>

        {/* ── and then you smiled ───────────────────────────────────────── */}
        <SmileScene />

        {/* ── the dark, and the sheet of paper found in it ──────────────── */}
        <PaperTransition ghost={SMILE.ghost} sectionRef={transitionRef} />
        <PaperSurface from={transitionRef} to={promiseRef} />

        {/* ── the promise ───────────────────────────────────────────────── */}
        <PromiseScene sectionRef={promiseRef} emberCount={tier.level === 'low' ? 20 : 34} />

        {/* ── here it is ────────────────────────────────────────────────── */}
        <Scene scroll={5.2} wide enterAt="top 66%">
          {({ entered }) => (
            <StanzaReader
              text={DECLARATION.text}
              size={24}
              minSize={19}
              speed={840}
              start={entered}
              holds={DECLARATION.holds}
              onWordStart={({ word }) => {
                // Almost everything leaves the frame for the last words.
                if (word.sourceLineIndex === 0 && word.index === 0) {
                  atmosphere.setDensity(0.2);
                }
              }}
            />
          )}
        </Scene>

        {/* ── it will always be you ─────────────────────────────────────── */}
        <FinalPhotoReveal />

        {/* ── one more thing ────────────────────────────────────────────── */}
        <Scene scroll={2.4} fadeOut={false} enterAt="top 74%">
          {({ entered }) => (
            <div className="secret">
              <SecretMessage start={entered} />
            </div>
          )}
        </Scene>
      </main>
    </>
  );
}

/** The second passage, where the room briefly stops moving. */
function SmileScene() {
  const atmosphere = useAtmosphere();

  return (
    <Scene scroll={5.6} wide enterAt="top 66%">
      {({ entered }) => (
        <div className="passage-group">
          <div className="halo" aria-hidden="true" />
          <StanzaReader
            text={SMILE.text}
            size={23}
            minSize={18}
            speed={860}
            start={entered}
            holds={SMILE.holds}
            emphasisLines={[1, 5]}
            onWordStart={({ word }) => {
              // "like yours did." — everything in the air stops for a beat.
              if (word.sourceLineIndex === SMILE.stillLine && word.endsSourceLine) {
                atmosphere.hold(2800);
              }
            }}
          />
        </div>
      )}
    </Scene>
  );
}

/** The promise, written on the sheet, with a single point of red behind it. */
function PromiseScene({
  sectionRef,
  emberCount,
}: {
  sectionRef: React.MutableRefObject<HTMLElement | null>;
  emberCount: number;
}) {
  const atmosphere = useAtmosphere();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<LayoutInfo | null>(null);
  const finalWordRef = useRef<LaidOutWord | null>(null);
  const [phase, setPhase] = useState<EmberPhase>('dark');
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);

  const onLayout = useCallback((info: LayoutInfo, lineIndex: number) => {
    if (lineIndex !== PROMISE.emberLine) return;
    layoutRef.current = info;
    finalWordRef.current = info.words[info.words.length - 1] ?? null;
  }, []);

  /** Viewport coordinates, translated into the passage's own frame. */
  const localise = (viewportPoint: { x: number; y: number }) => {
    const host = hostRef.current;
    if (!host) return viewportPoint;
    const rect = host.getBoundingClientRect();
    return { x: viewportPoint.x - rect.left, y: viewportPoint.y - rect.top };
  };

  const onWordStart = ({ word }: WordEvent) => {
    if (word.sourceLineIndex !== PROMISE.emberLine || phase !== 'dark') return;
    const target = finalWordRef.current;
    const where = target ? layoutRef.current?.pointOf(target) : null;
    if (!where) return;
    // Lit from the first word of the line, behind the last word of it.
    setPoint(localise(where));
    setPhase('kindling');
  };

  const onLineEnd = (line: number) => {
    if (line !== PROMISE.emberLine) return;
    const target = finalWordRef.current;
    const where = target ? layoutRef.current?.pointOf(target) : null;
    window.setTimeout(() => {
      setPhase('scattered');
      if (where) atmosphere.ember(where.x, where.y, emberCount);
    }, 1600);
  };

  return (
    <Scene scroll={6.4} wide enterAt="top 64%" sectionRef={sectionRef} id="promise">
      {({ entered }) => (
        <div ref={hostRef} className="passage-group passage-group--paper">
          <EmberGlow point={point} phase={phase} />
          <StanzaReader
            paper
            text={PROMISE.text}
            size={26}
            minSize={20}
            speed={800}
            start={entered}
            holds={PROMISE.holds}
            emphasisLines={[5]}
            onLayout={onLayout}
            onWordStart={onWordStart}
            onLineEnd={onLineEnd}
          />
        </div>
      )}
    </Scene>
  );
}
