'use client';

import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Palette, Shapes, Ban } from 'lucide-react';
import { useEffect } from 'react';
import { trackCTAClick, trackPageView, trackViewContent } from '@/lib/metaPixel';

export default function UaeLandingPage() {
  useEffect(() => {
    trackPageView('UAE');
    trackViewContent('UAE Style Blueprint', 179, ['uae_style_blueprint'], 'AED', 'UAE');
  }, []);

  return (
    <>
      <Head>
        <title>ICONIK UAE | Your Personal Style Blueprint</title>
        <meta
          name="description"
          content="Your Personal Style Blueprint – curated by professional stylists in 48 hours. Trusted by 2,000+ women across 12 countries."
        />
        <meta property="og:title" content="ICONIK UAE | Your Personal Style Blueprint" />
        <meta
          property="og:description"
          content="Finally understand what flatters YOUR body, not just what's trending."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://playernumberone.com/uae" />
      </Head>

      <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">
        <section className="pt-24 md:pt-32 pb-16 px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="luxury-body text-luxury-charcoal/60 mb-4"
            >
              Trusted by 2,000+ women across 12 countries
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl lg:text-7xl luxury-heading text-luxury-charcoal mb-6 leading-[0.95]"
            >
              Your Personal Style Blueprint – Curated by Professional Stylists in 48 Hours
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-2xl luxury-body text-luxury-charcoal/80 max-w-4xl mx-auto mb-8"
            >
              Finally understand what flatters YOUR body, not just &quot;what&apos;s trending.&quot;
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-4"
            >
              <Link
                href="/uae/quiz"
                onClick={() => trackCTAClick('Start Your Style Quiz', 'Hero', 179, 'AED', 'UAE')}
                className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-10 md:px-14 py-4 md:py-5 rounded-full transition-all duration-300 luxury-body text-lg md:text-xl"
              >
                START YOUR STYLE QUIZ <ArrowRight className="ml-3 h-5 w-5" />
              </Link>
              <div className="flex flex-wrap justify-center gap-3 text-xs md:text-sm luxury-body text-luxury-charcoal/70">
                <span>⭐ 4.9/5 from 2,000+ clients</span>
                <span>🔒 Stylist-Reviewed</span>
                <span>⚡ 48-Hour Delivery</span>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 md:py-20 bg-luxury-cream/40">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl luxury-heading text-center mb-10"
            >
              Why Your Clothes Never Feel &quot;Right&quot; – Even When They&apos;re the Right Size
            </motion.h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="bg-white/90 border border-luxury-cream rounded-3xl p-6 text-center">
                <Shapes className="w-10 h-10 text-luxury-accent mx-auto mb-4" />
                <h3 className="luxury-heading text-xl mb-2">Wrong body shape rules</h3>
                <p className="luxury-body text-luxury-charcoal/70">You&apos;re shopping for silhouettes that fight your proportions.</p>
              </div>
              <div className="bg-white/90 border border-luxury-cream rounded-3xl p-6 text-center">
                <Palette className="w-10 h-10 text-luxury-green mx-auto mb-4" />
                <h3 className="luxury-heading text-xl mb-2">Wrong colors</h3>
                <p className="luxury-body text-luxury-charcoal/70">Your undertone is ignored, so outfits drain your glow.</p>
              </div>
              <div className="bg-white/90 border border-luxury-cream rounded-3xl p-6 text-center">
                <Ban className="w-10 h-10 text-luxury-gold mx-auto mb-4" />
                <h3 className="luxury-heading text-xl mb-2">Trends over rules</h3>
                <p className="luxury-body text-luxury-charcoal/70">You follow trends instead of your personal style framework.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl luxury-heading text-center mb-12"
            >
              What You Get: Your Complete Style Blueprint
            </motion.h2>
            <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] items-center">
              <div className="space-y-4">
                {[
                  'Professional Body Shape Analysis (with styling rules)',
                  'Face Shape + Hairstyle Recommendations',
                  'Seasonal Color Palette (12 colors that make you glow)',
                  '12 Complete Outfit Formulas (Work, Casual, Formal, Ethnic)',
                  'Personalized Stylist Notes Section'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 bg-luxury-cream/40 rounded-2xl p-4">
                    <CheckCircle className="w-6 h-6 text-luxury-accent mt-1" />
                    <p className="luxury-body text-luxury-charcoal/80">{item}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white/80 border border-luxury-cream rounded-3xl p-6">
                <p className="luxury-body text-luxury-charcoal/60 mb-4">Sample report preview</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative h-40 rounded-2xl overflow-hidden bg-luxury-cream/60">
                    <Image src="/wardrobe-blueprint.webp" alt="Report preview" fill className="object-cover blur-[1px]" />
                  </div>
                  <div className="relative h-40 rounded-2xl overflow-hidden bg-luxury-cream/60">
                    <Image src="/color-palette.webp" alt="Report preview" fill className="object-cover blur-[1px]" />
                  </div>
                  <div className="relative h-40 rounded-2xl overflow-hidden bg-luxury-cream/60">
                    <Image src="/style-before.webp" alt="Report preview" fill className="object-cover blur-[1px]" />
                  </div>
                  <div className="relative h-40 rounded-2xl overflow-hidden bg-luxury-cream/60">
                    <Image src="/style-after.webp" alt="Report preview" fill className="object-cover blur-[1px]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20 bg-luxury-cream/40">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl luxury-heading text-center mb-10"
            >
              What Women in Dubai Are Saying
            </motion.h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  quote:
                    "I always felt some necklines didn’t suit me but couldn’t figure out why. Now it makes sense. I’ve already stopped buying the wrong cuts 🙈 Total game changer.",
                  name: 'Priya S., Dubai'
                },
                {
                  quote:
                    "The ethnic wear guide alone was worth it. I’ve been wearing sarees the same way for years! One small drape change and I felt so much more confident at a family wedding ✨",
                  name: 'Anjali M., Sharjah'
                },
                {
                  quote:
                    "I stopped wasting money on clothes that don't work. This is the blueprint I wish I had 5 years ago.",
                  name: 'Meera K., Abu Dhabi'
                }
              ].map((testimonial) => (
                <div key={testimonial.name} className="bg-white/90 border border-luxury-cream rounded-3xl p-6">
                  <p className="luxury-body text-luxury-charcoal/80 mb-4">“{testimonial.quote}”</p>
                  <p className="luxury-body text-luxury-green font-medium">{testimonial.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl luxury-heading text-center mb-12"
            >
              How It Works
            </motion.h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: 'Complete Quiz (3 minutes)',
                  description: 'Upload 2 photos + answer 15 questions.'
                },
                {
                  title: 'Stylist Curation (48 hours)',
                  description: 'Our team analyzes your photos & preferences.'
                },
                {
                  title: 'Receive Blueprint (Email)',
                  description: 'Instant download + lifetime access.'
                }
              ].map((step) => (
                <div key={step.title} className="bg-luxury-cream/40 rounded-3xl p-6 text-center">
                  <h3 className="luxury-heading text-xl mb-2">{step.title}</h3>
                  <p className="luxury-body text-luxury-charcoal/70">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20 bg-luxury-charcoal text-luxury-warm-white">
          <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl luxury-heading mb-4"
            >
              Ready to Discover Your Style Blueprint?
            </motion.h2>
            <p className="luxury-body text-luxury-warm-white/80 mb-6">
              <span className="line-through opacity-60">AED 358</span> AED 179 — Limited Time
            </p>
            <Link
              href="/uae/quiz"
              onClick={() => trackCTAClick('Start Your Style Quiz', 'Final CTA', 179, 'AED', 'UAE')}
              className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-12 py-4 rounded-full luxury-body text-lg transition-all duration-300"
            >
              START YOUR STYLE QUIZ <ArrowRight className="ml-3 h-5 w-5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
