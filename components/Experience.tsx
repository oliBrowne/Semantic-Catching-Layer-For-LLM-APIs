'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAtmosphere } from '@/lib/particles/context';
import IntroScene from './IntroScene';

/*
  Everything below the opening is loaded separately.

  Nothing in the letter — not a single scroll trigger, not one typeset
  passage — is needed for "for you." to start being written, and hydrating it
  all first was the longest blocking task on the page. Splitting it here means
  the opening comes alive while the rest arrives underneath it.
*/
const Letter = dynamic(() => import('./Letter'), { ssr: false });
const ParticleField = dynamic(() => import('./ParticleField'), { ssr: false });

/**
 * The whole piece, in order: black, then a hand, then the letter.
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
      <ParticleField />

      <main className="stage">
        <IntroScene />
        <Letter />
      </main>
    </>
  );
}
