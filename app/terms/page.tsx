import type { Metadata } from "next";
import { SubPage } from "@/components/SubPage";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms that govern your use of the Versefold app and website.",
  alternates: { canonical: "https://versefold.app/terms" },
};

export default function TermsPage() {
  return (
    <SubPage title="Terms of Use" updated="July 6, 2026">
      <p>
        These terms govern your use of the Versefold iOS application and the
        versefold.app website (together, &ldquo;Versefold&rdquo;). By using
        Versefold you agree to them. If you downloaded the app through the
        Apple App Store, Apple&rsquo;s standard Licensed Application End User
        License Agreement also applies.
      </p>

      <h2>Using Versefold</h2>
      <p>
        We grant you a personal, non-exclusive, non-transferable license to use
        Versefold for your own reading and study. You agree not to misuse the
        service — including attempting to disrupt it, reverse engineer it,
        scrape it at scale, or use it to violate the law or the rights of
        others.
      </p>

      <h2>Scripture text and copyrights</h2>
      <ul>
        <li>
          The King James Version (KJV) is in the public domain in the United
          States.
        </li>
        <li>
          Other translations (such as the NIV and the Amplified Bible) are
          provided under license through API.Bible and remain the property of
          their respective copyright holders. They are provided for personal
          reading within the app and may not be extracted or redistributed.
        </li>
      </ul>

      <h2>AI-assisted content</h2>
      <p>
        Versefold&rsquo;s explanation, study, and confession features generate
        content with the assistance of artificial intelligence. This content is
        clearly labeled, is <strong>commentary and not Scripture</strong>, and
        may contain errors or perspectives you disagree with. It is offered as
        a study aid — not as pastoral counsel, professional advice, or the
        teaching authority of any church. Weigh it against Scripture itself and
        the counsel of your own community.
      </p>

      <h2>Your content</h2>
      <p>
        Notes, highlights, cards, and studies you create are yours. They are
        stored on your device; we claim no ownership of them. You are
        responsible for what you create and share.
      </p>

      <h2>Availability and changes</h2>
      <p>
        Features that rely on our servers (AI features and licensed
        translations) may change, be interrupted, or be discontinued. We may
        update the app and these terms; continued use after an update
        constitutes acceptance. If a change is material, we will note it in
        this page&rsquo;s revision date and the app&rsquo;s release notes.
      </p>

      <h2>Disclaimers</h2>
      <p>
        Versefold is provided &ldquo;as is&rdquo; without warranties of any
        kind, express or implied, including fitness for a particular purpose
        and non-infringement. To the maximum extent permitted by law, we are
        not liable for indirect, incidental, or consequential damages arising
        from your use of Versefold.
      </p>

      <h2>Termination</h2>
      <p>
        You may stop using Versefold at any time and delete your data from
        Settings. We may suspend or terminate access to server features for
        misuse.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of the United States and the state
        in which Versefold&rsquo;s operator resides, without regard to conflict
        of law principles.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Write to{" "}
        <a href="mailto:hello@versefold.app">hello@versefold.app</a>.
      </p>
    </SubPage>
  );
}
