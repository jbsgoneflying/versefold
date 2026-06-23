import { Reveal } from "./ui/Reveal";
import { SectionLabel } from "./ui/SectionLabel";

const prompts = [
  "Explain this passage simply",
  "Build a 3-day study on the Sermon on the Mount",
  "Turn this verse into a lock-screen confession card",
  "Create reflection questions for tonight",
  "Show cross-references and themes",
  "Summarize the structure of Romans 8",
];

export function AiLayer() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 border-y border-[color-mix(in_srgb,var(--color-stone)_18%,transparent)] bg-[var(--color-ivory-deep)]"
    >
      <div className="container-page section-y grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <Reveal className="max-w-md">
          <SectionLabel>The study layer</SectionLabel>
          <h2 className="mt-5 text-[2rem] leading-tight sm:text-5xl">
            Gentle study tools, only when you ask.
          </h2>
          <p className="mt-6 text-[1.0625rem] leading-relaxed text-[var(--color-ink)]/72 sm:text-lg">
            The study layer in Versefold is designed to support Scripture
            reading, not replace it. Build a 3-day guide, ask for a plain
            explanation, shape reflection questions, or turn a passage into a
            card for daily remembrance.
          </p>
          <p className="mt-4 leading-relaxed text-[var(--color-stone)]">
            The Word remains primary. The tools serve attention, not
            distraction.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="card overflow-hidden p-2.5 sm:p-3">
            <div className="flex items-center justify-between px-3.5 py-3">
              <span className="text-xs font-medium tracking-[0.16em] text-[var(--color-stone)] uppercase">
                Study this passage
              </span>
              <span className="rounded-full bg-[color-mix(in_srgb,var(--color-stone)_12%,transparent)] px-2.5 py-1 text-[0.7rem] font-medium text-[var(--color-stone)]">
                Psalm 119:105
              </span>
            </div>
            <ul className="space-y-2">
              {prompts.map((prompt, i) => {
                const active = i === 0;
                return (
                  <li key={prompt}>
                    <span
                      className={
                        active
                          ? "flex items-center gap-3 rounded-xl border border-[color-mix(in_srgb,var(--color-hunter)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-hunter)_8%,transparent)] px-4 py-3.5 font-medium text-[var(--color-hunter)]"
                          : "flex items-center gap-3 rounded-xl border border-transparent bg-[var(--color-ivory)] px-4 py-3.5 text-[var(--color-ink)]/80"
                      }
                    >
                      <span
                        aria-hidden="true"
                        className={
                          active
                            ? "text-[var(--color-hunter)]"
                            : "text-[var(--color-stone)]"
                        }
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M5 12h14M13 6l6 6-6 6"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      {prompt}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
