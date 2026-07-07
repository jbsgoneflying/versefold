import { Reveal } from "./ui/Reveal";
import { SectionLabel } from "./ui/SectionLabel";

const proofPoints = [
  {
    stat: "25+ years",
    detail: "founder and operator — companies built, run, and sold",
  },
  {
    stat: "Multiple exits",
    detail:
      "including a manufacturing company acquired by University of California, Irvine",
  },
  {
    stat: "Inc. 5000",
    detail: "three years running, among the fastest-growing U.S. companies",
  },
  {
    stat: "Systems today",
    detail: "RavenOS, NRGX Labs, InjuryOS, and Versefold — the same pattern",
  },
];

/**
 * The builder frame: who is behind this and why it exists — credibility
 * without a personal spotlight. Same quiet register as joshuabsmith.io.
 */
export function Builder() {
  return (
    <section id="builder" className="scroll-mt-24">
      <div className="container-page section-y grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
        <Reveal className="max-w-xl">
          <SectionLabel>From the builder</SectionLabel>
          <h2 className="mt-5 text-[2rem] leading-tight sm:text-5xl">
            Built by a founder, not a feed company.
          </h2>
          <p className="mt-6 text-[1.0625rem] leading-relaxed text-[var(--color-ink)]/72 sm:text-lg">
            Versefold comes from twenty-five years of building companies —
            ecommerce, manufacturing, subscription commerce, and now
            AI-assisted operating systems. That much time inside the machinery
            of attention teaches you exactly how products are engineered to
            keep people scrolling. Versefold is built in the opposite
            direction: an app that succeeds when you put the phone down.
          </p>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-[var(--color-ink)]/72 sm:text-lg">
            The conviction underneath it is stewardship — build with
            excellence, protect what matters, and leave the increase to God.
            Built by effort. Carried by grace.
          </p>
          <p className="mt-6 text-sm text-[var(--color-stone)]">
            More at{" "}
            <a
              href="https://joshuabsmith.io"
              className="underline underline-offset-4 decoration-[color-mix(in_srgb,var(--color-hunter)_45%,transparent)] transition-colors hover:text-[var(--color-hunter)]"
            >
              joshuabsmith.io
            </a>
            .
          </p>
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {proofPoints.map((point, i) => (
            <Reveal key={point.stat} delay={(i % 2) * 80}>
              <div className="card h-full p-6">
                <p className="font-serif text-2xl text-[var(--color-hunter)] sm:text-3xl">
                  {point.stat}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink)]/65">
                  {point.detail}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
