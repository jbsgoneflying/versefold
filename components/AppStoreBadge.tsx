/* eslint-disable @next/next/no-img-element */

export const APP_STORE_URL =
  "https://apps.apple.com/app/versefold/id6788062359";

/**
 * Official Apple "Download on the App Store" badge (black, per Apple's
 * marketing guidelines — unmodified artwork, min 40px tall, clear space
 * handled by surrounding layout). One component so every placement stays
 * consistent.
 */
export function AppStoreBadge({
  height = 52,
  className = "",
}: {
  height?: number;
  className?: string;
}) {
  return (
    <a
      href={APP_STORE_URL}
      className={`inline-flex transition-transform duration-200 hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-hunter)] ${className}`}
      aria-label="Download Versefold on the App Store"
    >
      <img
        src="/app-store-badge.svg"
        alt="Download on the App Store"
        height={height}
        width={height * 2.99}
        style={{ height, width: "auto" }}
      />
    </a>
  );
}
