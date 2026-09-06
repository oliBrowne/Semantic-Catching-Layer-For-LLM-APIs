/**
 * Dust, not glitter.
 *
 * A sparse field of warm motes suspended in the dark. They drift on their own,
 * lean when the page is scrolled, settle when it is still, and can be asked to
 * gather toward a word or to hold perfectly still for a beat.
 *
 * Everything is drawn from two pre-rendered radial sprites, so a full field is
 * a few dozen `drawImage` calls per frame and no per-pixel work at all.
 */

export type ParticleFieldOptions = {
  count: number;
  pixelRatio: number;
  reducedMotion: boolean;
};

export type ParticleField = {
  /** Draw the motes toward a viewport point for a while. */
  gather(x: number, y: number, strength: number, ms: number): void;
  /** Hold the whole field still. */
  hold(ms: number): void;
  /** Release a few deep-red embers from a viewport point. */
  ember(x: number, y: number, count: number): void;
  /** 0 empties the field, 1 fills it. */
  setDensity(value: number): void;
  destroy(): void;
};

type Mote = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  phase: number;
  drift: number;
};

type Ember = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
};

const IVORY = [244, 232, 210] as const;
const EMBER = [124, 26, 24] as const;

export function createParticleField(
  canvas: HTMLCanvasElement,
  options: ParticleFieldOptions,
): ParticleField {
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) {
    return {
      gather: () => {},
      hold: () => {},
      ember: () => {},
      setDensity: () => {},
      destroy: () => {},
    };
  }

  const ctx = context;
  const ivorySprite = makeSprite(IVORY);
  const emberSprite = makeSprite(EMBER);

  let width = 0;
  let height = 0;
  let dpr = options.pixelRatio;

  const motes: Mote[] = [];
  const embers: Ember[] = [];

  let density = 1;
  let targetDensity = 1;

  // Scroll energy: how much the air in the room has been disturbed.
  let lastScroll = typeof window !== 'undefined' ? window.scrollY : 0;
  let scrollPush = 0;
  let agitation = 0;

  let gatherPoint: { x: number; y: number; strength: number; until: number; total: number } | null =
    null;
  let holdUntil = 0;
  let stillness = 0; // 0 = moving freely, 1 = perfectly held

  let frame = 0;
  let last = 0;
  let running = true;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (motes.length === 0) seed();
  }

  function seed() {
    motes.length = 0;
    for (let i = 0; i < options.count; i += 1) {
      motes.push(makeMote(Math.random() * height));
    }
  }

  function makeMote(y: number): Mote {
    const z = 0.35 + Math.random() * 0.65;
    return {
      x: Math.random() * width,
      y,
      z,
      vx: (Math.random() - 0.5) * 0.05,
      vy: -(0.006 + Math.random() * 0.03) * z,
      radius: (0.5 + Math.random() * 1.5) * z,
      alpha: (0.06 + Math.random() * 0.2) * z,
      phase: Math.random() * Math.PI * 2,
      drift: 0.12 + Math.random() * 0.3,
    };
  }

  function onScroll() {
    const now = window.scrollY;
    const delta = now - lastScroll;
    lastScroll = now;
    scrollPush += delta * 0.012;
    agitation = Math.min(1, agitation + Math.abs(delta) * 0.0025);
  }

  function tick(time: number) {
    if (!running) return;
    frame = requestAnimationFrame(tick);

    const dt = last === 0 ? 16 : Math.min(48, time - last);
    last = time;
    const step = dt / 16.667;

    density += (targetDensity - density) * 0.04;

    // The room settles when nothing is happening.
    agitation *= 0.965;
    scrollPush *= 0.9;

    const held = time < holdUntil;
    stillness += ((held ? 1 : 0) - stillness) * (held ? 0.16 : 0.045);
    const motion = (1 - stillness) * (0.42 + agitation * 0.9);

    if (gatherPoint && time > gatherPoint.until) gatherPoint = null;

    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';

    const visible = Math.round(motes.length * density);

    for (let i = 0; i < motes.length; i += 1) {
      const mote = motes[i];

      mote.phase += 0.0032 * mote.drift * step;
      mote.x += (mote.vx + Math.sin(mote.phase) * 0.09 * mote.drift) * motion * step;
      mote.y += mote.vy * motion * step + scrollPush * mote.z * step;

      if (gatherPoint) {
        const remaining = (gatherPoint.until - time) / gatherPoint.total;
        const dx = gatherPoint.x - mote.x;
        const dy = gatherPoint.y - mote.y;
        const distance = Math.hypot(dx, dy) || 1;
        // Falls off with distance, so only the nearby air is disturbed.
        const pull =
          (gatherPoint.strength * remaining * mote.z) / Math.max(60, distance * 0.55);
        mote.x += (dx / distance) * pull * step;
        mote.y += (dy / distance) * pull * step;
      }

      wrap(mote);

      if (i >= visible) continue;

      const size = mote.radius * 9;
      ctx.globalAlpha = mote.alpha * density;
      ctx.drawImage(ivorySprite, mote.x - size / 2, mote.y - size / 2, size, size);
    }

    for (let i = embers.length - 1; i >= 0; i -= 1) {
      const spark = embers[i];
      spark.life -= dt;
      if (spark.life <= 0) {
        embers.splice(i, 1);
        continue;
      }
      spark.x += spark.vx * motion * step;
      spark.y += spark.vy * motion * step;
      spark.vx *= 0.995;
      spark.vy *= 0.995;

      const t = spark.life / spark.maxLife;
      // Bloom in, then a long dim fade out.
      const fade = t > 0.86 ? (1 - t) / 0.14 : t / 0.86;
      const size = spark.radius * 11;
      ctx.globalAlpha = 0.3 * fade;
      ctx.drawImage(emberSprite, spark.x - size / 2, spark.y - size / 2, size, size);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function wrap(mote: Mote) {
    const margin = 24;
    if (mote.y < -margin) {
      mote.y = height + margin;
      mote.x = Math.random() * width;
    } else if (mote.y > height + margin) {
      mote.y = -margin;
      mote.x = Math.random() * width;
    }
    if (mote.x < -margin) mote.x = width + margin;
    else if (mote.x > width + margin) mote.x = -margin;
  }

  function onVisibility() {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(frame);
    } else if (!running) {
      running = true;
      last = 0;
      frame = requestAnimationFrame(tick);
    }
  }

  const resizeObserver = new ResizeObserver(() => {
    dpr = options.pixelRatio;
    resize();
  });
  resizeObserver.observe(canvas);
  resize();

  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  if (options.reducedMotion) {
    // Still air. The motes are there; they simply do not move.
    holdUntil = Number.POSITIVE_INFINITY;
  }
  frame = requestAnimationFrame(tick);

  return {
    gather(x, y, strength, ms) {
      if (options.reducedMotion) return;
      gatherPoint = { x, y, strength, until: performance.now() + ms, total: ms };
    },
    hold(ms) {
      if (options.reducedMotion) return;
      holdUntil = performance.now() + ms;
    },
    ember(x, y, count) {
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.05 + Math.random() * 0.22;
        const maxLife = 9000 + Math.random() * 7000;
        embers.push({
          x: x + (Math.random() - 0.5) * 14,
          y: y + (Math.random() - 0.5) * 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.02,
          radius: 0.6 + Math.random() * 1.1,
          life: maxLife,
          maxLife,
        });
      }
    },
    setDensity(value) {
      targetDensity = Math.max(0, Math.min(1, value));
    },
    destroy() {
      running = false;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}

/** A soft round mote, rendered once and reused for every particle. */
function makeSprite(rgb: readonly [number, number, number]): HTMLCanvasElement {
  const size = 64;
  const sprite = document.createElement('canvas');
  sprite.width = size;
  sprite.height = size;
  const ctx = sprite.getContext('2d');
  if (!ctx) return sprite;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  const [r, g, b] = rgb;
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
  gradient.addColorStop(0.28, `rgba(${r}, ${g}, ${b}, 0.55)`);
  gradient.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, 0.12)`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return sprite;
}
