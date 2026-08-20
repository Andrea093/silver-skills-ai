// Brand mark: navy square, bold "S" (still instantly readable as the old placeholder was — kept
// deliberately simple for a 45+ audience), plus a small ascending accent to signal growth/upward
// mobility, the platform's core promise. Reuses the existing brand/accent color tokens.
export function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label="Silver Skills AI"
      className={className}
    >
      <rect width="40" height="40" rx="10" fill="#16283f" />
      <text
        x="16"
        y="28"
        textAnchor="middle"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontWeight="800"
        fontSize="21"
        fill="#ffffff"
      >
        S
      </text>
      <path
        d="M26 25 L26 17 L34 17"
        fill="none"
        stroke="#dfae4c"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M26.3 25 L34 17.3" stroke="#dfae4c" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
