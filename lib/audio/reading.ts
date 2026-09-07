'use client';

import { useEffect, useRef, useState } from 'react';
import { READING } from '@/lib/voice';

/**
 * The recording of the letter being read aloud, if there is one.
 *
 * This is the clock the whole letter runs on when it exists. Everything else
 * follows it: the pen, the cards, the pauses. It is deliberately the only
 * thing in the piece that keeps real time, so nothing can drift away from the
 * voice.
 */

let element: HTMLAudioElement | null = null;
let unlocked = false;

function player(): HTMLAudioElement | null {
  if (!READING || typeof window === 'undefined') return null;
  if (!element) {
    element = new Audio(READING.src);
    element.preload = 'auto';
    // In the document rather than detached: a media element the browser can
    // see is one it keeps scheduling while the tab is busy, and it can be
    // inspected, which a recording that has to stay in step with the page is
    // much better for.
    element.hidden = true;
    document.body.appendChild(element);
  }
  return element;
}

/**
 * A browser will only let a recording start from inside a real press, and the
 * press that starts the letter happens a couple of seconds before the reading
 * is wanted. So the press is spent here, silently, to buy the right to play
 * later.
 */
export function primeReading() {
  const audio = player();
  if (!audio || unlocked) return;
  unlocked = true;
  audio.muted = true;
  void audio
    .play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
    })
    .catch(() => {
      audio.muted = false;
    });
}

export type ReadingState = {
  /** The recording is playing and the letter should be following it. */
  live: boolean;
  /**
   * There is no usable recording, so the letter should keep its own time. True
   * immediately when none is configured, so nothing waits on a maybe.
   */
  silent: boolean;
};

/**
 * Play the reading, and report where in it we are on every frame.
 *
 * `onTime` is called from a requestAnimationFrame loop rather than through
 * state, because the letter needs the time sixty times a second and needs to
 * re-render about ten times in total.
 */
export function useReading(start: boolean, onTime: (seconds: number) => void): ReadingState {
  const [live, setLive] = useState(false);
  const [silent, setSilent] = useState(READING === null);
  const latest = useRef(onTime);
  latest.current = onTime;

  useEffect(() => {
    if (!start || READING === null) return;
    const audio = player();
    if (!audio) {
      setSilent(true);
      return;
    }

    let frame = 0;
    let dropped = false;
    const tick = () => {
      latest.current(audio.currentTime);
      frame = requestAnimationFrame(tick);
    };
    const give = () => {
      if (dropped) return;
      dropped = true;
      setLive(false);
      setSilent(true);
    };

    audio
      .play()
      .then(() => {
        if (dropped) return;
        setLive(true);
        frame = requestAnimationFrame(tick);
      })
      .catch(give);

    audio.addEventListener('error', give);
    audio.addEventListener('ended', () => setLive(false));

    return () => {
      dropped = true;
      cancelAnimationFrame(frame);
      audio.removeEventListener('error', give);
    };
  }, [start]);

  return { live, silent };
}
