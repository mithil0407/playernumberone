import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PlayerNumberOne Alpha1 - Transform Your Look & Confidence",
  description: "Alpha1 is a 1-on-1 transformation program by India's top stylists. Get grooming, style, fitness, and confidence coaching to become the man women notice.",
  keywords: "men's transformation, grooming, style, confidence, dating, Indian men, personal styling",
  openGraph: {
    title: "PlayerNumberOne Alpha1 - Transform Your Look & Confidence",
    description: "Become the man women notice with our 1-on-1 transformation program",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
