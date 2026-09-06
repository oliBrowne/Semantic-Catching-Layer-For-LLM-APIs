'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from '@/lib/scroll';
import { SECRET_LABEL, SECRET_NOTE } from '@/content/letter';
import Passage from './Passage';

/**
 * The last thing on the page, and the only thing you can open.
 *
 * Deliberately not a button: a few handwritten words with a line that draws
 * itself underneath them when you reach for it, the way you would underline
 * something by hand.
 */
export default function SecretMessage({ start = false }: { start?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  // The overlay has to escape the passage it lives in: every scene sets
  // `will-change: transform`, which makes `position: fixed` resolve against the
  // column rather than the window.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!overlay || !panel) return;

    if (open) {
      gsap.set(overlay, { display: 'grid' });
      gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power2.out' });
      gsap.fromTo(
        panel,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 1.1, delay: 0.15, ease: 'power2.out' },
      );
      panel.focus();
    } else {
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.in',
        onComplete: () => gsap.set(overlay, { display: 'none' }),
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      openerRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        className="secret__opener"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={SECRET_LABEL}
      >
        <Passage
          text={SECRET_LABEL}
          align="center"
          size={17}
          speed={560}
          start={start}
          glow={false}
          className="secret__label"
        />
        <span className="secret__rule" aria-hidden="true" />
      </button>

      {mounted
        ? createPortal(
          <div
            ref={overlayRef}
            className="secret__overlay"
            style={{ display: 'none' }}
            onClick={(event) => {
              if (event.target === overlayRef.current) setOpen(false);
            }}
          >
            <div
              ref={panelRef}
              className="secret__panel"
              role="dialog"
              aria-modal="true"
              aria-label={SECRET_LABEL}
              tabIndex={-1}
            >
              {/*
                Put the real thing here: an <audio controls src="/voice.m4a" /> with
                the recording in public/, or a few more sentences of your own.
              */}
              <Passage
                text={SECRET_NOTE}
                align="center"
                size={19}
                speed={620}
                start={open}
                className="secret__note"
              />

              <button type="button" className="secret__close" onClick={() => setOpen(false)}>
                close
              </button>
            </div>
          </div>,
            document.body,
          )
        : null}
    </>
  );
}
