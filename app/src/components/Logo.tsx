'use client';

/**
 * Circles brand mark — large outer circle with an offset green inner dot.
 * Uses `currentColor` for the outer ring so it adapts to light/dark themes.
 * The green accent is always the brand green (#22C55E).
 */

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 28, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer solid circle — adapts to theme via currentColor */}
      <circle cx="20" cy="20" r="19" fill="currentColor" />
      {/* Inner green dot — offset right, brand accent */}
      <circle cx="24" cy="20" r="9" fill="#22C55E" />
    </svg>
  );
}

/** Horizontal lockup: mark + wordmark */
export function LogoFull({ scale = 1 }: { scale?: number }) {
  const size = Math.round(32 * scale);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(10 * scale) }}>
      <Logo size={size} />
      <span style={{
        fontSize: Math.round(20 * scale),
        fontWeight: 700,
        letterSpacing: '-0.03em',
        lineHeight: 1,
      }}>
        Circles
      </span>
    </div>
  );
}
