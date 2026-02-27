/**
 * SunshineChick - Pompompurin Theme Mascot
 *
 * Sunshine the chick! Bright yellow fluffball with an orange beak.
 */

interface MascotProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function SunshineChick({ size = 72, className = '', animated = true }: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? 'animate-kawaii-float' : ''} ${className}`}
      style={animated ? { animationDuration: '3s' } : undefined}
      aria-label="Sunshine the chick mascot"
      role="img"
    >
      {/* Head tuft feathers */}
      <path d="M46 22 Q44 12 48 16" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M50 20 Q50 8 52 14" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M54 22 Q56 12 52 16" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Small wing stubs */}
      <ellipse cx="14" cy="65" rx="7" ry="12" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.2" transform="rotate(-10 14 65)" />
      <ellipse cx="86" cy="65" rx="7" ry="12" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.2" transform="rotate(10 86 65)" />

      {/* Head */}
      <ellipse cx="50" cy="57" rx="36" ry="38" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5" />

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

      {/* Orange beak (diamond shape) */}
      <polygon points="50,69 44,75 50,81 56,75" fill="#fb923c" stroke="#ea580c" strokeWidth="1" />

      {/* Smile (below beak) */}
      <path d="M45 84 Q50 88 55 84" stroke="#d46898" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
