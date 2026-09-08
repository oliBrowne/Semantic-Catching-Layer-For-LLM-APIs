/**
 * The sound of the room the letter was written in.
 *
 * Two layers, and it only ever uses one of them:
 *
 * - If there is music in public/music/, it plays that, in order, looping the
 *   whole playlist, crossfading between tracks.
 * - If there is not: and there is not, in the repository, because those are
 *   commercial recordings: it synthesises a room instead: a low warm drone, a
 *   breath of room tone, an occasional far-off bell, and the faintest scratch
 *   of a nib timed to the strokes on screen.
 *
 * Nothing starts without a deliberate tap, because no browser will allow it to.
 */

import { CROSSFADE, PLAYLIST, SPOTIFY_TRACKS, VOLUME, type Track } from '@/content/music';
import { READING } from '@/lib/voice';

/** Where the sound ended up coming from. */
export type SoundSource = 'none' | 'files' | 'spotify' | 'room';

export type LetterAudio = {
  /** Resolves with whatever it managed to find to play. */
  start: () => Promise<SoundSource>;
  stop: () => void;
  /** Called as each pen stroke begins. Ignored while music is playing. */
  pen: (durationSeconds: number) => void;
  playing: () => boolean;
  /** What is actually sounding: a track title, or the synthesised fallback. */
  now: () => string | null;
  /**
   * Set how loud the music is relative to normal, 0 to 1. Used to put it under
   * a voice: a reading has to be the loudest thing in the room or there is no
   * point having recorded it.
   */
  duck: (level: number) => void;
  /**
   * Called when a source that was handed control turned out to be silent.
   * Resolves with whatever is actually playing now.
   */
  giveUp: () => Promise<SoundSource>;
};

/** How loud the synthesised room sits when nothing is over it. */
const ROOM_LEVEL = 0.55;

/**
 * Four slow major-seventh chords that hand over to each other, which is the
 * whole piece of music. Voiced low and close so they wash together rather than
 * sounding like four separate events: Fmaj7, Cmaj7, Dm7, B flat maj7.
 */
const PROGRESSION = [
  [87.31, 220.0, 261.63, 329.63],
  [130.81, 164.81, 196.0, 246.94],
  [146.83, 174.61, 220.0, 261.63],
  [116.54, 146.83, 174.61, 220.0],
];

/** How long each chord is held before the next one starts underneath it. */
const CHORD = 13;
/** Overlap, so a chord is always arriving while the one before it leaves. */
const BLOOM = 4.5;

const BELLS = [523.25, 587.33, 659.25, 783.99, 880];

export function createLetterAudio(): LetterAudio {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let bellTimer: number | null = null;
  let chordTimer: number | null = null;
  let voices: AudioScheduledSourceNode[] = [];
  let active = false;
  let lastPen = 0;

  // Music, when there is any.
  let players: HTMLAudioElement[] = [];
  let index = 0;
  let watcher: number | null = null;
  let musical = false;
  let titles: string[] = [];
  let title: string | null = null;
  let ducked = 1;

  /** How loud the music should be right now, given whatever is over it. */
  const level = () => VOLUME * ducked;

  /** The first of a track's candidate files that actually exists, if any. */
  async function locate(track: Track): Promise<string | null> {
    for (const src of track.sources) {
      try {
        const head = await fetch(src, { method: 'HEAD' });
        if (head.ok) return src;
        // Not every static host answers HEAD. Ask for the first byte instead
        // before concluding the file is not there.
        const probe = await fetch(src, { headers: { Range: 'bytes=0-0' } });
        if (probe.ok) return src;
      } catch {
        /* try the next extension */
      }
    }
    return null;
  }

  function element(src: string): HTMLAudioElement {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = 0;
    audio.crossOrigin = 'anonymous';
    return audio;
  }

  /**
   * Hands from one track to the next before the first has finished, and wraps
   * back to the beginning of the playlist, so it plays for as long as the
   * letter is open.
   */
  function playFrom(next: number) {
    if (players.length === 0) return;
    const current = players[next % players.length];
    index = next % players.length;

    title = titles[index] ?? null;
    current.currentTime = 0;
    current.volume = 0;
    void current.play().catch(() => {});
    fade(current, level(), 2.5);

    if (watcher !== null) window.clearInterval(watcher);
    watcher = window.setInterval(() => {
      if (!current.duration || Number.isNaN(current.duration)) return;
      const left = current.duration - current.currentTime;
      if (left <= CROSSFADE) {
        fade(current, 0, CROSSFADE);
        window.clearInterval(watcher!);
        watcher = null;
        window.setTimeout(() => current.pause(), CROSSFADE * 1000);
        playFrom(index + 1);
      }
    }, 250);
  }

  function fade(audio: HTMLAudioElement, to: number, seconds: number) {
    const from = audio.volume;
    const started = performance.now();
    const step = () => {
      const t = Math.min(1, (performance.now() - started) / (seconds * 1000));
      audio.volume = Math.max(0, Math.min(1, from + (to - from) * t));
      if (t < 1) requestAnimationFrame(step);
    };
    step();
  }

  async function start(): Promise<SoundSource> {
    if (active) return musical ? 'files' : 'room';
    active = true;

    const found: { track: Track; src: string }[] = [];
    for (const track of PLAYLIST) {
      const src = await locate(track);
      if (src) found.push({ track, src });
    }

    if (found.length > 0) {
      musical = true;
      titles = found.map((entry) => entry.track.title);
      players = found.map((entry) => element(entry.src));
      playFrom(0);
      return 'files';
    }

    // No files, but there may be Spotify. That is a separate component with an
    // iframe of its own, so nothing is played here: it is handed over.
    //
    // Handed over on trial, though. A page that says it is playing music and
    // then plays none is worse than one that admits it has none, and there are
    // several ordinary reasons the embed makes no sound: a browser that will
    // not autoplay a cross-origin iframe, which is most of them on a phone; a
    // blocked script; a track that will not load. So the handover is given a
    // few seconds to prove itself, and `giveUp` below is what happens if it
    // does not.
    //
    // Never underneath a reading, either: the embed exposes no volume control
    // at all, so a song played through it cannot be put under a voice, and the
    // two at the same level are neither of them audible.
    if (SPOTIFY_TRACKS.some(Boolean) && READING === null) {
      musical = true;
      title = 'Spotify';
      return 'spotify';
    }

    return room();
  }

  /**
   * The music this makes for itself: four slow chords, some air, and the
   * occasional bell. It needs nothing from anyone and it always works, which
   * is why everything else falls back to it.
   */
  async function room(): Promise<SoundSource> {
    if (ctx && master) return 'room';
    musical = false;
    title = 'room tone';
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!Ctor) return 'none';
    ctx = ctx ?? new Ctor();
    if (ctx.state === 'suspended') await ctx.resume();

    master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(ROOM_LEVEL * ducked, ctx.currentTime + 4);
    master.connect(ctx.destination);

    buildRoomTone(ctx, master);
    startProgression();
    scheduleBell();
    return 'room';
  }

  /** Spotify never made a sound. Play something that will. */
  async function giveUp(): Promise<SoundSource> {
    if (!active) return 'none';
    return room();
  }

  /** Take the music down under something, or bring it back up. */
  function duck(next: number) {
    ducked = Math.max(0, Math.min(1, next));
    const player = players[index];
    if (player) fade(player, level(), 1.6);
    if (ctx && master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ctx.currentTime);
      master.gain.linearRampToValueAtTime(
        Math.max(0.0001, ROOM_LEVEL * ducked),
        ctx.currentTime + 1.6,
      );
    }
  }

  /**
   * One chord, swelling in and falling away again.
   *
   * Every note is its own oscillator with its own slow drift, so the chord
   * never sits perfectly still and never lands exactly in tune with itself,
   * which is the difference between a chord and a hum.
   */
  function playChord(context: AudioContext, out: GainNode, chord: number[], when: number) {
    const shelf = context.createBiquadFilter();
    shelf.type = 'lowpass';
    shelf.frequency.value = 900;
    shelf.Q.value = 0.5;
    shelf.connect(out);

    chord.forEach((frequency, position) => {
      const osc = context.createOscillator();
      osc.type = position === 0 ? 'sine' : 'triangle';
      osc.frequency.value = frequency;

      const gain = context.createGain();
      // The root carries the chord; the voices above it only colour.
      const peak = [0.3, 0.15, 0.115, 0.085][position] ?? 0.08;
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.linearRampToValueAtTime(peak, when + BLOOM);
      gain.gain.setValueAtTime(peak, when + CHORD - 1);
      gain.gain.linearRampToValueAtTime(0.0001, when + CHORD + BLOOM);

      // Two instruments not quite agreeing about the note.
      const drift = context.createOscillator();
      drift.frequency.value = 0.021 + position * 0.011;
      const driftGain = context.createGain();
      driftGain.gain.value = 4;
      drift.connect(driftGain).connect(osc.detune);

      osc.connect(gain).connect(shelf);
      osc.start(when);
      drift.start(when);
      osc.stop(when + CHORD + BLOOM + 0.5);
      drift.stop(when + CHORD + BLOOM + 0.5);
      voices.push(osc, drift);

      osc.onended = () => {
        voices = voices.filter((voice) => voice !== osc && voice !== drift);
        gain.disconnect();
      };
    });
  }

  /**
   * Keep the progression going, scheduling each chord a little before it is
   * due so the browser has time to build it.
   */
  function startProgression() {
    if (!ctx || !master) return;
    let next = ctx.currentTime + 0.15;
    let step = 0;

    const pump = () => {
      if (!ctx || !master || !active) return;
      while (next < ctx.currentTime + CHORD) {
        playChord(ctx, master, PROGRESSION[step % PROGRESSION.length], next);
        next += CHORD;
        step += 1;
      }
    };

    pump();
    chordTimer = window.setInterval(pump, 2000);
  }

  function buildRoomTone(context: AudioContext, out: GainNode) {
    const seconds = 4;
    const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < data.length; i += 1) {
      // A one-pole filter turns white noise into something closer to air.
      previous = previous * 0.97 + (Math.random() * 2 - 1) * 0.03;
      data[i] = previous;
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const low = context.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 440;

    const gain = context.createGain();
    gain.gain.value = 0.5;

    source.connect(low).connect(gain).connect(out);
    source.start();
    voices.push(source);
  }

  function scheduleBell() {
    if (typeof window === 'undefined') return;
    bellTimer = window.setTimeout(
      () => {
        ring();
        scheduleBell();
      },
      7000 + Math.random() * 11000,
    );
  }

  function ring() {
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    const frequency = BELLS[Math.floor(Math.random() * BELLS.length)];
    const decay = 4 + Math.random() * 4;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;

    const body = ctx.createBiquadFilter();
    body.type = 'lowpass';
    body.frequency.value = 1600;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    osc.connect(body).connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + decay + 0.2);
  }

  function pen(durationSeconds: number) {
    // With music playing, a nib on paper is just grit on top of it.
    if (!active || musical || !ctx || !master) return;
    const now = ctx.currentTime;
    if (now - lastPen < 0.045) return;
    lastPen = now;

    const length = Math.max(0.05, Math.min(0.6, durationSeconds));
    const frames = Math.ceil(ctx.sampleRate * (length + 0.05));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 1900 + Math.random() * 1400;
    band.Q.value = 0.7;

    const shelf = ctx.createBiquadFilter();
    shelf.type = 'highpass';
    shelf.frequency.value = 900;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.014 + Math.random() * 0.008, now + 0.012);
    gain.gain.linearRampToValueAtTime(0.0001, now + length + 0.04);

    source.connect(band).connect(shelf).connect(gain).connect(master);
    source.start(now);
    source.stop(now + length + 0.06);
  }

  function stop() {
    active = false;
    title = null;

    if (watcher !== null) {
      window.clearInterval(watcher);
      watcher = null;
    }
    players.forEach((audio) => {
      fade(audio, 0, 1.2);
      window.setTimeout(() => audio.pause(), 1300);
    });

    if (!ctx || !master) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    if (bellTimer !== null) {
      window.clearTimeout(bellTimer);
      bellTimer = null;
    }
    if (chordTimer !== null) {
      window.clearInterval(chordTimer);
      chordTimer = null;
    }

    const dying = voices;
    voices = [];
    window.setTimeout(() => {
      dying.forEach((voice) => {
        try {
          voice.stop();
        } catch {
          /* already stopped */
        }
      });
      master?.disconnect();
      master = null;
    }, 1800);
  }

  return { start, stop, pen, playing: () => active, now: () => title, duck, giveUp };
}
