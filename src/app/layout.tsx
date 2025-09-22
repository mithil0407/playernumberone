import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const canela = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-canela",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ICONIK - Bespoke Fashion Consultations for the Modern Indian Woman",
  description:
    "Elevate your presence. Transform your confidence. Discover the artistry of personal style with our curated fashion expertise.",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${inter.variable} ${canela.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  );
}
