import type { Metadata } from "next";
import { SubPage } from "@/components/SubPage";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with Versefold, the quiet Bible app.",
  alternates: { canonical: "https://versefold.app/support" },
};

export default function SupportPage() {
  return (
    <SubPage title="Support">
      <p>
        Versefold is built and cared for by a small team that reads every
        message. If something isn&rsquo;t working, or something could be
        better, we genuinely want to hear it.
      </p>

      <h2>Contact us</h2>
      <p>
        Email <a href="mailto:hello@versefold.app">hello@versefold.app</a> and
        we&rsquo;ll get back to you as soon as we can. You can also send
        feedback directly from the app: open the menu, choose Settings, and
        write to us under &ldquo;Feedback.&rdquo;
      </p>

      <h2>Common questions</h2>

      <h3>Do I need an account?</h3>
      <p>
        No. Versefold has no accounts and no sign-up. Your highlights, notes,
        and studies live on your device.
      </p>

      <h3>Does Versefold work offline?</h3>
      <p>
        Yes — reading the KJV works fully offline. Additional translations and
        AI-assisted features (Unfold, guided studies, confession suggestions)
        need a connection.
      </p>

      <h3>How do I move my data to a new phone?</h3>
      <p>
        In Settings, choose &ldquo;Export my data&rdquo; to save a file with
        your highlights, notes, cards, and studies. Keep it somewhere safe —
        import tooling is on our roadmap, and the file is plain, readable JSON.
      </p>

      <h3>How do I delete my data?</h3>
      <p>
        Settings offers &ldquo;Delete AI history&rdquo; (removes AI artifacts
        from your device and our server) and &ldquo;Delete all my data&rdquo;
        (removes everything you&rsquo;ve created in the app). Both are
        immediate and cannot be undone.
      </p>

      <h3>Is the AI content Scripture?</h3>
      <p>
        Never. Scripture is always shown exactly as the translation renders it,
        visually separate from anything AI-assisted, which is labeled and
        carries a &ldquo;Basis&rdquo; section citing the passages it draws on.
      </p>
    </SubPage>
  );
}
