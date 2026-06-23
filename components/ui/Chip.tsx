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
          ? "inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--color-hunter)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-hunter)_8%,transparent)] px-4 py-2 text-sm text-[var(--color-hunter)]"
          : "inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--color-stone)_22%,transparent)] bg-[var(--color-paper)] px-4 py-2 text-sm text-[var(--color-ink)]/75"
      }
    >
      {children}
    </span>
  );
}
