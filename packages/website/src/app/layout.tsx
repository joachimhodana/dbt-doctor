import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SITE_ORIGIN } from "@/constants/site";
import "./globals.css";

const SITE_URL = SITE_ORIGIN;
const TWITTER_IMAGE_PATH = "/dbt-doctor-og-banner.svg";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "dbt Doctor",
  description: "Let coding agents diagnose and fix your dbt project.",
  twitter: {
    card: "summary_large_image",
    images: [TWITTER_IMAGE_PATH],
  },
  icons: { icon: "/dbt-doctor-icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
