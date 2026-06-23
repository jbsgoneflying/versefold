import { Reveal } from "./ui/Reveal";
import { SectionLabel } from "./ui/SectionLabel";

const removed = [
  "No feeds",
  "No social layer",
  "No streak pressure",
  "No cluttered home screen",
];

export function Problem() {
  return (
    <section className="border-y border-[color-mix(in_srgb,var(--color-stone)_20%,transparent)] bg-[var(--color-ivory-deep)]">
      <div className="container-page grid gap-12 py-20 md:py-28 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <SectionLabel>The problem</SectionLabel>
          <h2 className="mt-5 text-4xl sm:text-5xl">
            Scripture first. Everything else quiet.
          </h2>
          <p className="mt-6 text-lg text-[var(--color-ink)]/72 leading-relaxed">
            Modern Bible apps often carry the same patterns as everything else
            on the screen: content feeds, social layers, notification loops,
            streaks, badges, and front pages full of distraction.
          </p>
          <p className="mt-4 text-lg text-[var(--color-ink)]/72 leading-relaxed">
            Versefold is built in the opposite direction. It opens quietly. It
            puts Scripture first. The tools stay out of the way until you need
            them.
          </p>
        </Reveal>

        <Reveal delay={120} className="flex items-center">
          <ul className="w-full space-y-3">
            {removed.map((item) => (
              <li
                key={item}
                className="flex items-center gap-4 rounded-2xl border border-[color-mix(in_srgb,var(--color-stone)_24%,transparent)] bg-[var(--color-paper)] px-5 py-4 shadow-[var(--shadow-soft)]"
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-stone)_30%,transparent)] text-[var(--color-stone)]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12h14"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="font-serif text-2xl text-[var(--color-ink)]/55 line-through decoration-[color-mix(in_srgb,var(--color-stone)_55%,transparent)] decoration-1">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
