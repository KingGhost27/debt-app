/**
 * Home page delight wiring: the cute cursor, the stardust trail, the pop on
 * every click or tap, and a one-time sparkle when a section title arrives.
 * Renders nothing itself; it mounts the shared stardust canvas while the
 * landing page is on screen and removes it (and the cursor) on the way out.
 *
 * - Mouse/trackpad only for the cursor and trail; touch gets the tap pop.
 * - Text fields keep the text cursor and never pop while typing.
 * - prefers-reduced-motion turns every particle off; the cursor stays.
 */

import { useEffect } from 'react';
import { burst, mountStardust, setStardustEnabled, setStardustPalette, sparkleRect, trail } from './stardust';
import './delight.css';

const CLICKABLE = 'a, button, [role="button"], summary, label, select, .cb-body, .cb-moo';
const TYPING = 'input, textarea, [contenteditable="true"]';

/** A rounded pointer in the theme color with a tiny gold star at its tail. */
function arrowCursor(fill: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
<path d="M4 3 L4 21.5 Q4 23.6 5.8 22.4 L10 18.8 L13.2 25.4 Q14 27 15.6 26.2 L17.2 25.4 Q18.7 24.6 17.9 23 L14.8 16.6 L20.4 16.4 Q22.5 16.2 21 14.7 Z" fill="${fill}" stroke="#FFFFFF" stroke-width="2.2" stroke-linejoin="round" paint-order="stroke"/>
<path d="M22.5 2.5 l1.2 2.9 l2.9 1.2 l-2.9 1.2 l-1.2 2.9 l-1.2 -2.9 l-2.9 -1.2 l2.9 -1.2 z" fill="#FFD95A" stroke="#C98A1B" stroke-width=".9" stroke-linejoin="round"/>
</svg>`;
}

/** A little star wand for anything clickable; the star's center is the hotspot. */
function wandCursor(stick: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
<path d="M12 12 L26 26" stroke="#FFFFFF" stroke-width="5.4" stroke-linecap="round"/>
<path d="M12 12 L26 26" stroke="${stick}" stroke-width="3" stroke-linecap="round"/>
<path d="M9 1.6 L11.2 6.4 L16.4 7 L12.5 10.5 L13.6 15.6 L9 13 L4.4 15.6 L5.5 10.5 L1.6 7 L6.8 6.4 Z" fill="#FFD95A" stroke="#C98A1B" stroke-width="1.3" stroke-linejoin="round"/>
<path d="M23 3 l.9 2.1 l2.1 .9 l-2.1 .9 l-.9 2.1 l-.9 -2.1 l-2.1 -.9 l2.1 -.9 z" fill="#FFFFFF" stroke="${stick}" stroke-width=".8"/>
</svg>`;
}

const asCursor = (svg: string, x: number, y: number, fallback: string) =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") ${x} ${y}, ${fallback}`;

export interface StardustProps {
  /** The theme's strong color: pointer fill and wand stick. */
  ink: string;
  /** A mid theme color for some of the sparkles. */
  theme: string;
  /** The theme's accent, for hearts. */
  accent: string;
}

export function Stardust({ ink, theme, accent }: StardustProps) {
  useEffect(() => {
    const unmount = mountStardust();
    const root = document.documentElement;
    root.classList.add('cb-cursor');

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyMotion = () => setStardustEnabled(!reduce.matches);
    applyMotion();
    reduce.addEventListener('change', applyMotion);

    // trail: one sparkle every few pixels of travel, denser over clickables
    let lx = -1e4;
    let ly = -1e4;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const eager = !!(e.target as Element | null)?.closest?.(CLICKABLE);
      const gap = eager ? 9 : 15;
      if (Math.hypot(e.clientX - lx, e.clientY - ly) < gap) return;
      lx = e.clientX;
      ly = e.clientY;
      trail(e.clientX, e.clientY, eager);
    };

    // a pop wherever someone clicks or taps (not while typing in a field)
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!t || t.closest?.(TYPING)) return;
      const big = e.pointerType !== 'touch' && !!t.closest?.(CLICKABLE);
      burst(e.clientX, e.clientY, big ? 'big' : 'small');
    };

    // keyboard activation has no pointer position: pop from the control's center
    const onClick = (e: MouseEvent) => {
      if (e.detail !== 0) return;
      const el = (e.target as Element | null)?.closest?.(CLICKABLE);
      if (!el) return;
      const r = el.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 'big');
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('click', onClick, true);

    // each section title sparkles once as it arrives
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          sparkleRect(en.target.getBoundingClientRect());
          io.unobserve(en.target);
        }
      },
      { threshold: 0.9 },
    );
    document.querySelectorAll('[data-cb-sparkle]').forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('click', onClick, true);
      reduce.removeEventListener('change', applyMotion);
      root.classList.remove('cb-cursor');
      unmount();
    };
  }, []);

  useEffect(() => {
    setStardustPalette({ theme, accent });
    const root = document.documentElement;
    root.style.setProperty('--cb-cur-arrow', asCursor(arrowCursor(ink), 4, 3, 'auto'));
    root.style.setProperty('--cb-cur-wand', asCursor(wandCursor(ink), 9, 8, 'pointer'));
    return () => {
      root.style.removeProperty('--cb-cur-arrow');
      root.style.removeProperty('--cb-cur-wand');
    };
  }, [ink, theme, accent]);

  return null;
}
