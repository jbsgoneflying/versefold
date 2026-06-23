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

      <div className="container-page grid items-center gap-14 pt-16 pb-20 md:pt-24 md:pb-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        {/* Copy */}
        <Reveal className="max-w-xl">
          <span className="eyebrow">Versefold for iOS</span>
          <h1 className="mt-5 text-balance text-5xl leading-[1.04] sm:text-6xl">
            The Bible app for less phone and more Word.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-[var(--color-ink)]/72 leading-relaxed">
            A quiet Scripture reading and study app built around the pure Word.
            No feeds. No social layer. No streak pressure. Just a clean place to
            read, understand, remember, and keep Scripture before you.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button href="#early-access">Join early access</Button>
            <Button href="#how-it-works" variant="secondary">
              See how it works
            </Button>
          </div>
          <p className="mt-6 text-sm text-[var(--color-stone)]">
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
    <div className="relative mx-auto w-full max-w-md">
      {/* Reading panel */}
      <div className="rounded-[1.5rem] border border-[color-mix(in_srgb,var(--color-stone)_26%,transparent)] bg-[var(--color-paper)] p-7 shadow-[var(--shadow-lift)] sm:p-8">
        <div className="flex items-center justify-between text-[var(--color-stone)]">
          <span className="text-xs font-medium tracking-[0.16em] uppercase">
            Psalm 119
          </span>
          <span className="font-serif text-[var(--color-ink)]/55">
            <span className="text-sm">A</span>
            <span className="text-lg">A</span>
          </span>
        </div>

        <div className="mt-6 space-y-3.5 font-serif text-[1.35rem] leading-relaxed text-[var(--color-ink)]/85">
          <p className="text-[var(--color-ink)]/55">
            <span className="mr-2 align-super text-xs text-[var(--color-stone)]">
              104
            </span>
            Through your precepts I get understanding; therefore I hate every
            false way.
          </p>
          <p className="relative">
            <span className="mr-2 align-super text-xs text-[var(--color-hunter)]">
              105
            </span>
            <mark className="rounded bg-[color-mix(in_srgb,var(--color-hunter)_14%,transparent)] px-1 text-[var(--color-ink)] decoration-clone">
              Your word is a lamp to my feet and a light to my path.
            </mark>
          </p>
          <p className="text-[var(--color-ink)]/45">
            <span className="mr-2 align-super text-xs text-[var(--color-stone)]">
              106
            </span>
            I have sworn an oath and confirmed it, to keep your righteous rules.
          </p>
        </div>

        <div className="mt-7 flex items-center justify-between border-t border-[color-mix(in_srgb,var(--color-stone)_22%,transparent)] pt-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-hunter)] px-4 py-2 text-sm font-medium text-[var(--color-ivory)]">
            <UnfoldIcon />
            Unfold this passage
          </span>
          <span className="text-sm text-[var(--color-stone)]">Psalm 119:105</span>
        </div>
      </div>

      {/* Lock-screen confession card, overlapping */}
      <div className="absolute -bottom-10 -left-6 w-44 rotate-[-4deg] sm:-left-10 sm:w-48">
        <div className="rounded-[1.4rem] border border-[color-mix(in_srgb,var(--color-stone)_20%,transparent)] bg-[var(--color-evergreen)] p-5 text-[var(--color-ivory)] shadow-[var(--shadow-lift)]">
          <div className="flex items-center justify-between text-[var(--color-ivory)]/60">
            <span className="text-[0.65rem] tracking-[0.18em] uppercase">
              9:41
            </span>
            <LockIcon />
          </div>
          <p className="mt-7 font-serif text-xl leading-snug">
            The Lord is my shepherd. I shall not want.
          </p>
          <p className="mt-4 text-xs text-[var(--color-ivory)]/65">Psalm 23:1</p>
        </div>
      </div>
    </div>
  );
}

function UnfoldIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
