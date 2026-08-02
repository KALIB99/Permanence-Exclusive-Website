import type { Metadata } from "next";
import "./globals.css";

function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Permanence Exclusive | Private Chauffeur Service",
  description: "Private luxury transportation across the Arizona Valley, designed around your schedule.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Permanence Exclusive",
    description: "Excellence is Eternal. Private chauffeur service across the Arizona Valley.",
    images: [{ url: "/og.png", width: 1680, height: 945, alt: "Permanence Exclusive luxury chauffeur service" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Permanence Exclusive",
    description: "Excellence is Eternal. Private chauffeur service across the Arizona Valley.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
