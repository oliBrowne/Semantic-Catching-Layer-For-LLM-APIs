'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { SPOTIFY_TRACKS } from '@/content/music';
import { useSound } from '@/lib/audio/context';

/** Spotify's embed API, as much of it as this uses. */
type Controller = {
  loadUri: (uri: string) => void;
  play: () => void;
  pause: () => void;
  destroy: () => void;
  addListener: (event: string, handler: (payload: PlaybackEvent) => void) => void;
};

type PlaybackEvent = { data: { position: number; duration: number; isPaused: boolean } };

type IFrameApi = {
  createController: (
    element: HTMLElement,
    options: { uri: string; width: string | number; height: string | number },
    callback: (controller: Controller) => void,
  ) => void;
};

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: IFrameApi) => void;
  }
}

const TRACKS = SPOTIFY_TRACKS.filter(Boolean);
const SCRIPT = 'https://open.spotify.com/embed/iframe-api/v1';

/**
 * Spotify's own player, for when there are no audio files.
 *
 * This is the licensed way to put a particular recording on a page, and it is
 * the only way to play these two songs without holding copies of them. What it
 * costs: a listener signed in to Spotify hears the whole song and everyone else
 * hears about thirty seconds, and the widget has to be visible: Spotify's
 * terms do not allow it to be hidden, so it sits small and dimmed at the foot
 * of the screen rather than being tucked out of sight.
 *
 * If any of this fails to load, it fails silently. The letter never depends on
 * it.
 */
export default function SpotifyPlayer() {
  const { source, confirm } = useSound();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<Controller | null>(null);
  const indexRef = useRef(0);
  const handingOver = useRef(false);

  useEffect(() => {
    if (source !== 'spotify' || TRACKS.length === 0) return;
    const host = hostRef.current;
    if (!host || controllerRef.current) return;

    const build = (api: IFrameApi) => {
      api.createController(
        host,
        { uri: `spotify:track:${TRACKS[0]}`, width: '100%', height: 80 },
        (controller) => {
          controllerRef.current = controller;

          controller.addListener('playback_update', ({ data }) => {
            // Proof that this is actually making a noise, rather than sitting
            // there loaded and paused because the browser would not autoplay
            // it. Without this the sound quietly falls back to something else.
            if (!data.isPaused && data.position > 0) confirm();

            // The embed reports position in milliseconds, and reaching the end
            // is the only signal that a track is over.
            if (!data.duration || handingOver.current) return;
            if (data.position >= data.duration - 900) {
              handingOver.current = true;
              indexRef.current = (indexRef.current + 1) % TRACKS.length;
              controller.loadUri(`spotify:track:${TRACKS[indexRef.current]}`);
              window.setTimeout(() => {
                controller.play();
                handingOver.current = false;
              }, 600);
            }
          });

          controller.play();
          if (shellRef.current) {
            gsap.to(shellRef.current, { opacity: 1, duration: 1.6, ease: 'power2.out' });
          }
        },
      );
    };

    if (window.onSpotifyIframeApiReady === undefined) {
      window.onSpotifyIframeApiReady = build;
    } else {
      const previous = window.onSpotifyIframeApiReady;
      window.onSpotifyIframeApiReady = (api) => {
        previous(api);
        build(api);
      };
    }

    if (!document.querySelector(`script[src="${SCRIPT}"]`)) {
      const script = document.createElement('script');
      script.src = SCRIPT;
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
    // `confirm` is stable for the life of the provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  useEffect(() => {
    if (source !== 'spotify') controllerRef.current?.pause();
  }, [source]);

  // Nothing in the document at all unless Spotify is what is actually playing.
  if (TRACKS.length === 0 || source !== 'spotify') return null;

  return (
    <div ref={shellRef} className="spotify" style={{ opacity: 0 }}>
      <div ref={hostRef} />
    </div>
  );
}
