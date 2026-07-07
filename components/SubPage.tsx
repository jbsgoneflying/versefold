import { Logo } from "./Logo";
import { Footer } from "./Footer";

/** Quiet single-column layout for legal/support pages: slim header with the
 *  logo linking home (the landing nav's anchor links don't exist here). */
export function SubPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-[color-mix(in_srgb,var(--color-stone)_24%,transparent)] bg-[var(--color-ivory)]">
        <div className="container-page flex h-16 items-center md:h-20">
          <a href="/" className="-m-2 rounded-md p-2" aria-label="Versefold home">
            <Logo />
          </a>
        </div>
      </header>
      <main id="main" className="bg-[var(--color-ivory)]">
        <article className="container-page max-w-3xl py-14 md:py-20">
          <h1 className="text-4xl md:text-5xl">{title}</h1>
          {updated && (
            <p className="mt-3 text-sm text-[var(--color-stone)]">
              Last updated: {updated}
            </p>
          )}
          <div className="prose-legal mt-10">{children}</div>
        </article>
      </main>
      <Footer />
    </>
  );
}
