import { Reveal } from "./ui/Reveal";
import { SectionLabel } from "./ui/SectionLabel";

const pillars = [
  {
    title: "Read deeply.",
    body: "A clean reading space designed for attention, with simple highlights, notes, and beautiful Scripture typography.",
    icon: BookIcon,
  },
  {
    title: "Understand carefully.",
    body: "Ask for help with a passage, theme, structure, or context without turning your study time into a scrolling session.",
    icon: LensIcon,
  },
  {
    title: "Remember daily.",
    body: "Create simple lock-screen confession cards from highlighted verses and keep Scripture before you throughout the day.",
    icon: CardIcon,
  },
];

export function Pillars() {
  return (
    <section id="features" className="scroll-mt-24">
      <div className="container-page py-20 md:py-28">
        <Reveal className="max-w-2xl">
          <SectionLabel>What it does</SectionLabel>
          <h2 className="mt-5 text-4xl sm:text-5xl">
            Read. Understand. Remember.
          </h2>
          <p className="mt-6 text-lg text-[var(--color-ink)]/72 leading-relaxed">
            Three quiet pillars, each in service of the text. Nothing more than
            you need, and nothing that pulls you away.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.title} delay={i * 110}>
                <article className="group h-full rounded-[var(--radius-card)] border border-[color-mix(in_srgb,var(--color-stone)_22%,transparent)] bg-[var(--color-paper)] p-8 shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--color-hunter)_10%,transparent)] text-[var(--color-hunter)]">
                    <Icon />
                  </span>
                  <h3 className="mt-6 text-2xl">{p.title}</h3>
                  <p className="mt-3 text-[var(--color-ink)]/70 leading-relaxed">
                    {p.body}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 6.5C10 5 6.5 5 4 6v12c2.5-1 6-1 8 .5 2-1.5 5.5-1.5 8-.5V6c-2.5-1-6-1-8 .5Zm0 0V19"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LensIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M16 16l4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="6"
        y="3.5"
        width="12"
        height="17"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M9.5 9h5M9.5 12.5h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
