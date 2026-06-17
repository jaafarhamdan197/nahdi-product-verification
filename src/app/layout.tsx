import type { Metadata } from "next";
import { League_Gothic, Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Display / headings (design.md: --display)
const leagueGothic = League_Gothic({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

// UI / body (design.md: --ui)
const poppins = Poppins({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

// Data / numbers (design.md: --mono)
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Nahdi Product Verification",
  description:
    "Check item availability across the Nahdi KSA and UAE Channable feeds.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${leagueGothic.variable} ${poppins.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
