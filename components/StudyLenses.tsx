import { Chip } from "./ui/Chip";
import { Reveal } from "./ui/Reveal";
import { SectionLabel } from "./ui/SectionLabel";

const lenses = [
  "Plain language",
  "Devotional",
  "Historical context",
  "Literary structure",
  "Pastoral reflection",
  "For a new believer",
  "For deeper study",
];

export function StudyLenses() {
  return (
    <section className="scroll-mt-24">
      <div className="container-page section-y">
        <Reveal className="mx-auto max-w-2xl text-center">
          <div className="flex justify-center">
            <SectionLabel>Study lenses</SectionLabel>
          </div>
          <h2 className="mt-5 text-[2rem] leading-tight sm:text-5xl">
            Study with a lens, not a feed.
          </h2>
          <p className="mt-6 text-[1.0625rem] leading-relaxed text-[var(--color-ink)]/72 sm:text-lg">
            Ask for an explanation in a clear, devotional, literary, pastoral,
            or historical style. Versefold can help shape the tone of study
            while keeping the text central and avoiding personality-driven
            content.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="mx-auto mt-12 flex max-w-2xl flex-wrap justify-center gap-2.5 sm:gap-3">
            {lenses.map((lens, i) => (
              <Chip key={lens} active={i === 0}>
                {lens}
              </Chip>
            ))}
          </div>
        </Reveal>

        <Reveal delay={180}>
          <p className="mx-auto mt-12 max-w-xl text-center text-sm leading-relaxed text-[var(--color-stone)]">
            Future study lenses may draw inspiration from historic Christian
            writing styles, while clearly avoiding impersonation or invented
            quotations.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
