import type { Metadata } from "next";
import Link from "next/link";
import { bodyTypeLinks, colourAnalysisLinks, methodologyLinks } from "@/lib/seoContent";

export const metadata: Metadata = {
  title: "Iconik Style Blog — Body Type, Colour Analysis & Personal Styling",
  description: "Science-backed styling guides for Indian women. Deep dives into body type styling, colour analysis, proprietary methodologies, and real client transformations.",
  alternates: { canonical: "https://www.iconik.pro/blog" },
  openGraph: {
    title: "Iconik Style Blog — Body Type, Colour Analysis & Personal Styling",
    description: "Science-backed styling guides for Indian women.",
    url: "https://www.iconik.pro/blog",
  },
};

const posts = [
  {
    slug: "what-is-geometric-silhouette-profiling",
    title: "What is Geometric Silhouette Profiling™?",
    description: "The complete definition of Iconik's proprietary body analysis methodology — what it is, how it works, and how it differs from standard body shape quizzes.",
    date: "2025-01-01",
  },
  {
    slug: "what-is-chromatic-harmony-mapping",
    title: "What is Chromatic Harmony Mapping™?",
    description: "Iconik's colour analysis protocol for Indian skin tones — how undertone identification produces a personalised colour palette.",
    date: "2025-01-08",
  },
  {
    slug: "what-is-facial-architecture-analysis",
    title: "What is Facial Architecture Analysis™?",
    description: "How Iconik's face shape profiling method produces neckline, earring, and hairstyle recommendations from facial geometry.",
    date: "2025-01-15",
  },
  {
    slug: "is-personal-stylist-worth-it-india",
    title: "Is a Personal Stylist Worth It in India?",
    description: "A practical breakdown of when personal styling is worth paying for, what it should include, and how to compare it with apps or quizzes.",
    date: "2025-01-22",
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Iconik Style Blog</h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Science-backed styling guides for Indian women, reviewed by Iconik and connected to the colour, body, and methodology hubs.
          </p>
        </header>
        <div className="divide-y divide-gray-200">
          {posts.map((post) => (
            <article key={post.slug} className="py-8">
              <time className="text-sm text-gray-400 mb-2 block">{post.date}</time>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                <Link href={`/blog/${post.slug}`} className="hover:underline">{post.title}</Link>
              </h2>
              <p className="text-gray-600 leading-relaxed">{post.description}</p>
              <Link href={`/blog/${post.slug}`} className="mt-3 inline-block text-sm font-semibold text-black underline underline-offset-4 hover:opacity-70">
                Read →
              </Link>
            </article>
          ))}
        </div>
        <section className="mt-14 rounded-2xl border border-gray-200 bg-gray-50 p-7">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Start with the core hubs</h2>
          <p className="mb-5 leading-relaxed text-gray-600">
            If you are researching a styling question, these hubs are stronger starting points than isolated posts because they link the full topical cluster.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {[colourAnalysisLinks[0], bodyTypeLinks[0], methodologyLinks[0]].map((link) => (
              <Link key={link.href} href={link.href} className="rounded-xl border border-gray-200 bg-white p-4 hover:bg-gray-50">
                <p className="mb-1 font-semibold text-gray-900">{link.title}</p>
                <p className="text-sm leading-relaxed text-gray-600">{link.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
