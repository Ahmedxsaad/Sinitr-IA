/**
 * The Sinistria mark: a lens/eye glyph for an AI accident witness. The almond
 * outline reads as both an aperture (capture) and an eye (witness); the lit
 * pupil is the moment of truth at its center. Emerald gradient stroke, sized by
 * a single prop so it scales cleanly in either app's header.
 */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Sinistria"
      fill="none"
    >
      <defs>
        <linearGradient
          id="sinistria-mark-gradient"
          x1="4"
          y1="4"
          x2="28"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#34e2a0" />
          <stop offset="1" stopColor="#0f7a57" />
        </linearGradient>
      </defs>
      <path
        d="M3.5 16 Q16 4.5 28.5 16 Q16 27.5 3.5 16 Z"
        stroke="url(#sinistria-mark-gradient)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="3.8" fill="#34e2a0" />
    </svg>
  );
}
