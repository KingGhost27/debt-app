/**
 * LiloOtter - Cinnamoroll Theme Mascot
 *
 * Lilo the otter! Warm tan coat with sky-blue cheeks and whisker dots.
 */

interface MascotProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function LiloOtter({ size = 72, className = '', animated = true }: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? 'animate-kawaii-float' : ''} ${className}`}
      style={animated ? { animationDuration: '3s' } : undefined}
      aria-label="Lilo the otter mascot"
      role="img"
    >
      {/* Round small ears */}
      <circle cx="17" cy="45" r="9" fill="#d6a96a" stroke="#b8860b" strokeWidth="1.2" />
      <circle cx="83" cy="45" r="9" fill="#d6a96a" stroke="#b8860b" strokeWidth="1.2" />
      {/* Inner ears */}
      <circle cx="17" cy="45" r="5" fill="#f5deb3" />
      <circle cx="83" cy="45" r="5" fill="#f5deb3" />

      {/* Head */}
      <ellipse cx="50" cy="57" rx="36" ry="38" fill="#d6a96a" stroke="#b8860b" strokeWidth="1.5" />

      {/* Cream muzzle area */}
      <ellipse cx="50" cy="70" rx="22" ry="18" fill="#fef3c7" />

      {/* Eye whites */}
      <ellipse cx="38" cy="55" rx="9" ry="10" fill="white" stroke="#1e1b2e" strokeWidth="1.5" />
      <ellipse cx="62" cy="55" rx="9" ry="10" fill="white" stroke="#1e1b2e" strokeWidth="1.5" />
      {/* Pupils */}
      <ellipse cx="39" cy="56" rx="6" ry="7" fill="#1e1b2e" />
      <ellipse cx="63" cy="56" rx="6" ry="7" fill="#1e1b2e" />
      {/* Eye highlights */}
      <circle cx="41.5" cy="52.5" r="2.2" fill="white" />
      <circle cx="65.5" cy="52.5" r="2.2" fill="white" />

      {/* Sky-blue blush cheeks */}
      <ellipse cx="27" cy="66" rx="8" ry="5" fill="#7dd3fc" opacity="0.55" />
      <ellipse cx="73" cy="66" rx="8" ry="5" fill="#7dd3fc" opacity="0.55" />

      {/* Whisker dots - left side */}
      <circle cx="28" cy="72" r="1.5" fill="#92400e" opacity="0.6" />
      <circle cx="26" cy="76" r="1.5" fill="#92400e" opacity="0.6" />
      <circle cx="29" cy="80" r="1.5" fill="#92400e" opacity="0.6" />
      {/* Whisker dots - right side */}
      <circle cx="72" cy="72" r="1.5" fill="#92400e" opacity="0.6" />
      <circle cx="74" cy="76" r="1.5" fill="#92400e" opacity="0.6" />
      <circle cx="71" cy="80" r="1.5" fill="#92400e" opacity="0.6" />

      {/* Nose */}
      <ellipse cx="50" cy="72" rx="4" ry="3" fill="#92400e" />

      {/* Smile */}
      <path d="M43 78 Q50 84 57 78" stroke="#92400e" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
