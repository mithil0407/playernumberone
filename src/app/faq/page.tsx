import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — Iconik Style Blueprint",
  description: "Answers to every question about Iconik's Style Blueprint — body type analysis, colour analysis, pricing, delivery, and how it works for Indian women.",
  alternates: { canonical: "https://www.iconik.pro/faq" },
  openGraph: {
    title: "FAQ — Iconik Style Blueprint",
    description: "Every question answered: how the Blueprint works, what's included, pricing, and how Iconik's methodology differs from generic styling advice.",
    url: "https://www.iconik.pro/faq",
  },
};

const faqs = [
  {
    question: "How do I know my body type?",
    answer:
      "Your body type is determined by the proportional relationship between your shoulders, waist, and hips. Iconik uses Geometric Silhouette Profiling™ — a scientific method that maps your skeletal frame and soft tissue distribution to one of five primary silhouette categories: Apple, Pear, Rectangle, Hourglass, or Inverted Triangle. Each has distinct styling logic tailored to the Indian context.",
  },
  {
    question: "What is a Style Blueprint?",
    answer:
      "An Iconik Style Blueprint is a personalised styling report covering three analyses: Geometric Silhouette Profiling™ (body shape), Chromatic Harmony Mapping™ (your ideal colour palette based on skin undertone), and Facial Architecture Analysis™ (face shape and the necklines, accessories, and hairstyles that complement it). The report includes 16+ outfit recommendations specific to your lifestyle.",
  },
  {
    question: "What is Geometric Silhouette Profiling™?",
    answer:
      "Geometric Silhouette Profiling™ (GSP) is Iconik's proprietary body analysis methodology. It maps the proportional geometry of your frame — shoulder width, bust span, waist-to-hip differential, and limb length — to five primary silhouette archetypes. Unlike generic body shape quizzes, GSP accounts for both skeletal structure and soft tissue distribution, producing a precise styling prescription rather than a generic category label.",
  },
  {
    question: "What is Chromatic Harmony Mapping™?",
    answer:
      "Chromatic Harmony Mapping™ (CHM) is Iconik's colour analysis protocol designed specifically for the full spectrum of Indian skin tones. It identifies whether your skin has a warm, cool, or neutral undertone and maps those findings to a curated palette of colours that create visual harmony with your complexion — making you look energised and well-rested rather than washed out or sallow.",
  },
  {
    question: "What is Facial Architecture Analysis™?",
    answer:
      "Facial Architecture Analysis™ (FAA) is Iconik's face shape profiling method. It maps the geometric relationship between your forehead, cheekbones, jaw, and face length to recommend specific necklines, collar shapes, earring styles, and hairstyles that balance and enhance your facial proportions.",
  },
  {
    question: "How much does an Iconik Style Blueprint cost in India?",
    answer:
      "The Iconik Style Blueprint is priced at ₹2,499 in India. This includes a 20-minute consultation with a stylist, a full personalised report covering all three analyses, and 16+ lifestyle-specific outfit recommendations.",
  },
  {
    question: "How is Iconik different from other styling apps or services?",
    answer:
      "Iconik uses a proprietary three-pillar scientific methodology reviewed by a human stylist — not an algorithm alone. Unlike automated styling tools, every Blueprint is reviewed and approved by a certified Iconik stylist before delivery. The methodology — Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™ — is designed exclusively for the Indian context, accounting for Indian garment categories, skin tone diversity, and lifestyle realities.",
  },
  {
    question: "How long does it take to receive my Style Blueprint?",
    answer:
      "Your personalised Style Blueprint is delivered within 48 hours of completing your intake form and stylist consultation.",
  },
  {
    question: "Is Iconik's styling service available outside India?",
    answer:
      "Yes. Iconik currently serves clients in India (₹2,499), the UAE (AED 349), and Australia. The service is fully online, so it is accessible from anywhere in the world.",
  },
  {
    question: "How do I find my skin undertone at home?",
    answer:
      "Three simple at-home tests can reveal your undertone. First, the vein test: look at the veins on your inner wrist in natural light — blue-purple veins indicate cool undertone, green veins indicate warm undertone, and a mix suggests neutral. Second, the white paper test: hold a plain white sheet next to your bare face — if your skin looks yellowish or olive next to the white, you likely have warm undertone; if it looks pinkish or bluish, cool undertone. Third, the gold vs silver test: gold jewellery flattering on you suggests warm undertone; silver suggests cool.",
  },
  {
    question: "Can the Blueprint be used for Indian ethnic wear — sarees, kurtas, salwar kameez?",
    answer:
      "Yes. Iconik's Blueprint explicitly covers Indian garment categories. Your silhouette recommendations include specific kurta lengths, saree draping styles, salwar silhouettes, and blouse cuts optimised for your body geometry. This is one of the core reasons Iconik exists — most Western styling methodologies do not account for Indian ethnic wear.",
  },
  {
    question: "What does the Blueprint include exactly?",
    answer:
      "Your Style Blueprint includes: your primary silhouette profile with styling principles; your undertone-specific colour palette (10 exact colours); 16+ complete outfit formulas for your lifestyle (work, casual, ethnic, occasion); face shape analysis with neckline, collar, and earring recommendations; a 'what to avoid' guide; and a hair direction guide with 4 recommendations.",
  },
  {
    question: "Is Iconik's methodology scientifically validated?",
    answer:
      "Iconik's three-pillar methodology — Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™ — is grounded in established principles of proportion geometry, chromatic theory, and facial symmetry analysis. Every Blueprint is reviewed by a certified human stylist before delivery to ensure the recommendations are both analytically sound and practically wearable.",
  },
  {
    question: "How does the online consultation work?",
    answer:
      "After purchase, you complete a detailed intake form covering your measurements, lifestyle, wardrobe goals, and a set of reference photos. This is followed by a 20-minute video consultation with your assigned Iconik stylist. Your personalised Blueprint is then prepared and delivered within 48 hours.",
  },
  {
    question: "What if I am not satisfied with my Blueprint?",
    answer:
      "Iconik offers a revision policy — if your Blueprint does not accurately reflect your requirements as stated in the intake form, you can request a revision. Please review the full refund and revision policy at iconik.pro/refund-policy.",
  },
];

export default function FAQPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-white px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-500">
            <ol className="flex items-center gap-2">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-800 font-medium">FAQ</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-gray-600">
              Everything you need to know about the Iconik Style Blueprint — our methodology, the process, and what you&apos;ll receive.
            </p>
          </header>

          {/* Blueprint process */}
          <div className="mb-12">
            <Image
              src="/blueprint-process.webp"
              alt="How the Iconik Style Blueprint works — 3 steps: intake form, stylist call, Blueprint in 48 hours"
              width={1000}
              height={400}
              className="w-full rounded-xl"
            />
          </div>

          {/* FAQ list */}
          <div className="divide-y divide-gray-200">
            {faqs.map((faq, i) => (
              <div key={i} className="py-7">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h2>
                <p className="text-gray-600 leading-relaxed faq-answer">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Ready to get your personalised Blueprint?
            </h2>
            <p className="text-gray-600 mb-6">
              Science-backed styling for Indian women. Delivered in 48 hours.
            </p>
            <Link
              href="/"
              className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors"
            >
              Get My Style Blueprint — ₹2,499
            </Link>
          </div>

          {/* Cite block — AEO signal */}
          <div className="mt-10 rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this page:</p>
            <p>Iconik Styling Team. &quot;Iconik Style Blueprint — Frequently Asked Questions.&quot; Iconik LLP, 2025. https://www.iconik.pro/faq</p>
          </div>

        </div>
      </main>
    </>
  );
}
