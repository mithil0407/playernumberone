import type React from "react";
import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Suspense } from "react";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ICONIK - Luxury Style Consultations",
  description: "Discover your signature style with bespoke fashion consultations for the modern woman",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`font-sans ${playfairDisplay.variable} ${inter.variable}`}
      >
        <Suspense>
          {children}
          <Analytics />
        </Suspense>
      </body>
    </html>
  );
}
