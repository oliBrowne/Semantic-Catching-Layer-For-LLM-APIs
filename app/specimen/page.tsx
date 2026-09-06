'use client';

import DrawnMark from '@/components/DrawnMark';
import HandwritingText from '@/components/HandwritingText';
import { HEART, SIGNATURE_MARK } from '@/lib/font/marks';

/**
 * A type specimen, for tuning the alphabet and the two drawings.
 *
 * Not part of the letter — it exists so the strokes can be looked at directly.
 */
const SAMPLES = [
  'abcdefghijklm\nnopqrstuvwxyz',
  'ABCDEFGHIJKLM\nNOPQRSTUVWXYZ',
  '0123456789\n, . ; : ! ? - ’ ( ) ♡',
  'I have passed by many eyes,\nbut yours were the only ones',
  'It will always be you.',
  'Yours,',
];

export default function SpecimenPage() {
  return (
    <main className="specimen">
      {SAMPLES.map((sample, index) => (
        <section key={index} className="specimen__row">
          <HandwritingText text={sample} size={26} staticInk glow={false} />
        </section>
      ))}
      <section className="specimen__row specimen__mark">
        <DrawnMark mark={SIGNATURE_MARK} start speed={900} ariaLabel="Oliver" />
      </section>
      <section className="specimen__row specimen__mark specimen__mark--small">
        <DrawnMark mark={HEART} start />
      </section>
      <style>{`
        .specimen { padding: 4rem 1.5rem; display: grid; gap: 3.5rem; max-width: 40rem; margin: 0 auto; }
        .specimen__row { padding-bottom: 2rem; border-bottom: 1px solid rgba(239,228,209,0.07); }
        .specimen__mark { width: 22rem; }
        .specimen__mark--small { width: 12rem; }
      `}</style>
    </main>
  );
}
