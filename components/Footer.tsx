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
      <div className="container-page py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo tone="ivory" />
            <p className="mt-4 text-[color-mix(in_srgb,var(--color-ivory)_68%,transparent)] leading-relaxed">
              A quiet Bible app for reading, study, and daily remembrance.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-8 gap-y-3 text-[color-mix(in_srgb,var(--color-ivory)_80%,transparent)]">
              {links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="transition-colors hover:text-[var(--color-ivory)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[color-mix(in_srgb,var(--color-ivory)_14%,transparent)] pt-6 text-sm text-[color-mix(in_srgb,var(--color-ivory)_55%,transparent)] sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Versefold. All rights reserved.</p>
          <p className="font-serif italic text-[color-mix(in_srgb,var(--color-ivory)_70%,transparent)]">
            The Word before the phone.
          </p>
        </div>
      </div>
    </footer>
  );
}
