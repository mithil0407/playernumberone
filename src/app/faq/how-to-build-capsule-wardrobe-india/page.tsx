import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Build a Capsule Wardrobe in India — Iconik",
  description: "Step-by-step guide to building a capsule wardrobe in India — how many pieces you need, which categories to cover, how to choose colours, and how to include Indian ethnic wear.",
  keywords: "capsule wardrobe India, how to build capsule wardrobe India, capsule wardrobe Indian women, minimalist wardrobe India, capsule wardrobe ethnic wear India, how many clothes capsule wardrobe India",
  alternates: { canonical: "https://www.iconik.pro/faq/how-to-build-capsule-wardrobe-india" },
  openGraph: {
    title: "How to Build a Capsule Wardrobe in India — Iconik",
    description: "Step-by-step capsule wardrobe guide for Indian women — piece counts, categories, colour strategy, and how to integrate ethnic wear.",
    url: "https://www.iconik.pro/faq/how-to-build-capsule-wardrobe-india",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "How to build a capsule wardrobe India — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Build a Capsule Wardrobe in India — Iconik",
    description: "Step-by-step capsule wardrobe guide for Indian women — piece counts, categories, colour strategy, and how to integrate ethnic wear.",
    images: ["/og-image.webp"],
  },
};

const steps = [
  {
    step: "1",
    title: "Identify your undertone and colour palette",
    body: "A capsule wardrobe only works if every piece can combine with every other piece. The most reliable way to ensure this is to build around a consistent colour palette — a set of 2–3 neutrals and 3–4 accent colours that all harmonise with your skin undertone. Without this foundation, you end up with pieces that don't combine, which is exactly what a capsule wardrobe is trying to avoid.",
  },
  {
    step: "2",
    title: "Audit what you already own",
    body: "Before buying anything, identify the pieces you already have that fit your body well, suit your colours, and are in good condition. These become the foundation of your capsule. Most women find they already own 30–50% of what a functional capsule needs — the problem is that the remaining 50–70% doesn't work with those pieces because there is no colour or silhouette system tying them together.",
  },
  {
    step: "3",
    title: "Define your actual lifestyle categories",
    body: "The traditional Western capsule wardrobe (office, casual, evening) does not map to most Indian women's lives. Define your actual categories: corporate office, business casual, smart casual, festive/social, traditional formal (weddings, pujas), and everyday home. Assign a rough percentage to each based on how often you need that category — then build your capsule proportionally.",
  },
  {
    step: "4",
    title: "Build your western wear core",
    body: "Western core pieces: 3–4 fitted tops in your neutral palette, 2 trousers (one formal, one casual), 1 pair of dark jeans, 1 formal dress or skirt, 1 blazer. These should all work within your colour palette so any top can be worn with any bottom.",
  },
  {
    step: "5",
    title: "Build your ethnic wear core",
    body: "Indian ethnic core pieces: 2–3 everyday kurtas, 1–2 churidar or straight pants to pair with kurtas, 1–2 sarees for semi-formal occasions, 1 lehenga or formal Anarkali for weddings, 1 salwar suit for versatile wear. Ethnic wear in your colour palette ensures it all combines and looks considered rather than random.",
  },
  {
    step: "6",
    title: "Fill the gaps strategically",
    body: "Once you have audited and built the core, identify what is missing: a specific occasion you are under-prepared for, a colour that is missing from your palette but needed, or a garment type you own in poor condition. Buy only to fill these specific gaps — not because something is on sale or because you like it in isolation.",
  },
];

const coreCategories = [
  { category: "Western neutral tops", count: "3–4", examples: "White, cream, or soft grey fitted blouses; a simple black top; a neutral-coloured shirt" },
  { category: "Western bottoms", count: "2–3", examples: "1 formal trouser, 1 straight-leg casual trouser or dark jeans, 1 skirt (optional)" },
  { category: "Western formal/layer", count: "1–2", examples: "1 blazer or structured jacket, 1 formal dress or jumpsuit" },
  { category: "Everyday kurtas", count: "2–3", examples: "In your colour palette — cotton or linen for everyday wear, can be worn with jeans or churidar" },
  { category: "Ethnic bottoms", count: "2", examples: "1 churidar or fitted salwar, 1 palazzo or straight pants — both in neutral shades" },
  { category: "Semi-formal sarees", count: "1–2", examples: "A silk or georgette saree for office events or social occasions" },
  { category: "Formal ethnic (bridal/wedding)", count: "1", examples: "A lehenga, formal Anarkali, or heavy silk saree — in your strongest colour" },
  { category: "Casual Indian wear", count: "1–2", examples: "Short kurtis or co-ord sets for casual social occasions" },
];

export default function CapsuleWardrobeIndiaPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How many pieces is a capsule wardrobe for Indian women?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "A functional capsule wardrobe for Indian women typically contains 30–45 pieces, depending on lifestyle. This is more than the standard Western capsule recommendation of 25–33 pieces, because Indian wardrobes must cover both western and ethnic wear categories — each requiring its own set of core pieces. A realistic breakdown: 10–12 western pieces, 12–15 ethnic pieces, 5–8 occasion/formal pieces, and 3–5 outerwear and accessories.",
            },
          },
          {
            "@type": "Question",
            "name": "What is the first step in building a capsule wardrobe?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The first step is identifying your colour palette — specifically your undertone (warm, cool, or neutral) and the 5–7 colours that work best with your skin. A capsule wardrobe only functions if every piece can combine with every other piece. The most reliable way to ensure this is to build around a consistent colour palette. Without this foundation, pieces won't combine, which is the exact problem a capsule wardrobe is meant to solve.",
            },
          },
          {
            "@type": "Question",
            "name": "How do I include Indian ethnic wear in a capsule wardrobe?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Include ethnic wear using the same capsule principles: build around your colour palette, choose versatile over occasion-specific, and ensure pieces combine. Core ethnic capsule: 2–3 everyday kurtas in your palette colours, 2 ethnic bottoms (churidar + one wide-leg option), 1–2 sarees for semi-formal occasions, and 1 formal ethnic piece (lehenga or heavy Anarkali) for weddings. Kurtas that pair with both churidar and jeans are particularly high-value capsule pieces.",
            },
          },
          {
            "@type": "Question",
            "name": "How do I know if my capsule wardrobe is working?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "A working capsule wardrobe has three characteristics: (1) You can create a complete outfit from any combination of pieces in your core categories — any top works with any bottom. (2) You do not have 'orphan' pieces — items you own but never wear because nothing in your wardrobe pairs with them. (3) Getting dressed for any occasion takes under 5 minutes because you know exactly what you have and how it combines. If any of these three are not true, your capsule has gaps — either missing pieces or pieces that are off-palette.",
            },
          },
        ],
      },
      {
        "@type": "HowTo",
        "name": "How to Build a Capsule Wardrobe in India",
        "step": steps.map((s) => ({
          "@type": "HowToStep",
          "name": s.title,
          "text": s.body,
        })),
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
          { "@type": "ListItem", "position": 2, "name": "FAQ", "item": "https://www.iconik.pro/faq" },
          { "@type": "ListItem", "position": 3, "name": "How to Build a Capsule Wardrobe India", "item": "https://www.iconik.pro/faq/how-to-build-capsule-wardrobe-india" },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-white px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">

          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-500">
            <ol className="flex items-center gap-2 flex-wrap">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li aria-hidden="true">›</li>
              <li><Link href="/faq" className="hover:underline">FAQ</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-800 font-medium">How to Build a Capsule Wardrobe India</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              How to Build a Capsule Wardrobe in India
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              A capsule wardrobe is a small, intentional collection of pieces that all work together — so every item combines with every other, and you can create a complete outfit for any occasion without effort. For Indian women, a capsule wardrobe is more complex than the standard Western model because it must span both western and ethnic wear. This guide covers the piece counts, categories, colour strategy, and ethnic wear integration specific to an Indian lifestyle.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">The 6-Step Process</h2>
            <div className="space-y-5">
              {steps.map((s) => (
                <div key={s.step} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center justify-center mt-0.5">{s.step}</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">{s.title}</p>
                    <p className="text-gray-600 text-sm leading-relaxed">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Core Categories and Piece Counts</h2>
            <p className="text-gray-600 mb-5 leading-relaxed">
              A functional Indian capsule wardrobe typically contains <strong>30–45 pieces</strong> — more than a Western capsule because of the dual western/ethnic requirement. Here is the recommended breakdown:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-900">Category</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Count</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Examples</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {coreCategories.map((row) => (
                    <tr key={row.category} className="hover:bg-gray-50">
                      <td className="p-4 text-gray-700 font-medium">{row.category}</td>
                      <td className="p-4 text-gray-900 font-semibold whitespace-nowrap">{row.count}</td>
                      <td className="p-4 text-gray-500">{row.examples}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The Colour Strategy</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              A capsule wardrobe functions because its pieces combine. The mechanism that makes them combine is a consistent colour palette. Build yours around:
            </p>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-xl p-5">
                <p className="font-semibold text-gray-900 mb-2">2–3 Neutrals (the backbone)</p>
                <p className="text-gray-600 text-sm leading-relaxed">Colours that pair with everything else in your palette. For warm undertone: cream, camel, warm grey or taupe. For cool undertone: white, charcoal, cool navy. For neutral undertone: off-white, greige, warm grey.</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-5">
                <p className="font-semibold text-gray-900 mb-2">3–4 Accent colours (from your undertone palette)</p>
                <p className="text-gray-600 text-sm leading-relaxed">Colours that are most flattering for your specific undertone — see the <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis guide</Link> for your palette. All accent colours should work with all your neutrals, and ideally with each other.</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-5">
                <p className="font-semibold text-gray-900 mb-2">1 Standout formal colour</p>
                <p className="text-gray-600 text-sm leading-relaxed">For your best formal piece (bridal wear, wedding lehenga, statement saree) — your strongest undertone colour at full saturation. This is the piece you wear when the occasion demands your most considered look.</p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Guides</h2>
            <ul className="space-y-2 text-gray-600">
              <li>→ <Link href="/style-guides/capsule-wardrobe-india" className="underline hover:opacity-70">Capsule Wardrobe India — Full Style Guide</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis — Find Your Palette</Link></li>
              <li>→ <Link href="/faq/capsule-wardrobe-how-many-outfits" className="underline hover:opacity-70">How Many Outfits Does a Capsule Wardrobe Have?</Link></li>
              <li>→ <Link href="/blog/is-personal-stylist-worth-it-india" className="underline hover:opacity-70">Is a Personal Stylist Worth It in India?</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Build your capsule around a professional colour analysis</h2>
            <p className="text-gray-600 mb-6">The Iconik Style Blueprint gives you your exact colour palette (10 colours calibrated to your undertone), body type analysis, and 16+ outfit formulas — the complete foundation for a capsule wardrobe that actually works.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
