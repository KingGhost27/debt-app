/**
 * RollingNumber - a currency figure whose digits roll to a new value.
 *
 * Adapted from the 21st.dev component "Number Ticker Currency Counter"
 * (21st id 21513, by shadcnspace): https://21st.dev/community/components/shadcnspace/number-ticker-02/default
 * The original wraps @number-flow/react. This version keeps the same props
 * (value, currency, decimals, className) and the same idea, a currency
 * number that rolls between values, but is built with plain CSS transforms
 * so the app takes on no new runtime dependency. Each digit is a 0-9 column
 * that slides to its value; symbols stay put. Under prefers-reduced-motion
 * the digits jump to the new value with no roll.
 */

import { useMemo } from 'react';

interface RollingNumberProps {
  value: number;
  currency?: string;
  decimals?: number;
  className?: string;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export function RollingNumber({ value, currency = 'USD', decimals = 0, className }: RollingNumberProps) {
  const text = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(Number.isFinite(value) ? value : 0),
    [value, currency, decimals],
  );
  const chars = [...text];

  return (
    <span className={`rn${className ? ` ${className}` : ''}`}>
      <span className="ranch-sr">{text}</span>
      <span aria-hidden="true" className="rn-row">
        {chars.map((ch, i) => {
          // Key from the right so the ones digit keeps its column as digits are added or dropped.
          const key = chars.length - i;
          if (ch >= '0' && ch <= '9') {
            return (
              <span key={key} className="rn-d" style={{ '--rn-d': Number(ch) } as React.CSSProperties}>
                <span className="rn-col">
                  {DIGITS.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </span>
              </span>
            );
          }
          return (
            <span key={key} className="rn-s">
              {ch}
            </span>
          );
        })}
      </span>
    </span>
  );
}
