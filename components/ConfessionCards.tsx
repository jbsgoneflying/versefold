import { Reveal } from "./ui/Reveal";
import { SectionLabel } from "./ui/SectionLabel";

type CardTheme = {
  bg: string;
  text: string;
  meta: string;
  ring: string;
  verse: string;
  ref: string;
  time: string;
  date: string;
};

const cards: CardTheme[] = [
  {
    bg: "var(--color-evergreen)",
    text: "var(--color-ivory)",
    meta: "color-mix(in srgb, var(--color-ivory) 58%, transparent)",
    ring: "color-mix(in srgb, var(--color-ivory) 12%, transparent)",
    verse: "The Lord is my shepherd. I shall not want.",
    ref: "Psalm 23:1",
    time: "6:14",
    date: "Monday, June 1",
  },
  {
    bg: "var(--color-parchment)",
    text: "var(--color-ink)",
    meta: "var(--color-stone)",
    ring: "color-mix(in srgb, var(--color-stone) 24%, transparent)",
    verse: "Be still, and know that I am God.",
    ref: "Psalm 46:10",
    time: "12:30",
    date: "Wednesday, June 3",
  },
  {
    bg: "var(--color-ink)",
    text: "var(--color-ivory)",
    meta: "color-mix(in srgb, var(--color-ivory) 52%, transparent)",
    ring: "color-mix(in srgb, var(--color-ivory) 12%, transparent)",
    verse: "This is the day the Lord has made.",
    ref: "Psalm 118:24",
    time: "9:41",
    date: "Friday, June 5",
  },
];

export function ConfessionCards() {
  return (
    <section className="border-y border-[color-mix(in_srgb,var(--color-stone)_18%,transparent)] bg-[var(--color-ivory-deep)]">
      <div className="container-page section-y">
        <Reveal className="max-w-2xl">
          <SectionLabel>Daily remembrance</SectionLabel>
          <h2 className="mt-5 text-[2rem] leading-tight sm:text-5xl">
            Carry the Word into the rest of your day.
          </h2>
          <p className="mt-6 text-[1.0625rem] leading-relaxed text-[var(--color-ink)]/72 sm:text-lg">
            Highlight a verse and create a simple lock-screen card for
            remembrance, confession, prayer, or meditation. Designed to be
            beautiful, minimal, and free of noise.
          </p>
        </Reveal>

        {/* Mobile: horizontal scroll-snap. sm+: centered row. */}
        <div className="-mx-6 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-2 md:mt-14 sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-8 sm:overflow-visible sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cards.map((card, i) => (
            <Reveal key={card.ref} delay={i * 120} className="shrink-0 snap-center">
              <div
                className="flex aspect-[9/19.5] w-[14.5rem] flex-col rounded-[2rem] border p-6 shadow-[var(--shadow-float)] sm:w-56"
                style={{
                  background: card.bg,
                  color: card.text,
                  borderColor: card.ring,
                }}
              >
                {/* Clock */}
                <div className="pt-4 text-center">
                  <p className="font-serif text-[2.75rem] leading-none tracking-tight">
                    {card.time}
                  </p>
                  <p
                    className="mt-1.5 text-[0.7rem]"
                    style={{ color: card.meta }}
                  >
                    {card.date}
                  </p>
                </div>

                {/* Verse */}
                <div className="flex flex-1 flex-col justify-center text-center">
                  <p className="font-serif text-[1.45rem] leading-[1.25]">
                    {card.verse}
                  </p>
                  <p
                    className="mt-3 text-xs tracking-wide"
                    style={{ color: card.meta }}
                  >
                    {card.ref}
                  </p>
                </div>

                {/* Lock affordance */}
                <div
                  className="flex items-center justify-center"
                  style={{ color: card.meta }}
                >
                  <LockIcon />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="5"
        y="11"
        width="14"
        height="9"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 11V8a4 4 0 018 0v3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
