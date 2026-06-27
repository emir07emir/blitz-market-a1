import type { Metadata } from "next";
import { Anton, Inter, Space_Mono } from "next/font/google";
import "./globals.css";

const display = Anton({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = Space_Mono({
  variable: "--font-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BlitzPass — Live Event Experiences on Monad",
  description:
    "Scan, claim your pass, react — and watch the room go on-chain in real time. Concerts, esports, festivals & meetups, powered by Monad.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
