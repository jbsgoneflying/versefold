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
      <div className="container-page grid gap-12 py-20 md:py-28 lg:grid-cols-2 lg:gap-16">
        <Reveal className="order-2 lg:order-1">
          <div className="rounded-[var(--radius-card)] border border-[color-mix(in_srgb,var(--color-stone)_24%,transparent)] bg-[var(--color-paper)] p-7 shadow-[var(--shadow-lift)] sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">Guided study</p>
                <h3 className="mt-2 font-serif text-3xl">
                  The Sermon on the Mount
                </h3>
              </div>
              <span className="rounded-full bg-[color-mix(in_srgb,var(--color-hunter)_12%,transparent)] px-3 py-1.5 text-xs font-medium text-[var(--color-hunter)]">
                7-day guide
              </span>
            </div>

            <ol className="mt-7 space-y-1.5">
              {days.map((day, i) => (
                <li
                  key={day}
                  className="flex items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-[var(--color-ivory-deep)]"
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-stone)_30%,transparent)] font-serif text-sm text-[var(--color-hunter)]">
                    {i + 1}
                  </span>
                  <span className="text-[var(--color-ink)]/82">
                    <span className="text-[var(--color-stone)]">
                      Day {i + 1}:{" "}
                    </span>
                    {day}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>

        <Reveal delay={120} className="order-1 flex flex-col justify-center lg:order-2">
          <SectionLabel>Guided study</SectionLabel>
          <h2 className="mt-5 text-4xl sm:text-5xl">
            Build a study around the time you actually have.
          </h2>
          <p className="mt-6 text-lg text-[var(--color-ink)]/72 leading-relaxed">
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
                <span
                  aria-hidden="true"
                  className="text-[var(--color-hunter)]"
                >
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
