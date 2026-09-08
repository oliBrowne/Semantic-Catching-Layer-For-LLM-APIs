'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import { createLetterAudio, type LetterAudio } from './engine';

/** Where the sound is coming from, once there is any. */
export type SoundSource = 'none' | 'files' | 'spotify' | 'room';

type SoundApi = {
  enabled: boolean;
  toggle: () => void;
  source: SoundSource;
  /** What is sounding, for the control's label. Never shown on screen. */
  now: () => string | null;
  /** Handed to HandwritingText so the nib can be heard while it writes. */
  strokeRef: MutableRefObject<((duration: number) => void) | null>;
  /** Put the music under something, or bring it back. 1 is normal. */
  duck: (level: number) => void;
  /**
   * Called by a handed-over player once it is genuinely making a sound. If
   * nothing calls this, the handover is treated as having failed and something
   * that does work is played instead.
   */
  confirm: () => void;
};

const SoundContext = createContext<SoundApi>({
  enabled: false,
  toggle: () => {},
  source: 'none',
  now: () => null,
  strokeRef: { current: null },
  duck: () => {},
  confirm: () => {},
});

/** How long a handed-over player has to prove it is audible. */
const PROVE_IT = 6000;

export function SoundProvider({ children }: { children: ReactNode }) {
  const engine = useRef<LetterAudio | null>(null);
  const strokeRef = useRef<((duration: number) => void) | null>(null);
  const touched = useRef(false);
  const confirmed = useRef(false);
  const [enabled, setEnabled] = useState(false);
  const [source, setSource] = useState<SoundSource>('none');

  const toggle = useCallback(() => {
    touched.current = true;
    // The AudioContext may only be created inside a real user gesture.
    engine.current = engine.current ?? createLetterAudio();
    const audio = engine.current;

    setEnabled((wasEnabled) => {
      if (wasEnabled) {
        audio.stop();
        strokeRef.current = null;
        setSource('none');
        return false;
      }
      // The engine looks for audio files first and reports what it settled on.
      // Spotify is its own component, so it is handed off rather than played.
      void audio.start().then((chosen) => setSource(chosen));
      strokeRef.current = (duration) => audio.pen(duration);
      return true;
    });
  }, []);

  // No browser will start sound without a gesture, so the first touch is taken
  // as one: the control is right there at the top of the screen to stop it
  // again, and it shows what is playing.
  useEffect(() => {
    if (enabled || touched.current) return;
    const onFirstTouch = () => {
      if (touched.current) return;
      touched.current = true;
      toggle();
    };
    window.addEventListener('pointerdown', onFirstTouch, { once: true });
    return () => window.removeEventListener('pointerdown', onFirstTouch);
  }, [enabled, toggle]);

  // A source that was handed control has a few seconds to prove it is audible.
  // Spotify's embed very often is not: a phone will not autoplay a cross-origin
  // iframe, and the failure is silent, which would leave the page claiming to
  // play music while playing none. Rather than trust it, wait for it to say so.
  useEffect(() => {
    if (source !== 'spotify') return;
    confirmed.current = false;
    const timer = window.setTimeout(() => {
      if (confirmed.current) return;
      void engine.current?.giveUp().then((instead) => setSource(instead));
    }, PROVE_IT);
    return () => window.clearTimeout(timer);
  }, [source]);

  const value = useMemo<SoundApi>(
    () => ({
      enabled,
      toggle,
      source,
      now: () => engine.current?.now() ?? null,
      strokeRef,
      duck: (level: number) => engine.current?.duck(level),
      confirm: () => {
        confirmed.current = true;
      },
    }),
    [enabled, toggle, source],
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound(): SoundApi {
  return useContext(SoundContext);
}
