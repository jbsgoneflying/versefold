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
          <stop
            offset="1"
            stopColor={tone === "ivory" ? "var(--color-stone)" : "var(--color-stone)"}
          />
        </linearGradient>
      </defs>

      {/* Left leaf — solid */}
      <path
        d="M32 11.5C24.4 8.6 15.2 8.6 8 11.5L8 50.5C15.2 47.6 24.4 47.6 32 50.5Z"
        fill={leafFill}
      />

      {/* Right leaf — page */}
      <path
        d="M32 11.5C39.6 8.6 48.8 8.6 56 11.5L56 50.5C48.8 47.6 39.6 47.6 32 50.5Z"
        fill={pageFill}
        stroke={strokeColor}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />

      {/* Folded page corner (bottom-right) */}
      <path
        d="M56 39.5L56 50.5L45.5 47.2Z"
        fill={`url(#${gradId})`}
        stroke={strokeColor}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Four-point star / light mark on the left leaf */}
      <path
        d="M19.6 20.5C20.7 27 22.8 29.1 29.3 30.2C22.8 31.3 20.7 33.4 19.6 39.9C18.5 33.4 16.4 31.3 9.9 30.2C16.4 29.1 18.5 27 19.6 20.5Z"
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
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark tone={tone} className="h-8 w-8 shrink-0" />
      <span
        className="font-serif text-[1.6rem] leading-none font-semibold tracking-tight"
        style={{ color: tone === "ivory" ? "var(--color-ivory)" : "var(--color-ink)" }}
      >
        Versefold
      </span>
    </span>
  );
}
