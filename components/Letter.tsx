'use client';

import { useCallback, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import {
  ALL_LINES,
  CARDS,
  EMBER_CARD,
  GATHER_CARD,
  GHOST,
  PAPER_FROM,
  PAPER_TO,
  STILL_CARD,
  type CardSpec,
} from '@/content/letter';
import { useAtmosphere } from '@/lib/particles/context';
import { CARD_VOICE, CUES, FINAL_VOICE, type WordTiming } from '@/lib/voice';
import { useReading } from '@/lib/audio/reading';
import { useSound } from '@/lib/audio/context';
import { usePerformanceTier } from '@/lib/usePerformanceTier';
import type { LaidOutWord } from '@/lib/handwriting/layout';
import type { LayoutInfo, WordEvent } from './HandwritingText';
import Card, { FADE, GAP, HOLD } from './Card';
import EmberGlow, { type EmberPhase } from './EmberGlow';
import Ending from './Ending';
import Ghost from './Ghost';
import PaperSurface from './PaperSurface';

const PAPER_FROM_INDEX = CARDS.findIndex((card) => card.id === PAPER_FROM);
const PAPER_TO_INDEX = CARDS.findIndex((card) => card.id === PAPER_TO);
const GHOST_INDEX = CARDS.findIndex((card) => card.id === STILL_CARD);

/** How far the music drops while the letter is being read aloud. */
const UNDER_VOICE = 0.26;

/**
 * Where the letter has got to, read off the recording.
 *
 * A card is written from the moment its first word is spoken, and is sent away
 * just late enough that it has cleared the frame by the time the next one is.
 */
function placeInReading(seconds: number) {
  let writing = -1;
  let leaving = -1;
  for (let cue = 0; cue < CUES.length; cue += 1) {
    if (seconds >= CUES[cue].voice.at) writing = cue;
    const next = CUES[cue + 1];
    const out = next ? next.voice.at - (FADE + GAP) : CUES[cue].voice.until + HOLD;
    if (seconds >= out) leaving = cue;
  }
  const closing = FINAL_VOICE ? FINAL_VOICE.at : Infinity;
  return { writing, leaving, ending: seconds >= closing - (FADE + GAP) };
}

/**
 * The letter, from the first card to the last thing on the page.
 *
 * It plays itself. Nothing here waits for the reader and nothing here moves
 * down the page: each card writes in the same place in a frame fixed to the
 * window, is held, and lifts away as the next begins. The page cannot be
 * scrolled at all until the whole thing has been said.
 */
export default function Letter({
  begin,
  onFinished,
}: {
  begin: boolean;
  onFinished: () => void;
}) {
  const atmosphere = useAtmosphere();
  const tier = usePerformanceTier();
  // -1 while the opening still has the screen.
  const [index, setIndex] = useState(-1);
  const [gone, setGone] = useState(-1);
  const [closing, setClosing] = useState(false);
  const gathered = useRef(false);
  const held = useRef(false);

  const advance = useCallback(() => setIndex((current) => current + 1), []);

  // When there is a reading, the letter does not keep time at all: this runs
  // every frame and simply reports where the voice has got to.
  const follow = useCallback((seconds: number) => {
    const place = placeInReading(seconds);
    setIndex((current) => (current === place.writing ? current : place.writing));
    setGone((current) => (current === place.leaving ? current : place.leaving));
    setClosing((current) => (current === place.ending ? current : place.ending));
  }, []);

  const reading = useReading(begin, follow);
  /** True when the letter is running on a clock of its own, as it always did. */
  const timed = reading.silent;

  // A voice has to be the loudest thing in the room, so the music goes under
  // it for as long as it is speaking and comes back up when it stops.
  const { duck } = useSound();
  useIsomorphicLayoutEffect(() => {
    duck(reading.live ? UNDER_VOICE : 1);
  }, [reading.live, duck]);

  useIsomorphicLayoutEffect(() => {
    if (begin && timed) setIndex((current) => (current < 0 ? 0 : current));
  }, [begin, timed]);

  return (
    <>
      <PaperSurface
        on={index >= PAPER_FROM_INDEX && index <= PAPER_TO_INDEX}
        lead={index === PAPER_FROM_INDEX - 1}
      />
      <Ghost text={GHOST} on={index === GHOST_INDEX + 1} />

      {CARDS.map((spec, position) => {
        // On its own clock a card is written when the letter arrives at it. To
        // a reading it is written from the moment its first word is spoken and
        // stays written until the voice has moved on, so `active` only ever
        // goes forward: turning it off again would take the ink with it.
        const active = timed ? index === position : index >= position;
        const live = index === position;
        // Typeset a card while the one before it is still being read.
        const ready = index >= position - 1;
        const times = timed ? undefined : CARD_VOICE[spec.id]?.times;
        const leaving = !timed && gone >= position;

        if (spec.id === EMBER_CARD) {
          return (
            <PromiseCard
              key={spec.id}
              spec={spec}
              active={active}
              live={live}
              ready={ready}
              times={times}
              leaving={leaving}
              onDone={timed ? advance : undefined}
              emberCount={tier.level === 'low' ? 20 : 34}
            />
          );
        }

        return (
          <Card
            key={spec.id}
            spec={spec}
            active={active}
            live={live}
            ready={ready}
            times={times}
            leaving={leaving}
            onDone={timed ? advance : undefined}
            fitTo={ALL_LINES}
            paper={spec.id.startsWith('promise')}
            onWordStart={({ word, point }) => {
              // The dust leans toward the last line of the first passage.
              if (spec.id === GATHER_CARD && word.endsSourceLine && point && !gathered.current) {
                gathered.current = true;
                atmosphere.gather(point.x, point.y, 52, 6000);
              }
              // And stops dead on "like yours did."
              if (spec.id === STILL_CARD && word.endsSourceLine && !held.current) {
                held.current = true;
                atmosphere.hold(2800);
              }
              // Almost everything leaves the frame for the last words.
              if (spec.id === 'declaration-1' && word.index === 0) {
                atmosphere.setDensity(0.2);
              }
            }}
          />
        );
      })}

      <Ending
        active={timed ? index >= CARDS.length : closing}
        times={timed ? undefined : (FINAL_VOICE?.times ?? undefined)}
        onFinished={onFinished}
      />
    </>
  );
}

/** The promise, with a single point of red gathering behind its last word. */
function PromiseCard({
  spec,
  active,
  live,
  ready,
  times,
  leaving,
  onDone,
  emberCount,
}: {
  spec: CardSpec;
  active: boolean;
  live: boolean;
  ready: boolean;
  times?: WordTiming[];
  leaving: boolean;
  onDone?: () => void;
  emberCount: number;
}) {
  const atmosphere = useAtmosphere();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<LayoutInfo | null>(null);
  const finalWordRef = useRef<LaidOutWord | null>(null);
  const scattered = useRef(false);
  const [phase, setPhase] = useState<EmberPhase>('dark');
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);

  const onLayout = useCallback((info: LayoutInfo) => {
    layoutRef.current = info;
    finalWordRef.current = info.words[info.words.length - 1] ?? null;
  }, []);

  const onWordStart = ({ word }: WordEvent) => {
    // Lit from the first word of the last line, behind the last word of it.
    if (word.sourceLineIndex !== spec.lines.length - 1 || phase !== 'dark') return;
    const target = finalWordRef.current;
    const where = target ? layoutRef.current?.pointOf(target) : null;
    const host = hostRef.current;
    if (!where || !host) return;
    const rect = host.getBoundingClientRect();
    setPoint({ x: where.x - rect.left, y: where.y - rect.top });
    setPhase('kindling');
  };

  const onLineEnd = (lineIndex: number) => {
    if (lineIndex !== spec.lines.length - 1 || scattered.current) return;
    scattered.current = true;
    const target = finalWordRef.current;
    const where = target ? layoutRef.current?.pointOf(target) : null;
    window.setTimeout(() => {
      setPhase('scattered');
      if (where) atmosphere.ember(where.x, where.y, emberCount);
    }, 900);
  };

  return (
    <Card
      spec={spec}
      active={active}
      live={live}
      ready={ready}
      times={times}
      leaving={leaving}
      onDone={onDone}
      fitTo={ALL_LINES}
      paper
      onLayout={onLayout}
      onWordStart={onWordStart}
      onLineEnd={onLineEnd}
    >
      <div ref={hostRef} className="card__ember">
        <EmberGlow point={point} phase={phase} />
      </div>
    </Card>
  );
}
