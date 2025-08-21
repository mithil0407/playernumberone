import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PlayerNumberOne Alpha1 - Transform Your Confidence & Attractiveness",
  description: "Join 200+ men who transformed their lives with Alpha1. Get personalized grooming, style, fitness & confidence coaching. Start your transformation today!",
  keywords: "men transformation, grooming, style, fitness, confidence, attractiveness, coaching, Alpha1",
  openGraph: {
    title: "PlayerNumberOne Alpha1 - Transform Your Confidence & Attractiveness",
    description: "Join 200+ men who transformed their lives with Alpha1. Get personalized grooming, style, fitness & confidence coaching.",
    type: "website",
    url: "https://playernumberone.vercel.app",
    siteName: "PlayerNumberOne Alpha1",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-94CVS6PDTF"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-94CVS6PDTF');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
