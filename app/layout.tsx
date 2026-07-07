import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = "https://versefold.app";
const description =
  "Versefold is a quiet Scripture reading and study app built around the pure Word. No feeds, no social layer, no streak pressure. A clean place to read, understand, remember, and keep Scripture before you. Now on the App Store for iPhone.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Versefold — A quiet Bible app for less phone and more Word",
    template: "%s — Versefold",
  },
  description,
  keywords: [
    "Bible app",
    "Scripture reading",
    "Bible study",
    "quiet Bible app",
    "lock screen verse",
    "iOS Bible app",
    "Versefold",
  ],
  authors: [{ name: "Versefold" }],
  alternates: { canonical: siteUrl },
  // iOS Safari Smart App Banner — the native install strip above the page.
  itunes: { appId: "6788062359" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Versefold",
    title: "Versefold — A quiet Bible app for less phone and more Word",
    description,
    images: [
      {
        url: "/versefold-sq-logo.png",
        width: 1000,
        height: 1000,
        alt: "Versefold book-and-fold logo mark",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Versefold — A quiet Bible app for less phone and more Word",
    description,
    images: ["/versefold-sq-logo.png"],
  },
  icons: {
    icon: "/versefold-sq-logo.png",
    apple: "/versefold-sq-logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF8F1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
