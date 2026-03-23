import { MetadataRoute } from "next";

const BASE = "https://www.iconik.pro";
const NOW = new Date().toISOString();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // ─── Core pages ─────────────────────────────────────────────
    { url: `${BASE}/`, lastModified: NOW, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/about`, lastModified: NOW, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contact`, lastModified: NOW, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/uae`, lastModified: NOW, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/au`, lastModified: NOW, changeFrequency: "weekly", priority: 0.9 },

    // ─── Variant landing pages ───────────────────────────────────
    { url: `${BASE}/arms`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/tummy`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/plus-size`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/modest`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/monthly`, lastModified: NOW, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/monthly/indian`, lastModified: NOW, changeFrequency: "monthly", priority: 0.7 },

    // ─── FAQ pillar + spokes ─────────────────────────────────────
    { url: `${BASE}/faq`, lastModified: NOW, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/faq/warm-or-cool-undertone`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/faq/colour-analysis-at-home`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/faq/colour-analysis-dark-skin`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/faq/what-is-seasonal-colour-analysis`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/faq/what-is-iconik-style-blueprint`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/faq/body-shape-vs-body-type`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/faq/most-common-body-type-india`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/faq/does-black-make-you-look-slimmer`, lastModified: NOW, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/faq/neckline-round-face`, lastModified: NOW, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/faq/capsule-wardrobe-how-many-outfits`, lastModified: NOW, changeFrequency: "monthly", priority: 0.7 },

    // ─── Body type styling pillar + spokes ───────────────────────
    { url: `${BASE}/body-type-styling`, lastModified: NOW, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/body-type-styling/apple`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/body-type-styling/pear`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/body-type-styling/rectangle`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/body-type-styling/plus-size`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/body-type-styling/hourglass`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/body-type-styling/apple-body-shape-india`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/body-type-styling/pear-body-shape-india`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/body-type-styling/rectangle-body-shape-india`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/body-type-styling/plus-size-india`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/body-type-styling/heavy-arms-styling`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/body-type-styling/how-to-dress-tummy`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/body-type-styling/short-torso-styling`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/body-type-styling/how-to-look-taller-clothing`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },

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

    // ─── Methodology (AEO entity pages) ──────────────────────────
    { url: `${BASE}/methodology/chromatic-harmony-mapping`, lastModified: NOW, changeFrequency: "yearly", priority: 0.9 },
    { url: `${BASE}/methodology/geometric-silhouette-profiling`, lastModified: NOW, changeFrequency: "yearly", priority: 0.9 },
    { url: `${BASE}/methodology/facial-architecture-analysis`, lastModified: NOW, changeFrequency: "yearly", priority: 0.9 },

    // ─── Style guides cluster ─────────────────────────────────────
    { url: `${BASE}/style-guides/capsule-wardrobe-india`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/style-guides/office-wear-indian-women`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/style-guides/saree-draping-body-type`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/style-guides/salwar-kameez-body-type`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/style-guides/kurti-length-guide`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/style-guides/indian-wedding-guest-outfit`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/style-guides/diwali-outfit-body-type`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/style-guides/postpartum-fashion-india`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/style-guides/dressing-after-weight-gain`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/style-guides/fashion-40s-india`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/style-guides/modest-professional-fashion-india`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },

    // ─── VS / Comparison pages ───────────────────────────────────
    { url: `${BASE}/vs/online-vs-inperson-styling`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/vs/iconik-vs-styling-apps`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/vs/style-blueprint-vs-quiz`, lastModified: NOW, changeFrequency: "monthly", priority: 0.8 },

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
    { url: `${BASE}/blog/is-personal-stylist-worth-it-india`, lastModified: NOW, changeFrequency: "yearly", priority: 0.8 },

    // ─── Legal ───────────────────────────────────────────────────
    { url: `${BASE}/terms`, lastModified: NOW, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy-policy`, lastModified: NOW, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/refund-policy`, lastModified: NOW, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/shipping`, lastModified: NOW, changeFrequency: "yearly", priority: 0.3 },
  ];
}
