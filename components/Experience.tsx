'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAtmosphere } from '@/lib/particles/context';
import Finale from './Finale';
import IntroScene from './IntroScene';
import SecretMessage from './SecretMessage';
import SpotifyPlayer from './SpotifyPlayer';
import StartButton from './StartButton';

/*
  Everything below the opening is loaded separately. Nothing in the letter is
  needed for "for you." to start being written, and hydrating it all first was
  the longest blocking task on the page.
*/
const Letter = dynamic(() => import('./Letter'), { ssr: false });
const ParticleField = dynamic(() => import('./ParticleField'), { ssr: false });

/** How much scroll there is to have, once there is any. */
const AFTER = 2.4;

/**
 * The whole piece.
 *
 * The frame is fixed to the window and never moves. While the letter is being
 * written there is nothing below it at all, so the page simply cannot be
 * scrolled: no listeners to fight, no touch handlers to cancel: a document
 * exactly one screen tall has nowhere to go.
 *
 * When the letter has finished saying itself, the page grows underneath it and
 * the reader gets the scroll back, and what is down there is the whole poem.
 */
export default function Experience() {
  const atmosphere = useAtmosphere();
  const [invited, setInvited] = useState(false);
  const [begun, setBegun] = useState(false);
  const [released, setReleased] = useState(false);
  const [atBottom, setAtBottom] = useState(false);

  // The air comes to life as the letter starts, not on a scroll it will not get.
  useEffect(() => {
    const timer = window.setTimeout(() => atmosphere.setDensity(0.62), 6000);
    return () => window.clearTimeout(timer);
  }, [atmosphere]);

  useEffect(() => {
    if (!released) return;
    const onScroll = () => {
      const travelled = window.scrollY / (window.innerHeight * (AFTER - 1));
      setAtBottom(travelled > 0.45);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [released]);

  return (
    <>
      <div
        className="reel"
        style={{ height: released ? `${AFTER * 100}svh` : '100svh' }}
        aria-hidden="true"
      />

      <main className={`frame${atBottom ? ' frame--finale' : ''}`}>
        <ParticleField />
        <IntroScene onFinished={() => setInvited(true)} />
        <StartButton show={invited && !begun} onStart={() => setBegun(true)} />
        <Letter begin={begun} onFinished={() => setReleased(true)} />
        <Finale on={atBottom} />
        <SpotifyPlayer />
        {released ? (
          <div className={`ending__secret${atBottom ? ' ending__secret--out' : ''}`}>
            <SecretMessage />
          </div>
        ) : null}
        {released && !atBottom ? (
          <div className="release" aria-hidden="true">
            <span className="release__dot" />
          </div>
        ) : null}
      </main>
    </>
  );
}
