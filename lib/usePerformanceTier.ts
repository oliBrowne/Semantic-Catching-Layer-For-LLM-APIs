'use client';

import { useEffect, useState } from 'react';

export type PerformanceTier = {
  level: 'low' | 'medium' | 'high';
  reducedMotion: boolean;
  /** Cap for devicePixelRatio on canvas layers. */
  pixelRatio: number;
};

const DEFAULT_TIER: PerformanceTier = { level: 'medium', reducedMotion: false, pixelRatio: 2 };

function detect(): PerformanceTier {
  if (typeof window === 'undefined') return DEFAULT_TIER;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const dpr = window.devicePixelRatio || 1;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  let level: PerformanceTier['level'] = 'high';
  if (cores <= 4 || memory <= 3) level = 'medium';
  if (cores <= 2 || memory <= 2) level = 'low';
  // A phone doing this much compositing has a battery to think about.
  if (coarse && level === 'high' && cores < 8) level = 'medium';

  return {
    level,
    reducedMotion,
    pixelRatio: Math.min(dpr, level === 'low' ? 1.25 : level === 'medium' ? 1.75 : 2),
  };
}

/**
 * What this device can comfortably afford.
 *
 * Resolved after mount so the server and the first client render agree, then
 * refined once we can actually ask the browser about itself.
 */
export function usePerformanceTier(): PerformanceTier {
  const [tier, setTier] = useState<PerformanceTier>(DEFAULT_TIER);

  useEffect(() => {
    setTier(detect());
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setTier(detect());
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return tier;
}
