/**
 * ShadowBunny - Kuromi Theme Mascot
 *
 * Shadow the dark bunny! Mischievous purple rebel with spiky bangs.
 */

interface MascotProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function ShadowBunny({ size = 72, className = '', animated = true }: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? 'animate-kawaii-float' : ''} ${className}`}
      style={animated ? { animationDuration: '3s' } : undefined}
      aria-label="Shadow the dark bunny mascot"
      role="img"
    >
      {/* Pointy upright ears */}
      <path d="M30 40 L26 6 L42 34" fill="#4c1d95" stroke="#3b0764" strokeWidth="1.5" />
      <path d="M70 40 L74 6 L58 34" fill="#4c1d95" stroke="#3b0764" strokeWidth="1.5" />
      {/* Inner ears */}
      <path d="M32 36 L29 14 L40 33" fill="#7c3aed" />
      <path d="M68 36 L71 14 L60 33" fill="#7c3aed" />

      {/* Head */}
      <ellipse cx="50" cy="57" rx="36" ry="38" fill="#4c1d95" stroke="#3b0764" strokeWidth="1.5" />

      {/* Spiky fringe bangs */}
      <path d="M22 42 L30 28 L38 40 L46 26 L54 40 L62 28 L70 42 L78 30" fill="#3b0764" stroke="#3b0764" strokeWidth="1" strokeLinejoin="round" />

      {/* Eye whites */}
      <ellipse cx="38" cy="55" rx="9" ry="10" fill="white" stroke="#1e1b2e" strokeWidth="1.5" />
      <ellipse cx="62" cy="55" rx="9" ry="10" fill="white" stroke="#1e1b2e" strokeWidth="1.5" />
      {/* Pupils */}
      <ellipse cx="39" cy="56" rx="6" ry="7" fill="#1e1b2e" />
      <ellipse cx="63" cy="56" rx="6" ry="7" fill="#1e1b2e" />
      {/* Eye highlights */}
      <circle cx="41.5" cy="52.5" r="2.2" fill="white" />
      <circle cx="65.5" cy="52.5" r="2.2" fill="white" />

      {/* Rosy cheeks (slightly purple-tinted) */}
      <ellipse cx="27" cy="66" rx="8" ry="5" fill="#c084fc" opacity="0.5" />
      <ellipse cx="73" cy="66" rx="8" ry="5" fill="#c084fc" opacity="0.5" />

      {/* Nose */}
      <ellipse cx="50" cy="70" rx="4" ry="3" fill="#a78bfa" />

      {/* Mischievous smirk (asymmetric) */}
      <path d="M44 78 Q52 83 60 76" stroke="#c084fc" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
