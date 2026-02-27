/**
 * CherryKitty - Hello Kitty Theme Mascot
 *
 * Cherry the kitty! Classic white cat with a yellow bow. No mouth (Hello Kitty style).
 */

interface MascotProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function CherryKitty({ size = 72, className = '', animated = true }: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? 'animate-kawaii-float' : ''} ${className}`}
      style={animated ? { animationDuration: '3s' } : undefined}
      aria-label="Cherry the kitty mascot"
      role="img"
    >
      {/* Cat ears (triangular) */}
      <path d="M20 48 L32 12 L44 44" fill="white" stroke="#d1d5db" strokeWidth="1.5" />
      <path d="M56 44 L68 12 L80 48" fill="white" stroke="#d1d5db" strokeWidth="1.5" />
      {/* Inner ears */}
      <path d="M26 44 L32 20 L40 42" fill="#fce7f3" />
      <path d="M60 42 L68 20 L74 44" fill="#fce7f3" />

      {/* Head */}
      <ellipse cx="50" cy="57" rx="36" ry="38" fill="white" stroke="#d1d5db" strokeWidth="1.5" />

      {/* Yellow bow on RIGHT side */}
      <ellipse cx="76" cy="30" rx="9" ry="6" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" transform="rotate(25 76 30)" />
      <ellipse cx="86" cy="26" rx="9" ry="6" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" transform="rotate(-15 86 26)" />
      <circle cx="80" cy="29" r="4" fill="#d97706" />

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
      <ellipse cx="50" cy="70" rx="3.5" ry="2.5" fill="#fbbf24" />

      {/* Whiskers - left side */}
      <line x1="18" y1="64" x2="32" y2="68" stroke="#d1d5db" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="70" x2="31" y2="72" stroke="#d1d5db" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="18" y1="76" x2="32" y2="76" stroke="#d1d5db" strokeWidth="1.2" strokeLinecap="round" />
      {/* Whiskers - right side */}
      <line x1="68" y1="68" x2="82" y2="64" stroke="#d1d5db" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="69" y1="72" x2="84" y2="70" stroke="#d1d5db" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="68" y1="76" x2="82" y2="76" stroke="#d1d5db" strokeWidth="1.2" strokeLinecap="round" />

      {/* NO mouth - Hello Kitty style */}
    </svg>
  );
}
