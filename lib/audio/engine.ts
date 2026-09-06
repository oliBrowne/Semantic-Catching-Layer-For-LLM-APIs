/**
 * The sound of the room the letter was written in.
 *
 * Entirely synthesised, so there is nothing to download and nothing to buffer
 * before the first note: a low warm drone, a breath of room tone, an
 * occasional far-off bell, and the faintest scratch of a nib on paper timed to
 * the strokes being drawn on screen.
 *
 * Nothing here starts without a deliberate tap.
 */

export type LetterAudio = {
  start: () => Promise<void>;
  stop: () => void;
  /** Called as each pen stroke begins, with how long it will take. */
  pen: (durationSeconds: number) => void;
  playing: () => boolean;
};

const DRONE = [110, 164.81, 220];
const BELLS = [440, 523.25, 587.33, 659.25, 783.99];

export function createLetterAudio(): LetterAudio {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let bellTimer: number | null = null;
  let voices: AudioScheduledSourceNode[] = [];
  let active = false;
  let lastPen = 0;

  async function start() {
    if (active) return;
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;

    ctx = ctx ?? new Ctor();
    if (ctx.state === 'suspended') await ctx.resume();

    master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 4);
    master.connect(ctx.destination);

    buildDrone(ctx, master);
    buildRoomTone(ctx, master);
    scheduleBell();
    active = true;
  }

  function buildDrone(context: AudioContext, out: GainNode) {
    const shelf = context.createBiquadFilter();
    shelf.type = 'lowpass';
    shelf.frequency.value = 620;
    shelf.Q.value = 0.4;
    shelf.connect(out);

    DRONE.forEach((frequency, index) => {
      const osc = context.createOscillator();
      osc.type = index === 0 ? 'sine' : 'triangle';
      osc.frequency.value = frequency;

      const gain = context.createGain();
      gain.gain.value = [0.075, 0.04, 0.026][index];

      // A slow, uneven breath so the drone never sits perfectly still.
      const lfo = context.createOscillator();
      lfo.frequency.value = 0.03 + index * 0.017;
      const lfoGain = context.createGain();
      lfoGain.gain.value = [0.03, 0.018, 0.012][index];
      lfo.connect(lfoGain).connect(gain.gain);

      // And a touch of drift in pitch, like two instruments not quite agreeing.
      const detune = context.createOscillator();
      detune.frequency.value = 0.021 + index * 0.011;
      const detuneGain = context.createGain();
      detuneGain.gain.value = 3.5;
      detune.connect(detuneGain).connect(osc.detune);

      osc.connect(gain).connect(shelf);
      osc.start();
      lfo.start();
      detune.start();
      voices.push(osc, lfo, detune);
    });
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
    if (!active || !ctx || !master) return;
    const now = ctx.currentTime;
    // A nib is quiet and the strokes come fast; do not let them stack up.
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
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    if (bellTimer !== null) {
      window.clearTimeout(bellTimer);
      bellTimer = null;
    }

    const dying = voices;
    voices = [];
    active = false;
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

  return { start, stop, pen, playing: () => active };
}
