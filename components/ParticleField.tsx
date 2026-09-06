'use client';

import { useEffect, useRef } from 'react';
import { createParticleField } from '@/lib/particles/engine';
import { useAtmosphere } from '@/lib/particles/context';
import { usePerformanceTier } from '@/lib/usePerformanceTier';

const COUNT_BY_TIER = { low: 26, medium: 48, high: 86 } as const;

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const atmosphere = useAtmosphere();
  const tier = usePerformanceTier();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const field = createParticleField(canvas, {
      count: COUNT_BY_TIER[tier.level],
      pixelRatio: tier.pixelRatio,
      reducedMotion: tier.reducedMotion,
    });

    // The field starts nearly empty; the first scroll brings the air to life.
    field.setDensity(0.18);
    atmosphere.attach(field);

    return () => {
      atmosphere.attach(null);
      field.destroy();
    };
  }, [atmosphere, tier.level, tier.pixelRatio, tier.reducedMotion]);

  return <canvas ref={canvasRef} className="particles" aria-hidden="true" />;
}
