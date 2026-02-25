/**
 * DebtsyCow - App Mascot
 *
 * Debtsy the cow! Cute kawaii mascot for the Debtsy app.
 */

interface DebtsyCowProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function DebtsyCow({ size = 72, className = '', animated = true }: DebtsyCowProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? 'animate-kawaii-float' : ''} ${className}`}
      style={animated ? { animationDuration: '3s' } : undefined}
      aria-label="Debtsy the cow mascot"
      role="img"
    >
      {/* Horns */}
      <path d="M31 34 Q25 18 33 14 Q39 20 35 32" fill="#e8c46a" />
      <path d="M69 34 Q75 18 67 14 Q61 20 65 32" fill="#e8c46a" />

      {/* Outer ears */}
      <ellipse cx="17" cy="50" rx="11" ry="13" fill="white" stroke="#d1d5db" strokeWidth="1.5" />
      <ellipse cx="83" cy="50" rx="11" ry="13" fill="white" stroke="#d1d5db" strokeWidth="1.5" />
      {/* Inner ears (pink) */}
      <ellipse cx="17" cy="50" rx="6" ry="8" fill="#f9a8c9" />
      <ellipse cx="83" cy="50" rx="6" ry="8" fill="#f9a8c9" />

      {/* Head */}
      <ellipse cx="50" cy="57" rx="36" ry="38" fill="white" stroke="#d1d5db" strokeWidth="1.5" />

      {/* Black spots */}
      <ellipse cx="30" cy="44" rx="11" ry="9" fill="#1e1b2e" opacity="0.9" />
      <ellipse cx="70" cy="40" rx="9" ry="8" fill="#1e1b2e" opacity="0.9" />
      <ellipse cx="62" cy="72" rx="7" ry="6" fill="#1e1b2e" opacity="0.7" />

      {/* Eye whites */}
      <ellipse cx="38" cy="55" rx="9" ry="10" fill="white" stroke="#1e1b2e" strokeWidth="1.5" />
      <ellipse cx="62" cy="55" rx="9" ry="10" fill="white" stroke="#1e1b2e" strokeWidth="1.5" />
      {/* Pupils */}
      <ellipse cx="39" cy="56" rx="6" ry="7" fill="#1e1b2e" />
      <ellipse cx="63" cy="56" rx="6" ry="7" fill="#1e1b2e" />
      {/* Eye highlights */}
      <circle cx="41.5" cy="52.5" r="2.2" fill="white" />
      <circle cx="65.5" cy="52.5" r="2.2" fill="white" />
      {/* Eyelashes (top arcs) */}
      <path d="M31 48 Q35 44 40 47" stroke="#1e1b2e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M55 47 Q59 43 65 47" stroke="#1e1b2e" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Rosy cheeks */}
      <ellipse cx="27" cy="66" rx="8" ry="5" fill="#f9a8c9" opacity="0.55" />
      <ellipse cx="73" cy="66" rx="8" ry="5" fill="#f9a8c9" opacity="0.55" />

      {/* Muzzle */}
      <ellipse cx="50" cy="74" rx="17" ry="13" fill="#fce7f3" stroke="#f0c0d8" strokeWidth="1" />
      {/* Nostrils */}
      <ellipse cx="44" cy="76" rx="3.5" ry="3" fill="#f9a8c9" opacity="0.8" />
      <ellipse cx="56" cy="76" rx="3.5" ry="3" fill="#f9a8c9" opacity="0.8" />
      {/* Smile */}
      <path d="M43 82 Q50 88 57 82" stroke="#d46898" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* Tiny coin tag on ear — the debt theming! */}
      <circle cx="83" cy="38" r="6" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
      <text x="83" y="41.5" textAnchor="middle" fontSize="7" fill="#92400e" fontWeight="bold" fontFamily="sans-serif">$</text>
    </svg>
  );
}
