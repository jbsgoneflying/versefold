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
    <section className="border-y border-[color-mix(in_srgb,var(--color-stone)_18%,transparent)] bg-[var(--color-ivory-deep)]">
      <div className="container-page section-y grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
        <Reveal className="max-w-xl">
          <SectionLabel>The problem</SectionLabel>
          <h2 className="mt-5 text-[2rem] leading-tight sm:text-5xl">
            Scripture first. Everything else quiet.
          </h2>
          <p className="mt-6 text-[1.0625rem] leading-relaxed text-[var(--color-ink)]/72 sm:text-lg">
            Modern Bible apps often carry the same patterns as everything else
            on the screen: content feeds, social layers, notification loops,
            streaks, badges, and front pages full of distraction.
          </p>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-[var(--color-ink)]/72 sm:text-lg">
            Versefold is built in the opposite direction. It opens quietly. It
            puts Scripture first. The tools stay out of the way until you need
            them.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="card overflow-hidden">
            <p className="border-b border-[color-mix(in_srgb,var(--color-stone)_16%,transparent)] px-6 py-4 text-xs font-medium tracking-[0.16em] text-[var(--color-stone)] uppercase">
              What we left out
            </p>
            <ul>
              {removed.map((item, i) => (
                <li
                  key={item}
                  className={`flex items-center gap-4 px-6 py-4 ${
                    i !== removed.length - 1
                      ? "border-b border-[color-mix(in_srgb,var(--color-stone)_14%,transparent)]"
                      : ""
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-stone)_14%,transparent)] text-[var(--color-stone)]"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 12h12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span className="font-serif text-xl text-[var(--color-ink)]/70 sm:text-2xl">
                    {item}
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
