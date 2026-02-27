/**
 * MochiFrog - Keroppi Theme Mascot
 *
 * Mochi the frog! Bright green with big bulging eyes and a wide happy grin.
 */

interface MascotProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function MochiFrog({ size = 72, className = '', animated = true }: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? 'animate-kawaii-float' : ''} ${className}`}
      style={animated ? { animationDuration: '3s' } : undefined}
      aria-label="Mochi the frog mascot"
      role="img"
    >
      {/* Bulging eyes sitting on top of head */}
      <circle cx="33" cy="32" r="14" fill="#86efac" stroke="#16a34a" strokeWidth="1.5" />
      <circle cx="67" cy="32" r="14" fill="#86efac" stroke="#16a34a" strokeWidth="1.5" />

      {/* Head */}
      <ellipse cx="50" cy="62" rx="38" ry="34" fill="#86efac" stroke="#16a34a" strokeWidth="1.5" />

      {/* Eye whites (in the bulging circles) */}
      <ellipse cx="33" cy="32" rx="9" ry="10" fill="white" stroke="#1e1b2e" strokeWidth="1.5" />
      <ellipse cx="67" cy="32" rx="9" ry="10" fill="white" stroke="#1e1b2e" strokeWidth="1.5" />
      {/* Pupils */}
      <ellipse cx="34" cy="33" rx="6" ry="7" fill="#1e1b2e" />
      <ellipse cx="68" cy="33" rx="6" ry="7" fill="#1e1b2e" />
      {/* Eye highlights */}
      <circle cx="36.5" cy="29.5" r="2.2" fill="white" />
      <circle cx="70.5" cy="29.5" r="2.2" fill="white" />

      {/* Rosy cheeks */}
      <ellipse cx="25" cy="62" rx="8" ry="5" fill="#f9a8c9" opacity="0.55" />
      <ellipse cx="75" cy="62" rx="8" ry="5" fill="#f9a8c9" opacity="0.55" />

      {/* Very wide happy smile */}
      <path d="M30 68 Q50 84 70 68" stroke="#166534" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
