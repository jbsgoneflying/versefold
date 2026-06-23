import { Reveal } from "./ui/Reveal";
import { SectionLabel } from "./ui/SectionLabel";

const pillars = [
  {
    title: "Read deeply.",
    body: "A clean reading space designed for attention, with simple highlights, notes, and beautiful Scripture typography.",
    icon: ReadIcon,
  },
  {
    title: "Understand carefully.",
    body: "Ask for help with a passage, theme, structure, or context without turning your study time into a scrolling session.",
    icon: UnderstandIcon,
  },
  {
    title: "Remember daily.",
    body: "Create simple lock-screen confession cards from highlighted verses and keep Scripture before you throughout the day.",
    icon: RememberIcon,
  },
];

export function Pillars() {
  return (
    <section id="features" className="scroll-mt-24">
      <div className="container-page section-y">
        <Reveal className="max-w-2xl">
          <SectionLabel>What it does</SectionLabel>
          <h2 className="mt-5 text-[2rem] leading-tight sm:text-5xl">
            Read. Understand. Remember.
          </h2>
          <p className="mt-6 text-[1.0625rem] leading-relaxed text-[var(--color-ink)]/72 sm:text-lg">
            Three quiet pillars, each in service of the text. Nothing more than
            you need, and nothing that pulls you away.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:gap-6 md:mt-14 md:grid-cols-3">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.title} delay={i * 110}>
                <article className="card h-full p-7 transition-shadow duration-300 hover:shadow-[var(--shadow-lift)] sm:p-8">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--color-hunter)_9%,transparent)] text-[var(--color-hunter)]">
                    <Icon />
                  </span>
                  <h3 className="mt-6 text-[1.6rem]">{p.title}</h3>
                  <p className="mt-2.5 leading-relaxed text-[var(--color-ink)]/70">
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

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  "aria-hidden": true,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function ReadIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 7.2C10.2 5.9 7.4 5.6 5 6.2v11.2c2.4-.6 5.2-.3 7 1 1.8-1.3 4.6-1.6 7-1V6.2c-2.4-.6-5.2-.3-7 1Z" />
      <path d="M12 7.2v12" />
    </svg>
  );
}

function UnderstandIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 4.5c.7 3.6 1.4 4.3 5 5-3.6.7-4.3 1.4-5 5-.7-3.6-1.4-4.3-5-5 3.6-.7 4.3-1.4 5-5Z" />
      <path d="M18.5 14.5c.3 1.4.6 1.7 2 2-1.4.3-1.7.6-2 2-.3-1.4-.6-1.7-2-2 1.4-.3 1.7-.6 2-2Z" />
    </svg>
  );
}

function RememberIcon() {
  return (
    <svg {...iconProps}>
      <rect x="6.5" y="3.5" width="11" height="17" rx="2.5" />
      <path d="M10 8.5h4" />
      <path d="M10 12h4" />
    </svg>
  );
}
