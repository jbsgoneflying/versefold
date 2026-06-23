"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { Button } from "./ui/Button";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#early-access", label: "Early access" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-[color-mix(in_srgb,var(--color-stone)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-ivory)_88%,transparent)] backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        aria-label="Primary"
        className="container-page flex h-18 items-center justify-between py-4"
      >
        <a href="#top" className="rounded-md" aria-label="Versefold home">
          <Logo />
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <ul className="flex items-center gap-7 text-sm text-[var(--color-ink)]/75">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="transition-colors hover:text-[var(--color-hunter)]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <Button href="#early-access">Join early access</Button>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-ink)] md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {open ? (
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="border-t border-[color-mix(in_srgb,var(--color-stone)_24%,transparent)] bg-[var(--color-ivory)] md:hidden"
        >
          <ul className="container-page flex flex-col gap-1 py-4 text-base">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block rounded-lg px-2 py-3 text-[var(--color-ink)]/80 transition-colors hover:bg-[var(--color-parchment)]/50 hover:text-[var(--color-hunter)]"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <Button
                href="#early-access"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Join early access
              </Button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
