import { Reveal } from "./ui/Reveal";
import { SectionLabel } from "./ui/SectionLabel";

const days = [
  "The poor in spirit",
  "Salt and light",
  "The heart beneath the command",
  "Prayer in secret",
  "Treasure and trust",
  "The narrow way",
  "Hearing and doing",
];

export function GuidedStudy() {
  return (
    <section className="scroll-mt-24">
      <div className="container-page section-y grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <Reveal className="order-2 lg:order-1">
          <div className="card overflow-hidden shadow-[var(--shadow-lift)]">
            <div className="flex items-start justify-between gap-4 border-b border-[color-mix(in_srgb,var(--color-stone)_16%,transparent)] p-6 sm:p-7">
              <div>
                <p className="eyebrow">Guided study</p>
                <h3 className="mt-2 font-serif text-[1.75rem] leading-tight">
                  The Sermon on the Mount
                </h3>
              </div>
              <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--color-hunter)_10%,transparent)] px-3 py-1.5 text-xs font-medium text-[var(--color-hunter)]">
                7-day guide
              </span>
            </div>

            <ol className="px-2 py-2 sm:px-3">
              {days.map((day, i) => (
                <li
                  key={day}
                  className={`flex items-center gap-4 px-3 py-3 sm:px-4 ${
                    i !== days.length - 1
                      ? "border-b border-[color-mix(in_srgb,var(--color-stone)_12%,transparent)]"
                      : ""
                  }`}
                >
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-hunter)_9%,transparent)] font-serif text-sm text-[var(--color-hunter)]">
                    {i + 1}
                  </span>
                  <span className="flex flex-1 items-baseline justify-between gap-3">
                    <span className="text-[var(--color-ink)]/85">{day}</span>
                    <span className="shrink-0 text-xs text-[var(--color-stone)]">
                      Day {i + 1}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>

        <Reveal
          delay={120}
          className="order-1 flex flex-col justify-center lg:order-2"
        >
          <SectionLabel>Guided study</SectionLabel>
          <h2 className="mt-5 text-[2rem] leading-tight sm:text-5xl">
            Build a study around the time you actually have.
          </h2>
          <p className="mt-6 text-[1.0625rem] leading-relaxed text-[var(--color-ink)]/72 sm:text-lg">
            Choose a theme, passage, or book. Versefold can help shape a simple
            3-day or 7-day guide with Scripture readings, reflection prompts,
            prayer points, and space to keep notes.
          </p>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              "Scripture readings",
              "Reflection prompts",
              "Prayer points",
              "Space for notes",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2.5 text-[var(--color-ink)]/80"
              >
                <span aria-hidden="true" className="text-[var(--color-hunter)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12.5l4 4 10-10"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
