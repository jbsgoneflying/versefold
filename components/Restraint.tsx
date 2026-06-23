import { Reveal } from "./ui/Reveal";
import { SectionLabel } from "./ui/SectionLabel";

const principles = [
  "Scripture first",
  "Tools second",
  "No social layer",
  "No streak pressure",
  "No noisy home screen",
  "Privacy-aware study",
  "Quiet notifications",
  "Designed for attention",
];

export function Restraint() {
  return (
    <section className="border-y border-[color-mix(in_srgb,var(--color-stone)_20%,transparent)] bg-[var(--color-ivory-deep)]">
      <div className="container-page py-20 md:py-28">
        <Reveal className="max-w-2xl">
          <SectionLabel>Restraint</SectionLabel>
          <h2 className="mt-5 text-4xl sm:text-5xl">Built with restraint.</h2>
          <p className="mt-6 text-lg text-[var(--color-ink)]/72 leading-relaxed">
            Versefold is designed around limits. No social feed. No public
            profiles. No vanity metrics. No endless content wall. The goal is
            not to keep you scrolling. The goal is to help you read, understand,
            remember, and obey.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map((principle, i) => (
            <Reveal key={principle} delay={(i % 4) * 80}>
              <div className="flex h-full items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-stone)_22%,transparent)] bg-[var(--color-paper)] px-5 py-5 shadow-[var(--shadow-soft)]">
                <span
                  aria-hidden="true"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-hunter)_12%,transparent)] text-[var(--color-hunter)]"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12.5l4 4 10-10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="font-medium text-[var(--color-ink)]/88">
                  {principle}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
