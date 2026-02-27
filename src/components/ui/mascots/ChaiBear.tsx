/**
 * ChaiBear - Chococat Theme Mascot
 *
 * Chai the bear! Warm chocolate brown with a cream muzzle and cozy sleepy-happy eyes.
 */

interface MascotProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function ChaiBear({ size = 72, className = '', animated = true }: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? 'animate-kawaii-float' : ''} ${className}`}
      style={animated ? { animationDuration: '3s' } : undefined}
      aria-label="Chai the bear mascot"
      role="img"
    >
      {/* Round bear ears */}
      <circle cx="18" cy="35" r="12" fill="#a0522d" stroke="#7c2d12" strokeWidth="1.2" />
      <circle cx="82" cy="35" r="12" fill="#a0522d" stroke="#7c2d12" strokeWidth="1.2" />
      {/* Inner ears */}
      <circle cx="18" cy="35" r="7" fill="#fde8c8" />
      <circle cx="82" cy="35" r="7" fill="#fde8c8" />

      {/* Head */}
      <ellipse cx="50" cy="57" rx="36" ry="38" fill="#a0522d" stroke="#7c2d12" strokeWidth="1.5" />

      {/* Cream muzzle */}
      <ellipse cx="50" cy="72" rx="18" ry="14" fill="#fde8c8" />

      {/* Cozy sleepy-happy eyes (curved arcs instead of full circles) */}
      <path d="M30 54 Q38 48 46 54" stroke="#1e1b2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M54 54 Q62 48 70 54" stroke="#1e1b2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Rosy cheeks */}
      <ellipse cx="27" cy="62" rx="8" ry="5" fill="#f9a8c9" opacity="0.55" />
      <ellipse cx="73" cy="62" rx="8" ry="5" fill="#f9a8c9" opacity="0.55" />

      {/* Nose */}
      <ellipse cx="50" cy="70" rx="5" ry="3.5" fill="#5c2d0e" />

      {/* Smile */}
      <path d="M43 78 Q50 84 57 78" stroke="#7c2d12" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
