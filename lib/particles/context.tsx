'use client';

import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react';
import type { ParticleField } from './engine';

type AtmosphereApi = ParticleField & {
  /** Used by the canvas to publish itself once it exists. */
  attach: (field: ParticleField | null) => void;
};

const noop = () => {};

const AtmosphereContext = createContext<AtmosphereApi>({
  gather: noop,
  hold: noop,
  ember: noop,
  setDensity: noop,
  destroy: noop,
  attach: noop,
});

export function AtmosphereProvider({ children }: { children: ReactNode }) {
  const field = useRef<ParticleField | null>(null);

  // Scenes cue the atmosphere long before (and after) the canvas exists, so
  // every call is forwarded through a ref rather than bound to an instance.
  const api = useMemo<AtmosphereApi>(
    () => ({
      attach: (next) => {
        field.current = next;
      },
      gather: (x, y, strength, ms) => field.current?.gather(x, y, strength, ms),
      hold: (ms) => field.current?.hold(ms),
      ember: (x, y, count) => field.current?.ember(x, y, count),
      setDensity: (value) => field.current?.setDensity(value),
      destroy: () => field.current?.destroy(),
    }),
    [],
  );

  return <AtmosphereContext.Provider value={api}>{children}</AtmosphereContext.Provider>;
}

export function useAtmosphere(): AtmosphereApi {
  return useContext(AtmosphereContext);
}
