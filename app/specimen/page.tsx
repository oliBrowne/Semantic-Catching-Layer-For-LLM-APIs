'use client';

import { useState } from 'react';
import DrawnMark from '@/components/DrawnMark';
import Vines from '@/components/Vines';
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
  const [vines, setVines] = useState(false);
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
      <section className="specimen__row specimen__vines">
        <button type="button" onClick={() => setVines(true)}>grow</button>{/* dev only */}
        <Vines on={vines} />
      </section>
      <style>{`
        .specimen { padding: 4rem 1.5rem; display: grid; gap: 3.5rem; max-width: 40rem; margin: 0 auto; }
        .specimen__row { padding-bottom: 2rem; border-bottom: 1px solid rgba(239,228,209,0.07); }
        .specimen__mark { width: 22rem; }
        .specimen__mark--small { width: 12rem; }
        .specimen__vines { position: relative; height: 26rem; display: grid; place-items: center; }
        .specimen__vines button { position: absolute; z-index: 2; background: none; border: 1px solid rgba(239,228,209,.3); color: #efe4d1; padding: .5rem 1rem; border-radius: 2rem; }
      `}</style>
    </main>
  );
}
