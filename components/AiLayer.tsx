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
      className="scroll-mt-24 border-y border-[color-mix(in_srgb,var(--color-stone)_20%,transparent)] bg-[var(--color-ivory-deep)]"
    >
      <div className="container-page grid gap-12 py-20 md:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal className="max-w-md">
          <SectionLabel>The study layer</SectionLabel>
          <h2 className="mt-5 text-4xl sm:text-5xl">
            Gentle study tools, only when you ask.
          </h2>
          <p className="mt-6 text-lg text-[var(--color-ink)]/72 leading-relaxed">
            The study layer in Versefold is designed to support Scripture
            reading, not replace it. Build a 3-day guide, ask for a plain
            explanation, shape reflection questions, or turn a passage into a
            card for daily remembrance.
          </p>
          <p className="mt-4 text-base text-[var(--color-stone)] leading-relaxed">
            The Word remains primary. The tools serve attention, not
            distraction.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="rounded-[var(--radius-card)] border border-[color-mix(in_srgb,var(--color-stone)_24%,transparent)] bg-[var(--color-paper)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
            <p className="text-xs font-medium tracking-[0.16em] text-[var(--color-stone)] uppercase">
              Ask of the passage
            </p>
            <ul className="mt-5 space-y-2.5">
              {prompts.map((prompt) => (
                <li key={prompt}>
                  <span className="flex items-center gap-3 rounded-xl border border-[color-mix(in_srgb,var(--color-stone)_22%,transparent)] bg-[var(--color-ivory)] px-4 py-3.5 text-[var(--color-ink)]/85">
                    <span
                      aria-hidden="true"
                      className="text-[var(--color-hunter)]"
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
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
