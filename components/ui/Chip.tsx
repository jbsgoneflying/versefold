export function Chip({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={
        active
          ? "inline-flex items-center rounded-full border border-[var(--color-hunter)] bg-[color-mix(in_srgb,var(--color-hunter)_10%,transparent)] px-3.5 py-1.5 text-sm font-medium text-[var(--color-hunter)]"
          : "inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--color-stone)_38%,transparent)] bg-[var(--color-paper)] px-3.5 py-1.5 text-sm text-[var(--color-ink)]/80"
      }
    >
      {children}
    </span>
  );
}
