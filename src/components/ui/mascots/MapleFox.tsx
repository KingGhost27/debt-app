/**
 * MapleFox - Maple Theme Mascot
 *
 * Maple the fox! Orange coat with a white muzzle and a small leaf near one ear.
 */

interface MascotProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function MapleFox({ size = 72, className = '', animated = true }: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? 'animate-kawaii-float' : ''} ${className}`}
      style={animated ? { animationDuration: '3s' } : undefined}
      aria-label="Maple the fox mascot"
      role="img"
    >
      {/* Pointed fox ears (triangular) */}
      <path d="M18 50 L28 10 L44 44" fill="#fb923c" stroke="#ea580c" strokeWidth="1.2" />
      <path d="M56 44 L72 10 L82 50" fill="#fb923c" stroke="#ea580c" strokeWidth="1.2" />
      {/* Inner ear detail */}
      <path d="M24 44 L30 18 L40 42" fill="#fed7aa" />
      <path d="M60 42 L70 18 L76 44" fill="#fed7aa" />

      {/* Head */}
      <ellipse cx="50" cy="57" rx="36" ry="38" fill="#fb923c" stroke="#ea580c" strokeWidth="1.5" />

      {/* White muzzle / inner face area */}
      <ellipse cx="50" cy="73" rx="20" ry="16" fill="white" />

      {/* Leaf detail near left ear */}
      <ellipse cx="22" cy="24" rx="5" ry="3" fill="#d97706" transform="rotate(-30 22 24)" />
      <ellipse cx="20" cy="22" rx="3" ry="5" fill="#d97706" transform="rotate(-30 20 22)" />
      <line x1="18" y1="20" x2="24" y2="26" stroke="#92400e" strokeWidth="0.8" strokeLinecap="round" />

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
      <ellipse cx="50" cy="70" rx="4" ry="3" fill="#1e1b2e" />

      {/* Smile */}
      <path d="M43 78 Q50 84 57 78" stroke="#d46898" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
