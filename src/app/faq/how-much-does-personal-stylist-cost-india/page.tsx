import RegisteredSeoArticle from "@/components/seo/RegisteredSeoArticle";
import { buildSeoArticleMetadata } from "@/lib/seoArticle";
import { getSeoArticle } from "@/lib/seoArticleRegistry";

const path = "/faq/how-much-does-personal-stylist-cost-india";
const article = getSeoArticle(path);

export const metadata = buildSeoArticleMetadata(article);

const serviceTypes = [
  {
    type: "Online Style Blueprint",
    range: "About ₹1,000 – ₹5,000",
    what: "A digital analysis covering body type, colour palette, and outfit recommendations. Delivered remotely, typically within 24–72 hours. No in-person sessions required.",
    bestFor: "Women who want a science-backed foundation for their wardrobe without in-person scheduling constraints.",
    iconik: true,
  },
  {
    type: "In-Person Style Consultation",
    range: "Often quoted per session or package",
    what: "A one-on-one session with a stylist, typically 1–3 hours. May include body type analysis, colour draping, and outfit direction. Quality and depth vary significantly by stylist.",
    bestFor: "Women who prefer face-to-face guidance and live in cities with access to experienced independent stylists.",
    iconik: false,
  },
  {
    type: "Wardrobe Audit",
    range: "About ₹1,500 – ₹5,000 for basic sessions",
    what: "An in-home or in-store session where a stylist reviews your existing wardrobe, removes items that don't work, and identifies gaps. Typically 3–5 hours including travel.",
    bestFor: "Women who want to rationalise an existing wardrobe rather than build a new one from a framework.",
    iconik: false,
  },
  {
    type: "Personal Shopping",
    range: "About ₹5,000 – ₹20,000 for shopping sessions",
    what: "The stylist shops with or for you — either accompanying you in-store or curating selections online. Cost depends on whether the stylist charges a flat fee, hourly rate, or percentage of the shopping spend.",
    bestFor: "Women who want someone else to manage the shopping process entirely, or who are preparing for a specific occasion.",
    iconik: false,
  },
  {
    type: "Monthly Styling Retainer",
    range: "About ₹3,000 – ₹10,000/month",
    what: "Ongoing access to a stylist for outfit reviews, shopping guidance, and seasonal wardrobe updates. Typically includes a set number of sessions or response hours per month.",
    bestFor: "Women in high-visibility professional roles or who want continuous styling support rather than a one-time analysis.",
    iconik: false,
  },
];

const faqs = [
  {
    q: "How much does a personal stylist cost in India?",
    a: "Public prices vary substantially by scope and stylist. Examples reviewed in July 2026 showed virtual or entry services from roughly ₹1,000–₹5,000, basic wardrobe consultations around ₹1,500–₹5,000, shopping sessions around ₹5,000–₹20,000, and monthly support around ₹3,000–₹10,000. Bespoke or multi-session engagements can cost much more.",
  },
  {
    q: "Is ₹3,299 a reasonable price for a personal stylist in India?",
    a: "₹3,299 sits within the broad range of entry and virtual styling offers visible in India in July 2026. Whether it is reasonable depends on the deliverables, review process, personalisation, revision policy, and whether the output gives reusable guidance rather than a short call alone.",
  },
  {
    q: "What is included in an online style blueprint?",
    a: "An online style blueprint typically covers body type identification, a colour palette based on undertone analysis, outfit formulas for your shape and colouring, and shopping guidance. Iconik's Style Blueprint includes Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and outfit recommendations including Indian ethnic wear.",
  },
  {
    q: "Is an online stylist as good as an in-person stylist?",
    a: "Online styling is useful for documented wardrobe strategy, measurement-led proportion guidance, and remote outfit planning. In-person work has an advantage when physical colour draping, garment fitting, wardrobe handling, or shopping accompaniment is required. Quality depends more on method, evidence, deliverables, and stylist skill than format alone.",
  },
];

export default function PersonalStylistCostIndiaPage() {
  return (
    <RegisteredSeoArticle
      article={article}
      faqs={faqs}
      quickAnswer={<>Basic or virtual styling commonly begins in the low thousands of rupees. Shopping, occasion, executive, and multi-session work costs more because it adds live time, sourcing, fittings, or ongoing access.</>}
      quickAnswerDetail={<>Compare scope, personalisation, written deliverables, revisions, shopping involvement, and post-delivery support—not only the number of calls.</>}
      cta={{
        title: "Compare the deliverable, then choose the service format.",
        description: "Iconik combines silhouette, colour, and outfit direction in one documented Style Blueprint with human review.",
      }}
    >
          <section id="styling-costs" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Styling Services and Costs in India</h2>
            <div className="space-y-5">
              {serviceTypes.map((s) => (
                <div key={s.type} className={`border rounded-xl p-5 ${s.iconik ? "border-gray-900 bg-gray-50" : "border-gray-200"}`}>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <p className="font-semibold text-gray-900">{s.type}</p>
                    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{s.range}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 leading-relaxed">{s.what}</p>
                  <p className="text-sm text-gray-500"><span className="font-medium text-gray-700">Best for:</span> {s.bestFor}</p>
                  {s.iconik && (
                    <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">Iconik&apos;s Style Blueprint is in this category — at ₹3,299, it covers body type, colour palette, and 16+ outfit recommendations including ethnic wear.</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section id="price-factors" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Determines the Price?</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside">
              <li><strong>Service format:</strong> Online services are often lower cost because they remove travel and live shopping time. Format alone does not establish quality; compare the method and deliverables.</li>
              <li><strong>Depth of analysis:</strong> A full methodology-based analysis (body type + colour + outfit formulas) costs more than a single-focus consultation (colour draping only, or wardrobe edit only).</li>
              <li><strong>Stylist experience and demand:</strong> Senior stylists with a track record and waitlist charge more. Newer stylists may charge less but offer comparable quality for analysis-based work.</li>
              <li><strong>City:</strong> In-person stylists in Mumbai and Delhi tend to charge more than those in Tier 2 cities, reflecting higher operating costs.</li>
              <li><strong>Inclusions:</strong> Services that include shopping accompaniment or ongoing availability cost significantly more than one-time analysis and recommendations.</li>
            </ul>
          </section>

          <section id="price-sources" className="mb-12 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm leading-relaxed text-gray-600">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Price sources and limitations</h2>
            <p className="mb-3">These are indicative market examples, not a regulated tariff or promise that every stylist will quote within the range. Prices were reviewed on 11 July 2026 and can change.</p>
            <ul className="space-y-2">
              <li>• <a className="underline" href="https://stylebuddy.in/blog/how-much-does-a-personal-styling-service-cost-in-india" rel="noopener noreferrer">StyleBuddy’s published India service ranges</a></li>
              <li>• <a className="underline" href="https://www.gayathrisreekumar.com/" rel="noopener noreferrer">Gayathri Sreekumar’s publicly listed starting price</a></li>
              <li>• <a className="underline" href="https://themarginstudio.com/" rel="noopener noreferrer">The Margin Studio’s publicly listed multi-session men’s engagement</a></li>
            </ul>
          </section>

          <section id="choose-service" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Which Service Type Is Right for You?</h2>
            <div className="space-y-3">
              {[
                { situation: "You want to understand your body type and colours from scratch", recommendation: "Online style blueprint — it gives you the foundational framework at the lowest cost" },
                { situation: "You have a full wardrobe and want to know what to keep and what to remove", recommendation: "Wardrobe audit — a stylist reviews what you have in person" },
                { situation: "You are preparing for a major event or season", recommendation: "Personal shopping or a one-time in-person consultation" },
                { situation: "You are in a high-visibility role and need ongoing support", recommendation: "Monthly retainer" },
                { situation: "You want maximum value for a complete framework — body, colour, outfits", recommendation: "Iconik's Style Blueprint — covers all three at ₹3,299" },
              ].map((item) => (
                <div key={item.situation} className="border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-1">{item.situation}</p>
                  <p className="text-sm text-gray-600">→ {item.recommendation}</p>
                </div>
              ))}
            </div>
          </section>

    </RegisteredSeoArticle>
  );
}
