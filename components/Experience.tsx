'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { REEL_LENGTH } from '@/lib/schedule';
import { useAtmosphere } from '@/lib/particles/context';
import IntroScene from './IntroScene';

/*
  Everything below the opening is loaded separately. Nothing in the letter is
  needed for "for you." to start being written, and hydrating it all first was
  the longest blocking task on the page.
*/
const Letter = dynamic(() => import('./Letter'), { ssr: false });
const ParticleField = dynamic(() => import('./ParticleField'), { ssr: false });

/**
 * The whole piece.
 *
 * The frame is fixed to the window and never moves. The reel below it is empty
 * — it exists only to give the scrollbar something to travel along, and that
 * travel is what runs the pen, opens the photograph and draws the heart. The
 * reader is not scrolling past a page; they are turning the handle on one.
 */
export default function Experience() {
  const atmosphere = useAtmosphere();

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
      <div
        className="reel"
        style={{ height: `${REEL_LENGTH * 100}svh` }}
        aria-hidden="true"
      />

      <main className="frame">
        <ParticleField />
        <IntroScene />
        <Letter />
      </main>
    </>
  );
}
