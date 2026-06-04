import Image from "next/image";
import Link from "next/link";

interface CityLandingPageProps {
  city: string;
  cityContext: string;
  testimonial: { name: string; text: string };
  localHighlights?: string[];
  wardrobeContexts?: { title: string; description: string }[];
  faqs?: { q: string; a: string }[];
}

const defaultHighlights = [
  "Online consultation and analysis, so you do not need an in-person appointment.",
  "Colour, silhouette, and face-shape guidance in one documented Blueprint.",
  "Outfit formulas for work, ethnic, casual, and occasion dressing.",
];

const cityLocalContent: Record<string, {
  highlights: string[];
  contexts: { title: string; description: string }[];
  faqs: { q: string; a: string }[];
}> = {
  Mumbai: {
    highlights: [
      "Built for office-to-dinner wardrobes across BKC, Lower Parel, Andheri, and South Mumbai.",
      "Accounts for humid-weather fabrics, polished workwear, event dressing, and compact wardrobes.",
      "Useful if you need a sharper shopping system before weddings, client meetings, or social events.",
    ],
    contexts: [
      {
        title: "Corporate and founder wardrobes",
        description: "Mumbai workwear often needs to move from formal meetings to evening plans. The Blueprint prioritizes repeatable outfit formulas, breathable structure, and colours that still look polished under office and event lighting.",
      },
      {
        title: "Wedding and occasion dressing",
        description: "For Mumbai events, the stylist can map saree, lehenga, gown, and fusion choices to your undertone and body geometry so occasion wear feels elevated without becoming costume-like.",
      },
      {
        title: "Small-closet efficiency",
        description: "Many Mumbai wardrobes need fewer pieces doing more jobs. The Blueprint can emphasize capsules, repeatable neutrals, and high-impact accents instead of endless shopping.",
      },
    ],
    faqs: [
      {
        q: "Do I need an in-person personal stylist in Mumbai?",
        a: "Not always. If your main need is wardrobe strategy, colour analysis, silhouette guidance, and shopping clarity, Iconik can handle it online. In-person styling is more useful only when someone must physically shop or fit garments with you.",
      },
      {
        q: "Can the Blueprint help with Mumbai humidity?",
        a: "Yes. During intake, you can ask the stylist to prioritize breathable fabrics, non-cling silhouettes, and office-ready outfit formulas that still work in humid weather.",
      },
      {
        q: "Is Iconik useful for Mumbai wedding shopping?",
        a: "Yes. The Blueprint helps you choose occasion colours, necklines, blouse shapes, and silhouettes that suit your profile before you invest in expensive wedding pieces.",
      },
    ],
  },
  Delhi: {
    highlights: [
      "Balances Delhi NCR corporate polish with wedding, festive, and social-event dressing.",
      "Useful for wardrobes that move between South Delhi, Gurgaon, Noida, and formal family occasions.",
      "Prioritizes structured layers, colour authority, and outfit formulas with clear presence.",
    ],
    contexts: [
      {
        title: "Formal work and public-facing roles",
        description: "Delhi wardrobes often need more visible authority. The Blueprint can prioritize structured kurtas, blazers, sarees, and colour palettes that read composed in meetings and events.",
      },
      {
        title: "Heavy occasion calendars",
        description: "For weddings and family events, the guidance can separate what works for daytime functions, cocktail evenings, and traditional ceremonies based on your proportions and undertone.",
      },
      {
        title: "Seasonal wardrobe shifts",
        description: "Delhi's summer-to-winter swing makes layering strategy important. The Blueprint can define warm-weather bases and winter layers without changing your core style identity.",
      },
    ],
    faqs: [
      {
        q: "Is online styling enough for Delhi NCR?",
        a: "Yes if you need a styling framework, not a shopping assistant. Iconik gives you the colour, silhouette, and outfit logic to use across Delhi, Gurgaon, and Noida stores or online shopping.",
      },
      {
        q: "Can Iconik help with formal Indian wear?",
        a: "Yes. The Blueprint covers sarees, suits, kurtas, lehengas, necklines, dupatta placement, and colour choices in addition to western workwear.",
      },
      {
        q: "Can the recommendations account for Delhi winters?",
        a: "Yes. You can ask for layering formulas, coat/blazer shapes, and winter colour combinations during intake.",
      },
    ],
  },
  Bangalore: {
    highlights: [
      "Built for tech, startup, hybrid-work, and smart-casual wardrobes.",
      "Translates relaxed Bangalore dressing into sharper formulas for leadership, interviews, and client meetings.",
      "Works across western, fusion, and occasional ethnic wear without over-formalizing your style.",
    ],
    contexts: [
      {
        title: "Tech and startup workwear",
        description: "Bangalore style often rejects stiff formality, but still needs intention. The Blueprint can define smart-casual formulas that look credible without feeling overdressed.",
      },
      {
        title: "Hybrid lifestyle wardrobes",
        description: "If your week moves between home, office, coworking spaces, and dinners, the guidance can prioritize pieces that mix easily across contexts.",
      },
      {
        title: "Low-effort polish",
        description: "The stylist can focus on comfortable fabrics, clean silhouettes, and colour palettes that create polish without heavy styling.",
      },
    ],
    faqs: [
      {
        q: "Can Iconik make Bangalore smart-casual dressing look more polished?",
        a: "Yes. The Blueprint identifies the silhouettes, layers, shoes, and colours that make relaxed outfits look intentional rather than underdressed.",
      },
      {
        q: "Is this useful for startup founders or product leaders?",
        a: "Yes. It can create a repeatable leadership wardrobe for presentations, hiring, investor meetings, and day-to-day office wear.",
      },
      {
        q: "Does the Blueprint cover ethnic wear too?",
        a: "Yes. Bangalore clients can request ethnic, fusion, or occasion formulas alongside western workwear.",
      },
    ],
  },
  Hyderabad: {
    highlights: [
      "Covers tech-sector workwear, formal events, and traditional Hyderabadi occasion dressing.",
      "Useful for wardrobes that need polish without losing comfort in warm weather.",
      "Connects colour analysis with sarees, suits, jewellery tones, and event outfits.",
    ],
    contexts: [
      {
        title: "Tech and corporate offices",
        description: "Hyderabad professionals often need neat but comfortable dressing. The Blueprint can prioritize breathable fabrics, non-cling fits, and colours that hold authority.",
      },
      {
        title: "Festive and wedding wardrobes",
        description: "The guidance can map jewellery metals, saree colours, suit silhouettes, and embellishment levels to your undertone and visual scale.",
      },
      {
        title: "Day-to-evening dressing",
        description: "For clients moving from office to family or social plans, the stylist can build outfit formulas that shift with accessories instead of full outfit changes.",
      },
    ],
    faqs: [
      {
        q: "Can Iconik help with Hyderabad wedding and festive wear?",
        a: "Yes. The Blueprint covers ethnic occasion wear, including colours, silhouettes, necklines, jewellery tone, and styling details.",
      },
      {
        q: "Will the recommendations work for warm weather?",
        a: "Yes. You can ask the stylist to prioritize fabrics and silhouettes that remain structured without feeling heavy.",
      },
      {
        q: "Is online styling practical for Hyderabad clients?",
        a: "Yes. Since the output is a documented style system, you can apply it while shopping locally or online.",
      },
    ],
  },
  Chennai: {
    highlights: [
      "Designed for humid-weather dressing, South Indian skin-tone colour nuance, and saree/salwar context.",
      "Balances traditional aesthetics with professional and corporate wardrobes.",
      "Useful for choosing colours that flatter deeper, warm, olive, neutral, and cool undertones.",
    ],
    contexts: [
      {
        title: "South Indian colour analysis",
        description: "Chennai clients often need more nuanced colour guidance than generic warm-undertone advice. The Blueprint separates undertone from skin depth so deeper and wheatish skin tones are not treated as one category.",
      },
      {
        title: "Saree and blouse decisions",
        description: "The stylist can map blouse necklines, sleeve lengths, saree colours, and drape effects to your face shape, body geometry, and undertone.",
      },
      {
        title: "Humid professional dressing",
        description: "The guidance can prioritize breathable structure, colour clarity, and silhouettes that look polished in Chennai weather.",
      },
    ],
    faqs: [
      {
        q: "Does Iconik account for South Indian skin tones?",
        a: "Yes. Iconik separates undertone, skin depth, and contrast so Chennai clients do not get one-size-fits-all colour advice.",
      },
      {
        q: "Can the Blueprint help with saree colours and blouse necklines?",
        a: "Yes. Saree colours, blouse shapes, necklines, and jewellery tone can all be included in the recommendations.",
      },
      {
        q: "Can online styling work for Chennai's climate?",
        a: "Yes. You can ask the stylist to prioritize humidity-friendly fabrics, sleeve lengths, and silhouettes.",
      },
    ],
  },
  Pune: {
    highlights: [
      "Built for Pune's mix of tech offices, campus/startup culture, and social weekends.",
      "Useful for wardrobes moving between Hinjewadi, Baner, Koregaon Park, and family occasions.",
      "Prioritizes capsule logic, smart casual polish, and wearable ethnic/fusion formulas.",
    ],
    contexts: [
      {
        title: "Smart-casual tech wardrobes",
        description: "Pune workwear often sits between formal and relaxed. The Blueprint can define clean formulas for office, client calls, and after-work plans.",
      },
      {
        title: "Compact capsule dressing",
        description: "If you want fewer, better pieces, the stylist can prioritize repeatable combinations, neutral anchors, and accent colours that suit your undertone.",
      },
      {
        title: "Family and festive dressing",
        description: "The recommendations can include Maharashtrian and broader Indian occasion wear without disconnecting from your everyday style.",
      },
    ],
    faqs: [
      {
        q: "Is Iconik useful for Pune's smart-casual work culture?",
        a: "Yes. The Blueprint turns relaxed office dressing into clear outfit formulas so you look polished without feeling overdressed.",
      },
      {
        q: "Can it help me build a smaller wardrobe?",
        a: "Yes. You can ask for capsule-focused recommendations with repeatable outfit combinations.",
      },
      {
        q: "Does the Blueprint cover ethnic and western wear?",
        a: "Yes. Pune clients can request both, including office, casual, festive, and family-event formulas.",
      },
    ],
  },
};

export default function CityLandingPage({
  city,
  cityContext,
  testimonial,
  localHighlights,
  wardrobeContexts,
  faqs,
}: CityLandingPageProps) {
  const cityDefaults = cityLocalContent[city];
  const resolvedHighlights = localHighlights ?? cityDefaults?.highlights ?? defaultHighlights;
  const resolvedWardrobeContexts = wardrobeContexts ?? cityDefaults?.contexts ?? [];
  const cityFaqs = faqs ?? cityDefaults?.faqs ?? [
    {
      q: `Can I use Iconik if I live in ${city} but want a fully online service?`,
      a: `Yes. Iconik is designed to work online, so your location in ${city} does not limit the quality of the analysis. The process is built around intake, review, and a documented Blueprint rather than an in-person appointment.`,
    },
    {
      q: `Is the Blueprint relevant for ${city}'s work and social dressing context?`,
      a: `Yes. The recommendations are built around your lifestyle, which means the final guidance can account for office dressing, event dressing, ethnic wear, and day-to-day wardrobe use in ${city}.`,
    },
    {
      q: "Where should I start if I'm comparing local stylists with Iconik?",
      a: "Start with the national service page and methodology pages first. They explain what the Blueprint includes, how it works across India, and why a digital, measurement-led approach can be more useful than generic local styling advice.",
    },
  ];

  return (
    <main className="min-h-screen bg-white px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">

        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-500">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li className="text-gray-800 font-medium">Personal Stylist in {city}</li>
          </ol>
        </nav>

        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
            Personal Stylist in {city} — Iconik Style Blueprint
          </h1>
          <p className="article-summary text-lg text-gray-600 leading-relaxed">
            {cityContext}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm text-gray-600">
            <span className="rounded-full border border-gray-200 px-3 py-1">Reviewed 2026</span>
            <span className="rounded-full border border-gray-200 px-3 py-1">By Mithil Navalakha, Iconik founder</span>
            <span className="rounded-full border border-gray-200 px-3 py-1">Online across India</span>
          </div>
        </header>

        <section className="mb-12 rounded-xl border border-gray-200 bg-gray-50 p-7">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            What makes Iconik useful for {city} wardrobes?
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Iconik is useful for {city} wardrobes because it gives you a repeatable styling system instead of a one-time shopping opinion. Your Blueprint connects your body geometry, skin undertone, face shape, and lifestyle, then turns that into outfit formulas you can reuse.
          </p>
          <ul className="space-y-3 text-gray-600">
            {resolvedHighlights.map((highlight) => (
              <li key={highlight} className="flex gap-3">
                <span className="font-bold text-green-600">✓</span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            How Iconik Works for {city} Women
          </h2>
          <div className="mb-6">
            <Image
              src="/blueprint-process.webp"
              alt="How the Iconik Style Blueprint works — intake form, stylist call, Blueprint in 48 hours"
              width={1000}
              height={400}
              className="w-full rounded-xl"
            />
          </div>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Iconik is a fully online personal styling service — which means you get the same science-backed Style Blueprint whether you are in {city}, Mumbai, or Dubai. There are no in-person appointments required. The entire process happens on your schedule:
          </p>
          <ol className="space-y-3 text-gray-600 list-decimal list-inside">
            <li>Complete a detailed intake form covering your measurements, lifestyle, and wardrobe goals</li>
            <li>Book a 20-minute video consultation with your assigned Iconik stylist</li>
            <li>Receive your personalised Style Blueprint within 48 hours</li>
          </ol>
        </section>

        {resolvedWardrobeContexts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {city} wardrobe situations the Blueprint covers
            </h2>
            <p className="text-gray-600 mb-5 leading-relaxed">
              The recommendations are not generic city copy. These are the everyday dressing contexts a {city} client can ask the stylist to prioritize during intake.
            </p>
            <div className="grid gap-4">
              {resolvedWardrobeContexts.map((item) => (
                <div key={item.title} className="rounded-xl border border-gray-200 p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-12 rounded-xl bg-gray-50 border border-gray-200 p-7">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What&apos;s Included in Your Blueprint</h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex gap-3"><span className="text-green-600 font-bold">✓</span><span><strong>Geometric Silhouette Profiling™</strong> — your body frame mapped to a precise silhouette category with styling principles</span></li>
            <li className="flex gap-3"><span className="text-green-600 font-bold">✓</span><span><strong>Chromatic Harmony Mapping™</strong> — your undertone-matched colour palette (10 exact colours)</span></li>
            <li className="flex gap-3"><span className="text-green-600 font-bold">✓</span><span><strong>Facial Architecture Analysis™</strong> — necklines, earrings, and hairstyles for your face shape</span></li>
            <li className="flex gap-3"><span className="text-green-600 font-bold">✓</span><span>16+ complete outfit formulas for your lifestyle (work, ethnic, casual, occasion)</span></li>
            <li className="flex gap-3"><span className="text-green-600 font-bold">✓</span><span>A &quot;what to avoid&quot; guide</span></li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            What {city} Clients Say
          </h2>
          <blockquote className="border-l-4 border-gray-900 pl-6">
            <p className="text-gray-700 text-lg italic mb-3">&ldquo;{testimonial.text}&rdquo;</p>
            <cite className="text-gray-500 text-sm not-italic">— {testimonial.name}</cite>
          </blockquote>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Why Science-Backed Styling Matters
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Most styling advice is generic — it tells you what is &quot;in trend&quot; without accounting for your specific body geometry or skin undertone. Iconik&apos;s approach is the opposite: every recommendation is derived from your individual analysis, not from trend forecasts. The result is a wardrobe that works for you consistently, not just when the trend aligns with your body type by chance.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Iconik&apos;s three proprietary methodologies — <Link href="/body-type-styling" className="underline">Geometric Silhouette Profiling™</Link>, <Link href="/colour-analysis" className="underline">Chromatic Harmony Mapping™</Link>, and Facial Architecture Analysis™ — were designed specifically for Indian women, accounting for Indian garment categories, the diversity of Indian skin tones, and the professional and social contexts that Indian women navigate.
          </p>
        </section>

        <section className="mb-12 rounded-xl border border-gray-200 bg-gray-50 p-7">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Common Questions from {city} Clients
          </h2>
          <div className="space-y-5 text-gray-600">
            {cityFaqs.map((faq) => (
            <div key={faq.q}>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {faq.q}
              </h3>
              <p className="leading-relaxed">
                {faq.a}
              </p>
            </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Start with the National Service Pages
          </h2>
          <ul className="space-y-2 text-gray-600">
            <li>→ <Link href="/personal-stylist-india" className="underline hover:opacity-70">Personal Stylist India</Link></li>
            <li>→ <Link href="/how-it-works" className="underline hover:opacity-70">How Iconik Works</Link></li>
            <li>→ <Link href="/pricing" className="underline hover:opacity-70">Iconik Pricing</Link></li>
            <li>→ <Link href="/methodology" className="underline hover:opacity-70">Iconik Methodology</Link></li>
            <li>→ <Link href="/free-colour-analysis-quiz" className="underline hover:opacity-70">Free Colour Analysis Quiz</Link></li>
          </ul>
        </section>

        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            8 slots open for {city} women this week
          </h2>
          <p className="text-gray-600 mb-6">
            Science-backed styling. Delivered in 48 hours. ₹3,299.
          </p>
          <Link
            href="/"
            className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors"
          >
            Get My Style Blueprint
          </Link>
        </div>

        <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
          <p className="font-medium text-gray-700 mb-1">Cite this page:</p>
          <p>Iconik Styling Team. &quot;Personal Stylist in {city} — Iconik Style Blueprint.&quot; Iconik LLP, 2025.</p>
        </div>

      </div>
    </main>
  );
}
