'use client';

import { useSound } from '@/lib/audio/context';

/**
 * The only control in the whole piece. It never announces itself, and nothing
 * makes a sound until it is touched.
 */
export default function SoundControl() {
  const { enabled, toggle } = useSound();

  return (
    <button
      type="button"
      className={`sound${enabled ? ' sound--on' : ''}`}
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? 'Stop the music' : 'Play a little music while you read'}
    >
      <span className="sound__note" aria-hidden="true">
        ♫
      </span>
      <span className="sound__label">{enabled ? 'playing' : 'listen'}</span>
    </button>
  );
}
