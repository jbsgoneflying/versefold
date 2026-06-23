import { Reveal } from "./ui/Reveal";
import { SectionLabel } from "./ui/SectionLabel";

type CardTheme = {
  bg: string;
  text: string;
  meta: string;
  border: string;
  verse: string;
  ref: string;
  time: string;
};

const cards: CardTheme[] = [
  {
    bg: "var(--color-evergreen)",
    text: "var(--color-ivory)",
    meta: "color-mix(in srgb, var(--color-ivory) 60%, transparent)",
    border: "color-mix(in srgb, var(--color-ivory) 14%, transparent)",
    verse: "The Lord is my shepherd. I shall not want.",
    ref: "Psalm 23:1",
    time: "6:14",
  },
  {
    bg: "var(--color-parchment)",
    text: "var(--color-ink)",
    meta: "var(--color-stone)",
    border: "color-mix(in srgb, var(--color-stone) 28%, transparent)",
    verse: "Be still, and know that I am God.",
    ref: "Psalm 46:10",
    time: "12:30",
  },
  {
    bg: "var(--color-ink)",
    text: "var(--color-ivory)",
    meta: "color-mix(in srgb, var(--color-ivory) 55%, transparent)",
    border: "color-mix(in srgb, var(--color-ivory) 12%, transparent)",
    verse: "This is the day the Lord has made.",
    ref: "Psalm 118:24",
    time: "9:41",
  },
];

export function ConfessionCards() {
  return (
    <section className="border-y border-[color-mix(in_srgb,var(--color-stone)_20%,transparent)] bg-[var(--color-ivory-deep)]">
      <div className="container-page py-20 md:py-28">
        <Reveal className="max-w-2xl">
          <SectionLabel>Daily remembrance</SectionLabel>
          <h2 className="mt-5 text-4xl sm:text-5xl">
            Carry the Word into the rest of your day.
          </h2>
          <p className="mt-6 text-lg text-[var(--color-ink)]/72 leading-relaxed">
            Highlight a verse and create a simple lock-screen card for
            remembrance, confession, prayer, or meditation. Designed to be
            beautiful, minimal, and free of noise.
          </p>
        </Reveal>

        <div className="mt-14 flex flex-wrap justify-center gap-6 sm:gap-8">
          {cards.map((card, i) => (
            <Reveal key={card.ref} delay={i * 120}>
              <div
                className="flex aspect-[9/19] w-52 flex-col rounded-[1.75rem] border p-6 shadow-[var(--shadow-lift)] sm:w-56"
                style={{
                  background: card.bg,
                  color: card.text,
                  borderColor: card.border,
                }}
              >
                <div
                  className="flex items-center justify-between text-[0.7rem] tracking-[0.16em] uppercase"
                  style={{ color: card.meta }}
                >
                  <span>{card.time}</span>
                  <LockIcon />
                </div>

                <div className="flex flex-1 flex-col justify-center">
                  <p className="font-serif text-[1.7rem] leading-[1.2]">
                    {card.verse}
                  </p>
                </div>

                <p
                  className="text-sm"
                  style={{ color: card.meta }}
                >
                  {card.ref}
                </p>
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
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
