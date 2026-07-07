import type { Metadata } from "next";
import { SubPage } from "@/components/SubPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Versefold handles your data: no accounts, no ads, no data sales. Your reading life stays on your device.",
  alternates: { canonical: "https://versefold.app/privacy" },
};

export default function PrivacyPage() {
  return (
    <SubPage title="Privacy Policy" updated="July 6, 2026">
      <p>
        Versefold is built on a simple conviction: your reading life belongs to
        you. There are no accounts, no advertising, no analytics trackers, and
        we never sell data — because we barely collect any.
      </p>

      <h2>What stays on your device</h2>
      <p>
        Everything you create in Versefold is stored locally on your iPhone and
        never leaves it unless you export or share it yourself:
      </p>
      <ul>
        <li>Highlights, pen marks, and bookmarks</li>
        <li>Notes and personal reflections</li>
        <li>Confession cards and saved studies</li>
        <li>Your reading position and reader preferences</li>
      </ul>
      <p>
        You can export all of this data as a file, or delete all of it, at any
        time from Settings inside the app.
      </p>

      <h2>What is sent to our servers</h2>
      <p>
        Some features need a network connection. When you use them, the app
        talks to our server (api.versefold.app) over an encrypted connection:
      </p>
      <ul>
        <li>
          <strong>AI features</strong> (Unfold explanations, guided studies,
          confession suggestions, search by meaning): the passage reference and
          any question you type are sent to our server, which uses OpenAI to
          generate a response. Generated results are retained briefly so the
          feature works well, keyed to an anonymous device identifier — never a
          name, email, or account.
        </li>
        <li>
          <strong>Additional translations</strong> (such as NIV and AMP): the
          chapter you request is fetched from API.Bible, a service of the
          American Bible Society.
        </li>
        <li>
          <strong>Feedback</strong>: if you choose to send feedback from
          Settings, we receive the text you write and nothing else.
        </li>
      </ul>
      <p>
        You can delete all AI artifacts associated with your device — both
        locally and on our server — with one tap in Settings (&ldquo;Delete AI
        history&rdquo;).
      </p>

      <h2>What we never do</h2>
      <ul>
        <li>No accounts and no sign-up — reading requires nothing from you</li>
        <li>No advertising and no ad networks</li>
        <li>No sale or sharing of personal data with data brokers</li>
        <li>No third-party analytics or behavioral tracking</li>
        <li>
          Your private notes are never read by us and never used by AI features
          without your explicit action
        </li>
      </ul>

      <h2>Photos permission</h2>
      <p>
        If you save a confession card to your photo library, iOS will ask for
        permission to add photos. Versefold only adds the image you chose to
        save; it never reads your photo library.
      </p>

      <h2>Service providers</h2>
      <p>
        We use a small number of infrastructure providers to run Versefold:
        OpenAI (AI text generation), API.Bible / American Bible Society
        (licensed Scripture text), and our hosting provider. Each receives only
        what is necessary to provide the feature you invoked.
      </p>

      <h2>Children</h2>
      <p>
        Versefold is suitable for general audiences and does not knowingly
        collect personal information from anyone, including children.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes, we will update this page and the date above.
        Material changes will be noted in the app&rsquo;s release notes.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Write to{" "}
        <a href="mailto:hello@versefold.app">hello@versefold.app</a>.
      </p>
    </SubPage>
  );
}
