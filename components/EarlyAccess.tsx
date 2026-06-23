"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Reveal } from "./ui/Reveal";
import { SectionLabel } from "./ui/SectionLabel";

type Status = "idle" | "submitting" | "success" | "error";

export function EarlyAccess() {
  const [status, setStatus] = useState<Status>("idle");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = email.trim();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!validEmail) {
      setStatus("error");
      return;
    }

    setStatus("submitting");

    // TODO: Wire this up to an email provider (ConvertKit, Beehiiv, Loops,
    // Supabase, etc.). Replace the simulated delay below with a real request,
    // e.g.:
    //   await fetch("https://app.loops.so/api/newsletter-form/<FORM_ID>", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ email: trimmed, firstName: firstName.trim() }),
    //   });
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setStatus("success");
      setEmail("");
      setFirstName("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="early-access" className="scroll-mt-24">
      <div className="container-page py-20 md:py-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-[color-mix(in_srgb,var(--color-evergreen)_50%,transparent)] bg-[var(--color-evergreen)] px-6 py-14 text-[var(--color-ivory)] shadow-[var(--shadow-lift)] sm:px-12 md:py-20">
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
                Early access
              </span>
              <h2 className="mt-5 text-4xl text-[var(--color-ivory)] sm:text-5xl">
                Help shape a quieter Bible app.
              </h2>
              <p className="mx-auto mt-6 max-w-md text-lg text-[color-mix(in_srgb,var(--color-ivory)_82%,transparent)] leading-relaxed">
                Versefold is currently in early development. Join the list to
                follow the build and be notified when private beta access opens.
              </p>

              {status === "success" ? (
                <div
                  role="status"
                  className="mx-auto mt-10 flex max-w-md items-center justify-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-ivory)_22%,transparent)] bg-[color-mix(in_srgb,var(--color-ivory)_10%,transparent)] px-6 py-5"
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-ivory)] text-[var(--color-evergreen)]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 12.5l4 4 10-10"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <p className="text-left text-[var(--color-ivory)]">
                    Thank you. You&rsquo;re on the early access list.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="mx-auto mt-10 max-w-md text-left"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <label htmlFor="firstName" className="sr-only">
                        First name (optional)
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        placeholder="First name (optional)"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full rounded-xl border border-[color-mix(in_srgb,var(--color-ivory)_22%,transparent)] bg-[color-mix(in_srgb,var(--color-ivory)_8%,transparent)] px-4 py-3.5 text-[var(--color-ivory)] placeholder:text-[color-mix(in_srgb,var(--color-ivory)_55%,transparent)] focus:border-[var(--color-ivory)] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label htmlFor="email" className="sr-only">
                        Email address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (status === "error") setStatus("idle");
                        }}
                        aria-invalid={status === "error"}
                        className="w-full rounded-xl border border-[color-mix(in_srgb,var(--color-ivory)_22%,transparent)] bg-[color-mix(in_srgb,var(--color-ivory)_8%,transparent)] px-4 py-3.5 text-[var(--color-ivory)] placeholder:text-[color-mix(in_srgb,var(--color-ivory)_55%,transparent)] focus:border-[var(--color-ivory)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-ivory)] px-6 py-3.5 text-sm font-semibold text-[var(--color-evergreen)] transition-colors hover:bg-[var(--color-paper)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ivory)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {status === "submitting" ? "Joining\u2026" : "Join early access"}
                  </button>

                  {status === "error" && (
                    <p
                      role="alert"
                      className="mt-3 text-sm text-[color-mix(in_srgb,var(--color-ivory)_90%,transparent)]"
                    >
                      Please enter a valid email address.
                    </p>
                  )}

                  <p className="mt-4 text-center text-xs text-[color-mix(in_srgb,var(--color-ivory)_60%,transparent)]">
                    We&rsquo;ll only email you about Versefold. Unsubscribe
                    anytime.
                  </p>
                </form>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
