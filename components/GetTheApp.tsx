/* eslint-disable @next/next/no-img-element */
import { AppStoreBadge } from "./AppStoreBadge";
import { Reveal } from "./ui/Reveal";

/** Closing call to action: the app is live, go get it. The QR code gives
 *  desktop visitors a straight path to the phone. */
export function GetTheApp() {
  return (
    <section id="get-the-app" className="scroll-mt-24">
      <div className="container-page section-y">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-[color-mix(in_srgb,var(--color-evergreen)_50%,transparent)] bg-[var(--color-evergreen)] px-6 py-16 text-[var(--color-ivory)] shadow-[var(--shadow-float)] sm:px-12 md:py-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(70% 60% at 80% 0%, color-mix(in srgb, var(--color-ivory) 10%, transparent) 0%, transparent 60%)",
              }}
            />
            <div className="relative mx-auto max-w-xl text-center">
              <span className="eyebrow text-[color-mix(in_srgb,var(--color-ivory)_80%,transparent)]">
                Available now
              </span>
              <h2 className="mt-5 text-[2.1rem] leading-tight text-[var(--color-ivory)] sm:text-5xl">
                The Word is waiting.
              </h2>
              <p className="mx-auto mt-6 max-w-md text-[1.0625rem] leading-relaxed text-[color-mix(in_srgb,var(--color-ivory)_82%,transparent)] sm:text-lg">
                Versefold is on the App Store for iPhone. Free to read, quiet
                by design, and built to give your attention back to Scripture.
              </p>

              <div className="mt-10 flex flex-col items-center gap-8">
                <AppStoreBadge height={60} />

                {/* Desktop path: point the phone at the code. */}
                <div className="hidden flex-col items-center gap-3 sm:flex">
                  <div className="rounded-2xl bg-[var(--color-ivory)] p-4 shadow-[0_12px_28px_-16px_rgba(0,0,0,0.5)]">
                    <img
                      src="/app-store-qr.svg"
                      alt="QR code linking to Versefold on the App Store"
                      width={124}
                      height={124}
                    />
                  </div>
                  <p className="text-xs text-[color-mix(in_srgb,var(--color-ivory)_60%,transparent)]">
                    Or scan with your iPhone camera.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
