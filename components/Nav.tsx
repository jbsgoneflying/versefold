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
          ? "border-b border-[color-mix(in_srgb,var(--color-stone)_24%,transparent)] bg-[color-mix(in_srgb,var(--color-ivory)_85%,transparent)] backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        aria-label="Primary"
        className="container-page flex h-16 items-center justify-between md:h-20"
      >
        <a
          href="#top"
          className="-m-2 rounded-md p-2"
          aria-label="Versefold home"
        >
          <Logo />
        </a>

        {/* Desktop */}
        <div className="hidden items-center gap-9 md:flex">
          <ul className="flex items-center gap-8 text-sm text-[var(--color-ink)]/70">
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
          <Button href="#early-access" size="sm">
            Join early access
          </Button>
        </div>

        {/* Mobile: logo + compact CTA only */}
        <div className="md:hidden">
          <Button href="#early-access" size="sm">
            Join early access
          </Button>
        </div>
      </nav>
    </header>
  );
}
