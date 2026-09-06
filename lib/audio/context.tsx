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

type SoundApi = {
  enabled: boolean;
  toggle: () => void;
  /** Handed to HandwritingText so the nib can be heard while it writes. */
  strokeRef: MutableRefObject<((duration: number) => void) | null>;
};

const SoundContext = createContext<SoundApi>({
  enabled: false,
  toggle: () => {},
  strokeRef: { current: null },
});

export function SoundProvider({ children }: { children: ReactNode }) {
  const engine = useRef<LetterAudio | null>(null);
  const strokeRef = useRef<((duration: number) => void) | null>(null);
  const touched = useRef(false);
  const [enabled, setEnabled] = useState(false);

  const toggle = useCallback(() => {
    touched.current = true;
    // The AudioContext may only be created inside a real user gesture.
    engine.current = engine.current ?? createLetterAudio();
    const audio = engine.current;

    setEnabled((wasEnabled) => {
      if (wasEnabled) {
        audio.stop();
        strokeRef.current = null;
        return false;
      }
      void audio.start();
      strokeRef.current = (duration) => audio.pen(duration);
      return true;
    });
  }, []);

  // No browser will start sound without a gesture, so the first touch is taken
  // as one — the control is right there at the top of the screen to stop it
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

  const value = useMemo<SoundApi>(() => ({ enabled, toggle, strokeRef }), [enabled, toggle]);

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound(): SoundApi {
  return useContext(SoundContext);
}
