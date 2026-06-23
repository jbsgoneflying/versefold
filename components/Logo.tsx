type Tone = "ink" | "ivory";

export function LogoMark({
  tone = "ink",
  className = "",
}: {
  tone?: Tone;
  className?: string;
}) {
  // Default (on light backgrounds): solid hunter-green left leaf, ivory star.
  // Ivory tone (on dark backgrounds): ivory leaf, evergreen star.
  const leafFill = tone === "ivory" ? "var(--color-ivory)" : "var(--color-hunter)";
  const strokeColor = tone === "ivory" ? "var(--color-ivory)" : "var(--color-hunter)";
  const starColor = tone === "ivory" ? "var(--color-evergreen)" : "var(--color-ivory)";
  const pageFill = tone === "ivory" ? "transparent" : "var(--color-paper)";
  const gradId = tone === "ivory" ? "fold-ivory" : "fold-ink";

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop
            offset="0"
            stopColor={tone === "ivory" ? "var(--color-ivory)" : "var(--color-parchment)"}
          />
          <stop offset="1" stopColor="var(--color-stone)" />
        </linearGradient>
      </defs>

      {/* Left page — solid, tallest at the spine, sloping to rounded outer corners */}
      <path
        d="M29 7C20 8.5 11 10 8 14Q7 15.5 7 18L7 45Q7 47.5 9.5 48C16 49.5 23 50.5 29 53Z"
        fill={leafFill}
        stroke={leafFill}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Right page — outlined, mirror of the left across the center gutter */}
      <path
        d="M35 7C44 8.5 53 10 56 14Q57 15.5 57 18L57 45Q57 47.5 54.5 48C48 49.5 41 50.5 35 53Z"
        fill={pageFill}
        stroke={strokeColor}
        strokeWidth="2.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Folded page curl (bottom-right) */}
      <path
        d="M57 34C55 42 50 47 44 47C49 45.5 54 41 57 34Z"
        fill={`url(#${gradId})`}
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Four-point star on the left page */}
      <path
        d="M16.5 23.5C17.3 28.5 18.5 29.7 23.5 30.5C18.5 31.3 17.3 32.5 16.5 37.5C15.7 32.5 14.5 31.3 9.5 30.5C14.5 29.7 15.7 28.5 16.5 23.5Z"
        fill={starColor}
      />
    </svg>
  );
}

export function Logo({
  tone = "ink",
  className = "",
}: {
  tone?: Tone;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark tone={tone} className="h-9 w-9 shrink-0 md:h-10 md:w-10" />
      <span
        className="font-serif text-[1.7rem] leading-none font-semibold tracking-tight md:text-[1.85rem]"
        style={{ color: tone === "ivory" ? "var(--color-ivory)" : "var(--color-ink)" }}
      >
        Versefold
      </span>
    </span>
  );
}
