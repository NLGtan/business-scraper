import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Business Discovery and Enrichment",
  description:
    "Production-style demo app for discovering businesses and enriching lead records via official Google Maps Platform Places API workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

