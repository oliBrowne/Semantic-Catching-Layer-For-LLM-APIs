'use client';

import { useCallback, useRef, useState } from 'react';
import {
  ALL_LINES,
  EMBER_CARD,
  GATHER_CARD,
  GHOST,
  STILL_CARD,
} from '@/content/letter';
import { SCHEDULE } from '@/lib/schedule';
import { useAtmosphere } from '@/lib/particles/context';
import { usePerformanceTier } from '@/lib/usePerformanceTier';
import type { LaidOutWord } from '@/lib/handwriting/layout';
import type { LayoutInfo, WordEvent } from './HandwritingText';
import Card from './Card';
import EmberGlow, { type EmberPhase } from './EmberGlow';
import Ending from './Ending';
import Ghost from './Ghost';
import PaperSurface from './PaperSurface';

/**
 * The letter, from the first card to the last thing on the page.
 *
 * Nothing here moves down the page. Every card occupies the same place in a
 * frame fixed to the window, and the reader's scroll is the playhead: it runs
 * the pen forwards and, if they go back, backwards.
 */
export default function Letter() {
  const atmosphere = useAtmosphere();
  const tier = usePerformanceTier();
  const gathered = useRef(false);
  const held = useRef(false);

  return (
    <>
      <PaperSurface from={SCHEDULE.paper.from} to={SCHEDULE.paper.to} />
      <Ghost text={GHOST} from={SCHEDULE.ghost.from} to={SCHEDULE.ghost.to} />

      {SCHEDULE.cues.map((cue) => {
        if (cue.id === EMBER_CARD) {
          return (
            <PromiseCard
              key={cue.id}
              cue={cue}
              emberCount={tier.level === 'low' ? 20 : 34}
            />
          );
        }

        const onPaper = cue.id.startsWith('promise');
        const isFinal = cue.id === 'final';

        return (
          <Card
            key={cue.id}
            cue={cue}
            fitTo={ALL_LINES}
            paper={onPaper}
            align={isFinal ? 'center' : 'left'}
            size={isFinal ? 30 : 24}
            minSize={isFinal ? 24 : 19}
            onWordStart={({ word, point }) => {
              // The dust leans toward the last line of the first passage.
              if (cue.id === GATHER_CARD && word.endsSourceLine && point && !gathered.current) {
                gathered.current = true;
                atmosphere.gather(point.x, point.y, 52, 6000);
              }
              // And stops dead on "like yours did."
              if (cue.id === STILL_CARD && word.endsSourceLine && !held.current) {
                held.current = true;
                atmosphere.hold(2800);
              }
              // Almost everything leaves the frame for the last words.
              if (cue.id === 'declaration-1' && word.index === 0) {
                atmosphere.setDensity(0.2);
              }
            }}
          />
        );
      })}

      <Ending />
    </>
  );
}

/** The promise, with a single point of red gathering behind its last word. */
function PromiseCard({ cue, emberCount }: { cue: (typeof SCHEDULE.cues)[number]; emberCount: number }) {
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
    if (word.sourceLineIndex !== cue.lines.length - 1 || phase !== 'dark') return;
    const target = finalWordRef.current;
    const where = target ? layoutRef.current?.pointOf(target) : null;
    const host = hostRef.current;
    if (!where || !host) return;
    const rect = host.getBoundingClientRect();
    setPoint({ x: where.x - rect.left, y: where.y - rect.top });
    setPhase('kindling');
  };

  const onLineEnd = (lineIndex: number) => {
    if (lineIndex !== cue.lines.length - 1 || scattered.current) return;
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
      cue={cue}
      fitTo={ALL_LINES}
      paper
      size={24}
      minSize={19}
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
