import { Button } from "./ui/Button";
import { Reveal } from "./ui/Reveal";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* soft ambient wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% -8%, color-mix(in srgb, var(--color-parchment) 70%, transparent) 0%, transparent 70%)",
        }}
      />

      <div className="container-page grid items-center gap-12 pt-12 pb-24 md:grid-cols-2 md:gap-10 md:pt-20 md:pb-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        {/* Copy */}
        <Reveal className="max-w-xl">
          <span className="eyebrow">Versefold for iOS</span>
          <h1 className="mt-5 text-balance text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[4rem] lg:leading-[1.02]">
            The Bible app for less phone and more Word.
          </h1>
          <p className="mt-6 max-w-lg text-[1.0625rem] leading-relaxed text-[var(--color-ink)]/72 sm:text-lg">
            A quiet Scripture reading and study app built around the pure Word.
            No feeds. No social layer. No streak pressure. Just a clean place to
            read, understand, remember, and keep Scripture before you.
          </p>
          <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Button href="#early-access" className="w-full sm:w-auto">
              Join early access
            </Button>
            <Button
              href="#how-it-works"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              See how it works
            </Button>
          </div>
          <p className="mt-7 text-sm text-[var(--color-stone)]">
            Currently in early development. No spam, no noise.
          </p>
        </Reveal>

        {/* Visual */}
        <Reveal delay={120} className="relative">
          <HeroVisual />
        </Reveal>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[19rem] pb-12 sm:max-w-sm sm:pb-0">
      {/* Reading panel */}
      <div className="rounded-[1.625rem] border border-[color-mix(in_srgb,var(--color-stone)_22%,transparent)] bg-[var(--color-paper)] p-6 shadow-[var(--shadow-lift)] sm:p-8">
        <div className="flex items-center justify-between border-b border-[color-mix(in_srgb,var(--color-stone)_16%,transparent)] pb-4">
          <span className="text-xs font-medium tracking-[0.16em] text-[var(--color-stone)] uppercase">
            Psalm 119
          </span>
          <span className="font-serif leading-none text-[var(--color-stone)]">
            <span className="text-sm">A</span>
            <span className="text-lg">A</span>
          </span>
        </div>

        <div className="mt-5 space-y-3 font-serif text-[1.3rem] leading-relaxed sm:text-[1.4rem]">
          <p className="text-[var(--color-ink)]/40">
            <span className="mr-1.5 align-super text-[0.6rem] text-[var(--color-stone)]">
              104
            </span>
            Through your precepts I get understanding; therefore I hate every
            false way.
          </p>
          <p className="text-[var(--color-ink)]/90">
            <span className="mr-1.5 align-super text-[0.6rem] text-[var(--color-hunter)]">
              105
            </span>
            <mark className="rounded bg-[color-mix(in_srgb,var(--color-hunter)_13%,transparent)] px-1 text-[var(--color-ink)] decoration-clone">
              Your word is a lamp to my feet and a light to my path.
            </mark>
          </p>
          <p className="text-[var(--color-ink)]/40">
            <span className="mr-1.5 align-super text-[0.6rem] text-[var(--color-stone)]">
              106
            </span>
            I have sworn an oath and confirmed it, to keep your righteous rules.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-[color-mix(in_srgb,var(--color-stone)_16%,transparent)] pt-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-hunter)] px-3.5 py-2 text-[0.8rem] font-medium text-[var(--color-ivory)]">
            <UnfoldIcon />
            Unfold this passage
          </span>
          <span className="text-xs text-[var(--color-stone)]">Psalm 119:105</span>
        </div>
      </div>

      {/* Lock-screen confession card, overlapping */}
      <div className="absolute -bottom-2 -left-3 w-[8.5rem] rotate-[-3deg] sm:-bottom-8 sm:-left-10 sm:w-44">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-[var(--color-evergreen)] p-4 text-[var(--color-ivory)] shadow-[var(--shadow-float)] ring-1 ring-[color-mix(in_srgb,var(--color-ivory)_12%,transparent)] sm:p-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(80% 60% at 75% 0%, color-mix(in srgb, var(--color-ivory) 9%, transparent) 0%, transparent 60%)",
            }}
          />
          <div className="relative flex items-center justify-between text-[var(--color-ivory)]/55">
            <span className="text-[0.6rem] tracking-[0.16em] uppercase">
              9:41
            </span>
            <LockIcon />
          </div>
          <p className="relative mt-6 font-serif text-[1.05rem] leading-snug sm:mt-8 sm:text-xl">
            The Lord is my shepherd. I shall not want.
          </p>
          <p className="relative mt-3 text-[0.65rem] text-[var(--color-ivory)]/60 sm:text-xs">
            Psalm 23:1
          </p>
        </div>
      </div>
    </div>
  );
}

function UnfoldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7l8 5 8-5M4 7v10l8 5 8-5V7M4 7l8-4 8 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
