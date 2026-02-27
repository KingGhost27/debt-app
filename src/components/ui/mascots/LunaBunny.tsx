/**
 * LunaBunny - Default/Lavender Theme Mascot
 *
 * Luna the bunny! Soft lavender ears with a tiny gold star crown.
 */

interface MascotProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function LunaBunny({ size = 72, className = '', animated = true }: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? 'animate-kawaii-float' : ''} ${className}`}
      style={animated ? { animationDuration: '3s' } : undefined}
      aria-label="Luna the bunny mascot"
      role="img"
    >
      {/* Long floppy ears */}
      <ellipse cx="35" cy="22" rx="8" ry="22" fill="white" stroke="#d1d5db" strokeWidth="1.5" transform="rotate(-10 35 22)" />
      <ellipse cx="65" cy="22" rx="8" ry="22" fill="white" stroke="#d1d5db" strokeWidth="1.5" transform="rotate(10 65 22)" />
      {/* Inner ears (lavender) */}
      <ellipse cx="35" cy="22" rx="5" ry="16" fill="#c4b5fd" transform="rotate(-10 35 22)" />
      <ellipse cx="65" cy="22" rx="5" ry="16" fill="#c4b5fd" transform="rotate(10 65 22)" />

      {/* Head */}
      <ellipse cx="50" cy="57" rx="36" ry="38" fill="white" stroke="#d1d5db" strokeWidth="1.5" />

      {/* Star crown */}
      <polygon
        points="50,8 52.4,14.5 59,14.5 53.8,18.5 55.8,25 50,21 44.2,25 46.2,18.5 41,14.5 47.6,14.5"
        fill="#fbbf24"
        stroke="#d97706"
        strokeWidth="0.8"
      />

      {/* Eye whites */}
      <ellipse cx="38" cy="55" rx="9" ry="10" fill="white" stroke="#1e1b2e" strokeWidth="1.5" />
      <ellipse cx="62" cy="55" rx="9" ry="10" fill="white" stroke="#1e1b2e" strokeWidth="1.5" />
      {/* Pupils */}
      <ellipse cx="39" cy="56" rx="6" ry="7" fill="#1e1b2e" />
      <ellipse cx="63" cy="56" rx="6" ry="7" fill="#1e1b2e" />
      {/* Eye highlights */}
      <circle cx="41.5" cy="52.5" r="2.2" fill="white" />
      <circle cx="65.5" cy="52.5" r="2.2" fill="white" />

      {/* Rosy cheeks */}
      <ellipse cx="27" cy="66" rx="8" ry="5" fill="#f9a8c9" opacity="0.55" />
      <ellipse cx="73" cy="66" rx="8" ry="5" fill="#f9a8c9" opacity="0.55" />

      {/* Nose */}
      <ellipse cx="50" cy="70" rx="4" ry="3" fill="#f9a8c9" />

      {/* Smile */}
      <path d="M43 76 Q50 82 57 76" stroke="#d46898" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
