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
import { usePerformanceTier } from '@/lib/usePerformanceTier';
import type { LaidOutWord } from '@/lib/handwriting/layout';
import type { LayoutInfo, WordEvent } from './HandwritingText';
import Card from './Card';
import EmberGlow, { type EmberPhase } from './EmberGlow';
import Ending from './Ending';
import Ghost from './Ghost';
import PaperSurface from './PaperSurface';

const PAPER_FROM_INDEX = CARDS.findIndex((card) => card.id === PAPER_FROM);
const PAPER_TO_INDEX = CARDS.findIndex((card) => card.id === PAPER_TO);
const GHOST_INDEX = CARDS.findIndex((card) => card.id === STILL_CARD);

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
  const gathered = useRef(false);
  const held = useRef(false);

  const advance = useCallback(() => setIndex((current) => current + 1), []);

  useIsomorphicLayoutEffect(() => {
    if (begin) setIndex((current) => (current < 0 ? 0 : current));
  }, [begin]);

  return (
    <>
      <PaperSurface
        on={index >= PAPER_FROM_INDEX && index <= PAPER_TO_INDEX}
        lead={index === PAPER_FROM_INDEX - 1}
      />
      <Ghost text={GHOST} on={index === GHOST_INDEX + 1} />

      {CARDS.map((spec, position) => {
        const active = index === position;
        // Typeset a card while the one before it is still being read.
        const ready = index >= position - 1;

        if (spec.id === EMBER_CARD) {
          return (
            <PromiseCard
              key={spec.id}
              spec={spec}
              active={active}
              ready={ready}
              onDone={advance}
              emberCount={tier.level === 'low' ? 20 : 34}
            />
          );
        }

        return (
          <Card
            key={spec.id}
            spec={spec}
            active={active}
            ready={ready}
            onDone={advance}
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

      <Ending active={index >= CARDS.length} onFinished={onFinished} />
    </>
  );
}

/** The promise, with a single point of red gathering behind its last word. */
function PromiseCard({
  spec,
  active,
  ready,
  onDone,
  emberCount,
}: {
  spec: CardSpec;
  active: boolean;
  ready: boolean;
  onDone: () => void;
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
      ready={ready}
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
