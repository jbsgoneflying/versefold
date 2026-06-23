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
    <section className="border-y border-[color-mix(in_srgb,var(--color-stone)_18%,transparent)] bg-[var(--color-ivory-deep)]">
      <div className="container-page section-y">
        <Reveal className="max-w-2xl">
          <SectionLabel>Restraint</SectionLabel>
          <h2 className="mt-5 text-[2rem] leading-tight sm:text-5xl">
            Built with restraint.
          </h2>
          <p className="mt-6 text-[1.0625rem] leading-relaxed text-[var(--color-ink)]/72 sm:text-lg">
            Versefold is designed around limits. No social feed. No public
            profiles. No vanity metrics. No endless content wall. The goal is
            not to keep you scrolling. The goal is to help you read, understand,
            remember, and obey.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:mt-12 lg:grid-cols-4">
          {principles.map((principle, i) => (
            <Reveal key={principle} delay={(i % 4) * 80}>
              <div className="card flex h-full items-start gap-3 p-5">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--color-hunter)_10%,transparent)] text-[var(--color-hunter)]"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12.5l4 4 10-10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="font-medium leading-snug text-[var(--color-ink)]/85">
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
