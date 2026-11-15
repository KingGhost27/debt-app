/**
 * Sparkles that twinkle around a word, for the debt-free date in the
 * calculator results.
 *
 * Adapted from 21st.dev #874 "Sparkles Text" (magicui, dillionverma): the
 * star shape and the in-out twinkle. Rebuilt in plain CSS: the original
 * needs framer-motion and re-renders ten times a second; here each star is a
 * fixed spot with its own rhythm, so nothing re-renders. Under reduced motion
 * the stars hold still.
 */

import type { CSSProperties, ReactNode } from 'react';

const STAR =
  'M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z';

/** Spots around the word box: x/y in %, rhythm, delay and size. */
const SPOTS = [
  { x: -9, y: -14, t: 1.7, d: 0, s: 0.95 },
  { x: 96, y: -10, t: 2.1, d: 0.6, s: 0.7 },
  { x: 28, y: -30, t: 1.9, d: 1.2, s: 0.5 },
  { x: 102, y: 62, t: 2.3, d: 0.3, s: 0.8 },
  { x: -4, y: 74, t: 2.0, d: 1.5, s: 0.6 },
  { x: 64, y: 92, t: 1.8, d: 0.9, s: 0.55 },
];

export function SparkleWord({ children, colors = ['#FFE58A', '#FFFFFF'] }: { children: ReactNode; colors?: [string, string] }) {
  return (
    <span className="cb-sw">
      {SPOTS.map((s, i) => (
        <svg
          key={i}
          className="cb-sw-star"
          viewBox="0 0 21 21"
          aria-hidden="true"
          focusable="false"
          style={{ left: `${s.x}%`, top: `${s.y}%`, '--t': `${s.t}s`, '--d': `${s.d}s`, '--s': s.s } as CSSProperties}
        >
          <path d={STAR} fill={colors[i % 2]} />
        </svg>
      ))}
      {children}
    </span>
  );
}
