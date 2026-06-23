export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="eyebrow inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="h-px w-6 bg-[var(--color-hunter)]/60"
      />
      {children}
    </span>
  );
}
