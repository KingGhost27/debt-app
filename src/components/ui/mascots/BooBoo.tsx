/**
 * BooBoo - My Melody / Hello Kitty Theme Mascot
 *
 * BooBoo the pig! Round pink piglet with a cute bow.
 */

interface MascotProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function BooBoo({ size = 72, className = '', animated = true }: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? 'animate-kawaii-float' : ''} ${className}`}
      style={animated ? { animationDuration: '3s' } : undefined}
      aria-label="BooBoo the pig mascot"
      role="img"
    >
      {/* Ears */}
      <ellipse cx="22" cy="38" rx="10" ry="12" fill="#f9a8d4" stroke="#f472b6" strokeWidth="1" transform="rotate(-15 22 38)" />
      <ellipse cx="78" cy="38" rx="10" ry="12" fill="#f9a8d4" stroke="#f472b6" strokeWidth="1" transform="rotate(15 78 38)" />
      {/* Inner ears */}
      <ellipse cx="22" cy="38" rx="6" ry="7" fill="#fce7f3" transform="rotate(-15 22 38)" />
      <ellipse cx="78" cy="38" rx="6" ry="7" fill="#fce7f3" transform="rotate(15 78 38)" />

      {/* Head */}
      <ellipse cx="50" cy="57" rx="36" ry="38" fill="#f9a8d4" stroke="#f472b6" strokeWidth="1.5" />

      {/* Bow on top */}
      <ellipse cx="40" cy="22" rx="10" ry="7" fill="#fb7185" stroke="#e11d48" strokeWidth="0.8" transform="rotate(-15 40 22)" />
      <ellipse cx="56" cy="22" rx="10" ry="7" fill="#fb7185" stroke="#e11d48" strokeWidth="0.8" transform="rotate(15 56 22)" />
      <circle cx="48" cy="24" r="4.5" fill="#e11d48" />

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

      {/* Pig snout */}
      <ellipse cx="50" cy="76" rx="15" ry="11" fill="#fce7f3" stroke="#f0c0d8" strokeWidth="1" />
      {/* Nostrils */}
      <circle cx="44" cy="76" r="3" fill="#f9a8c9" />
      <circle cx="56" cy="76" r="3" fill="#f9a8c9" />

      {/* Smile */}
      <path d="M43 84 Q50 90 57 84" stroke="#d46898" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
