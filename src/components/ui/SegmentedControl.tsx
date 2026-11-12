/**
 * SegmentedControl: a radio group with a sliding thumb.
 *
 * Adapted from 21st.dev "Segmented Control" (id 23552, by ddoemonn):
 * https://21st.dev/@ddoemonn/components/segmented-control
 * The original animates with the `motion` library; here the same two-layer
 * mask trick (labels inside the thumb counter-translate so they stay put) runs
 * on CSS transforms with an overshoot ease, so there is no new dependency.
 * Arrow keys, Home and End move the selection; reduced motion snaps.
 * Colors come from the ranch tokens (see modal.css section 6).
 */

import { useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import './modal.css';

export interface SegmentedOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({ options, label, value, onValueChange, className = '' }: SegmentedControlProps) {
  const count = Math.max(1, options.length);
  const found = options.findIndex((o) => o.value === value);
  const index = found < 0 ? 0 : found;
  const [hovered, setHovered] = useState(-1);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const seek = (from: number, dir: number) => {
    let i = from;
    for (let k = 0; k < count; k++) {
      i = (i + dir + count) % count;
      if (!options[i]?.disabled) return i;
    }
    return from;
  };
  const go = (i: number) => {
    const o = options[i];
    if (!o || o.disabled) return;
    buttons.current[i]?.focus();
    if (o.value !== value) onValueChange(o.value);
  };
  const onKeyDown = (e: KeyboardEvent, i: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(seek(i, 1)); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(seek(i, -1)); }
    else if (e.key === 'Home') { e.preventDefault(); go(seek(count - 1, 1)); }
    else if (e.key === 'End') { e.preventDefault(); go(seek(0, -1)); }
  };

  return (
    <div role="radiogroup" aria-label={label} className={`seg ${className}`} style={{ '--seg-n': count, '--seg-i': index } as CSSProperties}>
      <div className="seg-grid">
        {options.map((o, i) => (
          <span key={o.value} aria-hidden className={`seg-lab${o.disabled ? ' is-off' : ''}${hovered === i && i !== index ? ' is-hover' : ''}`}>{o.label}</span>
        ))}
        <div className="seg-thumb" aria-hidden>
          <div className="seg-mask">
            <div className="seg-mask-row">
              {options.map((o) => <span key={o.value} className="seg-lab">{o.label}</span>)}
            </div>
          </div>
        </div>
        <div className="seg-hit" onPointerLeave={() => setHovered(-1)}>
          {options.map((o, i) => (
            <button
              key={o.value}
              ref={(n) => { buttons.current[i] = n; }}
              type="button"
              role="radio"
              aria-checked={i === index}
              aria-disabled={o.disabled || undefined}
              tabIndex={i === index ? 0 : -1}
              onClick={() => !o.disabled && value !== o.value && onValueChange(o.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              onPointerEnter={() => !o.disabled && setHovered(i)}
            >
              <span className="sr-only">{typeof o.label === 'string' ? o.label : o.value}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
