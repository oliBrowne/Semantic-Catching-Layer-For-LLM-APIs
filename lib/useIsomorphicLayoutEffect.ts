'use client';

import { useEffect, useLayoutEffect } from 'react';

/**
 * `useLayoutEffect`, minus the server-rendering warning.
 *
 * Every scene measures or positions something before the first paint, which is
 * exactly what layout effects are for — but they are meaningless on the server,
 * and React says so loudly unless you make the swap explicit.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
