'use client';

import HandwritingText, { type HandwritingTextProps } from './HandwritingText';
import { useSound } from '@/lib/audio/context';

export type PassageProps = Omit<HandwritingTextProps, 'onStrokeRef'> & {
  /** Renders in the warmer paper ink used on the letter itself. */
  paper?: boolean;
};

/**
 * A passage of the letter, wired to the room: the pen can be heard, and the
 * ink takes on whatever surface the passage is being written on.
 */
export default function Passage({ paper, className, ...props }: PassageProps) {
  const { strokeRef } = useSound();
  return (
    <HandwritingText
      {...props}
      className={[paper ? 'passage passage--paper' : 'passage', className]
        .filter(Boolean)
        .join(' ')}
      onStrokeRef={strokeRef}
    />
  );
}
