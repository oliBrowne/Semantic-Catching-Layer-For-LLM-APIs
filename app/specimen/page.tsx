'use client';

import HandwritingText from '@/components/HandwritingText';

/**
 * A type specimen, for tuning the alphabet.
 *
 * Not part of the letter — it exists so the glyphs can be looked at directly
 * while they are being drawn. Delete it if you would rather it were not there.
 */
const SAMPLES = [
  'abcdefghijklm\nnopqrstuvwxyz',
  'ABCDEFGHIJKLM\nNOPQRSTUVWXYZ',
  '0123456789\n, . ; : ! ? - ’ ( ) ♡',
  'I have passed by many eyes,\nbut yours were the only ones\nthat felt like a place to stay,',
  'my heart will always know you.',
  'It will always be you. ♡',
  'Yours,\nOliver',
];

export default function SpecimenPage() {
  return (
    <main className="specimen">
      {SAMPLES.map((sample, index) => (
        <section key={index} className="specimen__row">
          <HandwritingText text={sample} size={26} staticInk glow={false} />
        </section>
      ))}
      <style>{`
        .specimen { padding: 4rem 1.5rem; display: grid; gap: 3.5rem; max-width: 40rem; margin: 0 auto; }
        .specimen__row { padding-bottom: 2rem; border-bottom: 1px solid rgba(239,228,209,0.07); }
      `}</style>
    </main>
  );
}
