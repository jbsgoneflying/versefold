import { Logo } from "./Logo";

const links = [
  { href: "#", label: "Privacy" },
  { href: "#", label: "Terms" },
  { href: "mailto:hello@versefold.app", label: "Contact" },
  { href: "#early-access", label: "Early access" },
];

export function Footer() {
  return (
    <footer className="bg-[var(--color-ink)] text-[var(--color-ivory)]">
      <div className="container-page py-12 md:py-14">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-sm">
            <Logo tone="ivory" />
            <p className="mt-3 text-sm leading-relaxed text-[color-mix(in_srgb,var(--color-ivory)_62%,transparent)]">
              A quiet Bible app for reading, study, and daily remembrance.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-7 gap-y-2 text-sm text-[color-mix(in_srgb,var(--color-ivory)_78%,transparent)]">
              {links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="inline-block py-1 transition-colors hover:text-[var(--color-ivory)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-[color-mix(in_srgb,var(--color-ivory)_12%,transparent)] pt-6 text-xs text-[color-mix(in_srgb,var(--color-ivory)_50%,transparent)] sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Versefold. All rights reserved.</p>
          <p className="font-serif text-sm italic text-[color-mix(in_srgb,var(--color-ivory)_66%,transparent)]">
            The Word before the phone.
          </p>
        </div>
      </div>
    </footer>
  );
}
