import { MetadataRoute } from "next";

const BASE = "https://www.iconik.pro";
const NOW = new Date().toISOString();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // ─── Core pages ─────────────────────────────────────────────
    { url: `${BASE}/`, lastModified: NOW, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/uae`, lastModified: NOW, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/au`, lastModified: NOW, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/contact`, lastModified: NOW, changeFrequency: "monthly", priority: 0.6 },

    // ─── Variant landing pages ───────────────────────────────────
    { url: `${BASE}/arms`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/tummy`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/plus-size`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/modest`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/monthly`, lastModified: NOW, changeFrequency: "monthly", priority: 0.7 },

    // ─── FAQ ─────────────────────────────────────────────────────
    { url: `${BASE}/faq`, lastModified: NOW, changeFrequency: "monthly", priority: 0.9 },

    // ─── Body type styling pillar + spokes ───────────────────────
    { url: `${BASE}/body-type-styling`, lastModified: NOW, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/body-type-styling/apple`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/body-type-styling/pear`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/body-type-styling/rectangle`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/body-type-styling/plus-size`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/body-type-styling/hourglass`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },

    // ─── Colour analysis pillar + spokes ─────────────────────────
    { url: `${BASE}/colour-analysis`, lastModified: NOW, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/colour-analysis/how-to-find-undertone`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/colour-analysis/warm-cool-neutral-undertone-india`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/colour-analysis/warm-undertone`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/colour-analysis/cool-undertone`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/colour-analysis/neutral-undertone`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/colour-analysis/indian-skin-tones`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/colour-analysis/best-colours-dusky-skin`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/colour-analysis/best-colours-wheatish-skin-india`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/colour-analysis/best-colours-fair-skin-india`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },

    // ─── City landing pages ──────────────────────────────────────
    { url: `${BASE}/personal-stylist-mumbai`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/personal-stylist-bangalore`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/personal-stylist-delhi`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/personal-stylist-hyderabad`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/personal-stylist-chennai`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },

    // ─── Blog / AEO definition posts ─────────────────────────────
    { url: `${BASE}/blog`, lastModified: NOW, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/blog/what-is-geometric-silhouette-profiling`, lastModified: NOW, changeFrequency: "yearly", priority: 0.8 },
    { url: `${BASE}/blog/what-is-chromatic-harmony-mapping`, lastModified: NOW, changeFrequency: "yearly", priority: 0.8 },
    { url: `${BASE}/blog/what-is-facial-architecture-analysis`, lastModified: NOW, changeFrequency: "yearly", priority: 0.8 },

    // ─── Legal ───────────────────────────────────────────────────
    { url: `${BASE}/terms`, lastModified: NOW, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy-policy`, lastModified: NOW, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/refund-policy`, lastModified: NOW, changeFrequency: "yearly", priority: 0.3 },
  ];
}
