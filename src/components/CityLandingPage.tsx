import Image from "next/image";
import Link from "next/link";

interface CityLandingPageProps {
  city: string;
  cityContext: string;
  testimonial: { name: string; text: string };
}

export default function CityLandingPage({ city, cityContext, testimonial }: CityLandingPageProps) {
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
        </header>

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
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I use Iconik if I live in {city} but want a fully online service?
              </h3>
              <p className="leading-relaxed">
                Yes. Iconik is designed to work online, so your location in {city} does not limit the quality of the analysis. The process is built around intake, review, and a documented Blueprint rather than an in-person appointment.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is the Blueprint relevant for {city}&apos;s work and social dressing context?
              </h3>
              <p className="leading-relaxed">
                Yes. The recommendations are built around your lifestyle, which means the final guidance can account for office dressing, event dressing, ethnic wear, and day-to-day wardrobe use in {city}.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Where should I start if I&apos;m comparing local stylists with Iconik?
              </h3>
              <p className="leading-relaxed">
                Start with the national service page and methodology pages first. They explain what the Blueprint includes, how it works across India, and why a digital, measurement-led approach can be more useful than generic local styling advice.
              </p>
            </div>
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
          </ul>
        </section>

        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            8 slots open for {city} women this week
          </h2>
          <p className="text-gray-600 mb-6">
            Science-backed styling. Delivered in 48 hours. ₹2,499.
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
