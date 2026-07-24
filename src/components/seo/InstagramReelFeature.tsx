'use client';

import Script from 'next/script';
import Link from 'next/link';
import { useEffect } from 'react';

declare global {
  interface Window {
    instgrm?: {
      Embeds?: {
        process: () => void;
      };
    };
  }
}

export type InstagramReelFeatureProps = {
  permalink:
    | `https://www.instagram.com/reel/${string}`
    | `https://www.instagram.com/p/${string}`;
  title: string;
  summary: string;
  takeaways: string[];
  transcript?: string;
  relatedGuide: {
    href: string;
    label: string;
  };
};

export default function InstagramReelFeature({
  permalink,
  title,
  summary,
  takeaways,
  transcript,
  relatedGuide,
}: InstagramReelFeatureProps) {
  useEffect(() => {
    window.instgrm?.Embeds?.process();
  }, [permalink]);

  return (
    <section className="seo-reel-feature" aria-labelledby={`reel-${title.replace(/\W+/g, '-').toLowerCase()}`}>
      <Script
        src="https://www.instagram.com/embed.js"
        strategy="lazyOnload"
        onLoad={() => window.instgrm?.Embeds?.process()}
      />

      <div className="seo-reel-embed">
        <blockquote
          className="instagram-media"
          data-instgrm-captioned
          data-instgrm-permalink={permalink}
          data-instgrm-version="14"
        >
          <a href={permalink} target="_blank" rel="noopener noreferrer">
            Watch this Reel on Instagram
          </a>
        </blockquote>
      </div>

      <div className="seo-reel-companion">
        <p className="seo-eyebrow">From @iconik.style</p>
        <h2 id={`reel-${title.replace(/\W+/g, '-').toLowerCase()}`}>{title}</h2>
        <p>{summary}</p>

        <h3>What to notice</h3>
        <ul>
          {takeaways.map((takeaway) => <li key={takeaway}>{takeaway}</li>)}
        </ul>

        {transcript && (
          <details>
            <summary>Read the Reel transcript</summary>
            <p>{transcript}</p>
          </details>
        )}

        <Link href={relatedGuide.href}>{relatedGuide.label}<span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}
