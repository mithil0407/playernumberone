'use client';

import { trackCTAClick, trackPageView, trackViewContent } from '@/lib/metaPixel';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import ExploreLinksSection from '@/components/ExploreLinksSection';
import { footerExploreGroups } from '@/lib/seoContent';
import { SUPPORT_EMAIL } from '@/lib/seo';
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Clock,
  Users,
  Heart,
  Menu,
  X,
  Star,
  Sparkles,
  Gem,
  Shield,
  Trophy,
  Award,
  Crown
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

// Tier types
type TierKey = 'starter' | 'seasonal' | 'vip';

interface Tier {
  key: TierKey;
  name: string;
  tagline: string;
  price: number;
  originalPrice?: number;
  savings?: number;
  savingsPercent?: number;
  monthlyValue?: number;
  duration: string;
  badge?: string;
  badgeIcon?: string;
  features: string[];
  ctaText: string;
  highlighted?: boolean;
  bestValue?: boolean;
}

const tiers: Tier[] = [
  {
    key: 'starter',
    name: 'Style Starter',
    tagline: 'Get your complete style blueprint',
    price: 99,
    duration: 'one-time',
    features: [
      '1 Virtual Style Consultation (20 min)',
      'Personalized Style Blueprint',
      '16 Virtual Outfit Previews',
      'Hairstyles & Makeup Blueprint',
      'Shopping Guide'
    ],
    ctaText: 'Get Started'
  },
  {
    key: 'seasonal',
    name: 'Seasonal Transformation',
    tagline: 'Transform your wardrobe this season',
    price: 237,
    originalPrice: 297,
    savings: 60,
    savingsPercent: 20,
    monthlyValue: 79,
    duration: '3 months',
    badge: 'MOST POPULAR',
    badgeIcon: '⭐',
    features: [
      'Everything in Style Starter',
      '60 AI Outfit Renders (20/month)',
      '3 Live Styling Calls (monthly)',
      'Seasonal Shopping Guide',
      '1 Style Blueprint Refresh',
      'WhatsApp Support (4hr response)'
    ],
    ctaText: 'Start My Transformation',
    highlighted: true
  },
  {
    key: 'vip',
    name: 'VIP Year-Round Style',
    tagline: 'Premium styling + WhatsApp access',
    price: 354,
    originalPrice: 594,
    savings: 240,
    savingsPercent: 40,
    monthlyValue: 59,
    duration: '6 months',
    badge: 'BEST VALUE',
    badgeIcon: '💎',
    features: [
      'Everything in Seasonal',
      '120 AI Outfit Renders (20/month)',
      '6 Live Styling Calls (monthly)',
      'Monthly Shopping Guide',
      'WhatsApp Stylist Access (9am-5pm)',
      '2 Blueprint Overhauls',
      'Priority AI Rendering (48hr)'
    ],
    ctaText: 'Get VIP Access',
    bestValue: true
  }
];

export default function MonthlyPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    minutes: 5,
    seconds: 0
  });

  // Track page view and product view on mount
  useEffect(() => {
    trackPageView('USA_Monthly_Tiered');
    trackViewContent('ICONIK Monthly Tiered Pricing', 237, ['iconik_monthly_tiered'], 'USD', 'USA_Monthly_Tiered');
  }, []);

  // Transformation images data
  const transformationImages = useMemo(() => [
    {
      src: '/ia-transformation-1.webp',
      testimonial: "I didn't realise how off my outfits were for client meetings until I saw the suggestions. Now getting ready is just faster and way less stressful.",
      name: 'Meenal R, 32, Chicago'
    },
    {
      src: '/ia-transformation-2.webp',
      testimonial: "I swear I used to return EVERY outfit I bought here 😭 After this consult I finally get what actually suits my body. Shopping feels fun again and not like a gamble 😂",
      name: 'Rhea D, 27, Dallas'
    },
    {
      src: '/ia-transformation-3.webp',
      testimonial: "I wanted modest looks that still felt polished for work. They gave me options I honestly never would have chosen but they looked really good on me.",
      name: 'Sara F, 29, San Jose'
    }
  ], []);

  // Navigation functions
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % transformationImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + transformationImages.length) % transformationImages.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  // Preload all images for faster transitions
  useEffect(() => {
    transformationImages.forEach((image) => {
      const img = new window.Image();
      img.src = image.src;
    });
  }, [transformationImages]);

  // 5-minute countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime.minutes === 0 && prevTime.seconds === 0) {
          return { minutes: 5, seconds: 0 };
        }

        if (prevTime.seconds === 0) {
          return { minutes: prevTime.minutes - 1, seconds: 59 };
        }

        return { minutes: prevTime.minutes, seconds: prevTime.seconds - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const testimonials = [
    {
      name: 'Meera S., 31, Boston',
      story: 'I finally stopped guessing what to wear to US client meetings. ICONIK made work outfits feel easy.',
      image: '/ia-testimonial-priya.webp'
    },
    {
      name: 'Devika R., 29, Austin',
      story: "I used to return everything I bought here. Now I know my fits, and shopping doesn't feel like stressful.",
      image: '/ia-testimonial-anjali.webp'
    },
    {
      name: 'Farah L., 28, Seattle',
      story: "I wanted something modest but still sharp. ICONIK showed me options I never even considered.",
      image: '/ia-testimonial-riya.webp'
    },
  ];

  const faqs = [
    {
      question: 'What\'s the difference between the tiers?',
      answer: 'Style Starter is a one-time consultation for immediate style clarity. Seasonal (3 months) adds ongoing outfit renders, monthly calls, and WhatsApp support. VIP (6 months) includes everything plus daily WhatsApp access to your stylist and priority service.'
    },
    {
      question: 'Is this a subscription? Will I be charged monthly?',
      answer: 'No! All tiers are one-time payments. You pay upfront and get access for the full duration. No recurring charges, no surprises.'
    },
    {
      question: 'What if the style suggestions don\'t feel like me?',
      answer: 'We work 1-on-1 with you to ensure the style feels authentically you. Your stylist will adapt all recommendations to match your personality and comfort level.'
    },
    {
      question: 'How quickly will I see results?',
      answer: 'Most women see immediate improvements within the first week. Style Starter delivers your complete blueprint within 7 days. Seasonal and VIP clients receive new outfit renders monthly.'
    },
    {
      question: 'Can I upgrade from Style Starter to Seasonal or VIP later?',
      answer: 'Absolutely! If you start with Style Starter and love the experience, you can upgrade anytime. We\'ll credit your original payment toward the upgrade.'
    }
  ];

  // Render tier card
  const renderTierCard = (tier: Tier, index: number) => {
    const isHighlighted = tier.highlighted;
    const isBestValue = tier.bestValue;

    return (
      <motion.div
        key={tier.key}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:-translate-y-2 ${isHighlighted
          ? 'border-luxury-gold bg-luxury-cream/60 shadow-2xl scale-[1.02] md:scale-105'
          : isBestValue
            ? 'border-luxury-accent/50 bg-luxury-pink-bg/30 shadow-xl'
            : 'border-luxury-cream bg-luxury-cream/40 hover:bg-luxury-cream/60'
          }`}
      >
        {/* Badge */}
        {tier.badge && (
          <div className={`absolute top-0 left-0 right-0 py-2 text-center text-sm font-bold ${isHighlighted
            ? 'bg-luxury-gold text-luxury-charcoal'
            : 'bg-luxury-accent text-luxury-warm-white'
            }`}>
            {tier.badgeIcon} {tier.badge}
          </div>
        )}

        <div className={`p-6 md:p-8 ${tier.badge ? 'pt-12' : ''}`}>
          {/* Tier Name */}
          <h3 className={`text-xl md:text-2xl luxury-heading text-center mb-2 ${isHighlighted ? 'text-luxury-charcoal' : 'text-luxury-charcoal'
            }`}>
            {tier.name}
          </h3>

          {/* Price */}
          <div className="text-center mb-4">
            <div className="flex items-baseline justify-center gap-2">
              <span className={`text-4xl md:text-5xl font-bold ${isHighlighted ? 'text-luxury-green' : isBestValue ? 'text-luxury-accent' : 'text-luxury-green'
                }`}>
                ${tier.price}
              </span>
              <span className="text-luxury-charcoal/60 luxury-body text-sm">
                {tier.duration}
              </span>
            </div>

            {/* Monthly value */}
            {tier.monthlyValue && (
              <p className="luxury-body text-luxury-charcoal/70 text-sm mt-1 italic">
                Only ${tier.monthlyValue}/month value
              </p>
            )}

            {/* Savings */}
            {tier.originalPrice && tier.savings && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="line-through text-luxury-charcoal/40 text-sm">
                  ${tier.originalPrice}
                </span>
                <span className="bg-luxury-green/10 text-luxury-green px-2 py-0.5 rounded-full text-xs font-semibold">
                  SAVE ${tier.savings} ({tier.savingsPercent}% OFF)
                </span>
              </div>
            )}
          </div>

          {/* Tagline */}
          <p className="luxury-body text-luxury-charcoal/70 text-center text-sm mb-6">
            {tier.tagline}
          </p>

          {/* Features */}
          <ul className="space-y-3 mb-6">
            {tier.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isHighlighted ? 'text-luxury-gold' : 'text-luxury-green'
                  }`} />
                <span className="luxury-body text-luxury-charcoal/80 text-sm">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <Link
            href={`/monthly/checkout?tier=${tier.key}`}
            onClick={() => {
              trackCTAClick(tier.ctaText, 'Pricing Section', tier.price, 'USD', 'USA_Monthly_Tiered');
            }}
            className={`block w-full text-center py-3 md:py-4 rounded-full transition-all duration-300 luxury-body font-semibold ${isHighlighted
              ? 'bg-luxury-accent hover:bg-luxury-accent/90 text-luxury-warm-white shadow-lg hover:shadow-xl text-lg'
              : isBestValue
                ? 'bg-luxury-charcoal hover:bg-luxury-charcoal/90 text-luxury-warm-white'
                : 'bg-luxury-green hover:bg-luxury-green/90 text-luxury-warm-white'
              }`}
          >
            {tier.ctaText} - ${tier.price}
          </Link>
        </div>
      </motion.div>
    );
  };

  return (
      <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal scroll-smooth overflow-x-hidden pb-20 md:pb-0">
        {/* Navigation */}
        <nav className="fixed top-0 w-full bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream z-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center">
                <span className="text-3xl luxury-heading text-luxury-charcoal tracking-wider">ICONIK</span>
              </div>
              <div className="hidden md:flex items-center space-x-12">
                <a href="#features" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-green transition-colors">Features</a>
                <a href="#testimonials" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-green transition-colors">Stories</a>
                <a href="#pricing" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-green transition-colors">Pricing</a>
                <a href="#faq" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-green transition-colors">FAQ</a>
                <Link
                  href="/monthly/checkout?tier=seasonal"
                  className="bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-8 py-3 rounded-full transition-all duration-300 luxury-body"
                >
                  Get Started
                </Link>
              </div>
              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-luxury-charcoal/60 hover:text-luxury-charcoal p-2"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden bg-luxury-warm-white/98 backdrop-blur-xl border-t border-luxury-cream"
            >
              <div className="px-6 py-6 space-y-4">
                <a href="#features" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-green px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">Features</a>
                <a href="#testimonials" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-green px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">Stories</a>
                <a href="#pricing" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-green px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">Pricing</a>
                <a href="#faq" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-green px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">FAQ</a>
                <Link
                  href="/monthly/checkout?tier=seasonal"
                  className="block bg-luxury-accent text-luxury-warm-white px-8 py-4 rounded-full luxury-body text-center mt-6 transition-all duration-300"
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="pt-24 md:pt-32 pb-12 md:pb-16 px-4 md:px-6 lg:px-8 relative" id="hero">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-8">
              {/* Press Logos */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-2 md:mt-4 mb-3 md:mb-4"
              >
                <p className="luxury-body text-luxury-charcoal/60 mb-4">Featured in</p>
                <div className="flex items-center justify-center gap-8 md:gap-12">
                  <Image
                    src="/times-of-india-logo.png"
                    alt="Times of India"
                    width={120}
                    height={40}
                    className="opacity-40 hover:opacity-70 transition-opacity h-[40px] w-auto md:h-[50px]"
                  />
                  <Image
                    src="/femina-logo.png"
                    alt="Femina"
                    width={120}
                    height={40}
                    className="opacity-40 hover:opacity-70 transition-opacity h-[40px] w-auto md:h-[50px]"
                  />
                  <Image
                    src="/vogue-india-logo.png"
                    alt="Vogue India"
                    width={120}
                    height={40}
                    className="opacity-40 hover:opacity-70 transition-opacity h-[40px] w-auto md:h-[50px]"
                  />
                </div>
              </motion.div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl luxury-heading text-luxury-charcoal mb-4 md:mb-6 leading-[0.9] tracking-tight">
                Discover <span className="text-luxury-accent">Your Perfect Style</span> in <span className="text-luxury-charcoal">24 hours</span>
              </h1>
              <p className="text-xl md:text-2xl lg:text-3xl luxury-heading text-luxury-charcoal/90 max-w-4xl mx-auto mb-4 leading-relaxed">
                Style Consulting for Indian-American Women Who Feel Caught Between Two Worlds
              </p>


              {/* Testimonial Slideshow Above the Fold */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="max-w-4xl mx-auto mb-4 md:mb-6"
              >
                <div className="bg-luxury-cream/50 backdrop-blur-sm rounded-3xl p-4 md:p-6 border border-luxury-cream">
                  <div className="text-center mb-4">
                    <h3 className="text-xl md:text-2xl luxury-heading text-luxury-charcoal">
                      ICONIK Transformations
                    </h3>
                  </div>

                  {/* Single Transformation Image with Arrow */}
                  <div className="flex items-center justify-center gap-4 md:gap-6">
                    {/* Left Arrow */}
                    <button
                      onClick={prevImage}
                      className="p-2 md:p-3 bg-luxury-accent/10 hover:bg-luxury-accent/20 rounded-full transition-all duration-300 group"
                    >
                      <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-luxury-charcoal group-hover:text-luxury-green" />
                    </button>

                    {/* 1:1 Square Image Placeholder */}
                    <div className="relative w-64 h-64 md:w-80 md:h-80 bg-luxury-cream/30 rounded-2xl overflow-hidden border-2 border-luxury-cream">
                      <Image
                        src={transformationImages[currentImageIndex].src}
                        alt="Style Transformation"
                        width={320}
                        height={320}
                        className="w-full h-full object-cover"
                        priority
                        loading="eager"
                      />
                    </div>

                    {/* Right Arrow */}
                    <button
                      onClick={nextImage}
                      className="p-2 md:p-3 bg-luxury-accent/10 hover:bg-luxury-accent/20 rounded-full transition-all duration-300 group"
                    >
                      <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-luxury-charcoal group-hover:text-luxury-green" />
                    </button>
                  </div>

                  {/* Testimonial Text Below Image */}
                  <div className="text-center mt-6 px-4">
                    <p className="text-luxury-charcoal text-sm md:text-base luxury-body leading-relaxed mb-2">
                      &quot;{transformationImages[currentImageIndex].testimonial}&quot;
                    </p>
                    <p className="text-luxury-green text-xs md:text-sm luxury-body font-medium">
                      - {transformationImages[currentImageIndex].name}
                    </p>
                  </div>

                  {/* Dots Indicator */}
                  <div className="flex justify-center gap-2 mt-6">
                    {transformationImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-luxury-accent' : 'bg-luxury-accent/30'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <Link
                  href="/monthly/checkout?tier=seasonal"
                  onClick={() => {
                    trackCTAClick('Begin Your Transformation', 'Hero Section', 237, 'USD', 'USA_Monthly_Tiered');
                  }}
                  className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-12 md:px-16 py-4 md:py-6 text-lg md:text-xl rounded-full transition-all duration-500 transform hover:-translate-y-1 luxury-body"
                >
                  Begin Your Transformation <ArrowRight className="ml-3 h-5 w-5 inline" />
                </Link>
              </motion.div>

            </div>
          </div>
        </section>

        {/* Elegant Stats */}
        <section className="py-12 md:py-20 bg-luxury-cream/30">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
              <div className="text-center group">
                <div className="text-4xl md:text-6xl luxury-heading text-luxury-green mb-4 group-hover:scale-105 transition-transform duration-300">
                  200+
                </div>
                <div className="luxury-body text-luxury-charcoal/70">Transformations</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl md:text-6xl luxury-heading text-luxury-green mb-4 group-hover:scale-105 transition-transform duration-300">
                  95%
                </div>
                <div className="luxury-body text-luxury-charcoal/70">Confidence Elevation</div>
              </div>
              <div className="text-center group">
                <div className="flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                  <span className="text-4xl md:text-6xl luxury-heading text-luxury-green">4.9</span>
                  <Star className="h-6 w-6 md:h-8 md:w-8 text-luxury-gold fill-current ml-2" />
                </div>
                <div className="luxury-body text-luxury-charcoal/70">Client Satisfaction</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl md:text-6xl luxury-heading text-luxury-green mb-4 group-hover:scale-105 transition-transform duration-300">
                  2-3
                </div>
                <div className="luxury-body text-luxury-charcoal/70">Weeks to Elegance</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="pt-8 pb-20 md:pt-12 md:pb-32 bg-luxury-warm-white relative">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-16 md:mb-24">
            <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">What You Receive</h2>
            <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
              Every consultation is tailored to celebrate your individuality and elevate your personal style.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
            {[
              { icon: <Sparkles className="h-6 w-6 text-luxury-green" />, title: "Personal Style Assessment" },
              { icon: <Gem className="h-6 w-6 text-luxury-green" />, title: "Curated Outfit Planning" },
              { icon: <Heart className="h-6 w-6 text-luxury-green" />, title: "Makeup & Grooming Guidance" },
              { icon: <Shield className="h-6 w-6 text-luxury-green" />, title: "Wardrobe Strategy" },
              { icon: <Award className="h-6 w-6 text-luxury-green" />, title: "Confidence Coaching" },
              { icon: <Trophy className="h-6 w-6 text-luxury-green" />, title: "Event-Specific Styling" }
            ].map((item, i) => (
              <div
                key={i}
                className="p-5 md:p-6 bg-luxury-cream/40 backdrop-blur-sm border border-luxury-cream hover:bg-luxury-cream/60 transition-all duration-300 rounded-xl hover:-translate-y-1 group"
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                  <h3 className="text-sm md:text-base luxury-heading text-center text-luxury-charcoal">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Why We're Different - Indian American Specific */}
          <div className="mt-16 md:mt-24 max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-luxury-cream/50 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-luxury-cream"
            >
              <h3 className="text-2xl md:text-3xl lg:text-4xl luxury-heading text-luxury-charcoal mb-6 text-center">
                We&apos;re Indian women styling Indian-American women. We get it.
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-1" />
                  <span className="luxury-body text-luxury-charcoal/80">We understand Indian body proportions (longer torsos, different bust/hip ratios)</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-1" />
                  <span className="luxury-body text-luxury-charcoal/80">We know which American brands actually work for our body types</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-1" />
                  <span className="luxury-body text-luxury-charcoal/80">We respect your modesty preferences without making you look frumpy</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-1" />
                  <span className="luxury-body text-luxury-charcoal/80">We help you navigate both worlds—boardroom to Indian wedding</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Book Image Card - Moved Lower */}
        <section className="py-20 md:py-32 bg-luxury-warm-white">
          <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-luxury-cream/50 backdrop-blur-sm rounded-3xl p-8 md:p-12 lg:p-16 border border-luxury-cream"
            >
              <div className="text-center">
                <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 mx-auto mb-4 md:mb-6">
                  <Image
                    src="/book.png"
                    alt="ICONIK Style Guide Preview"
                    width={400}
                    height={400}
                    className="object-contain drop-shadow-2xl"
                  />
                </div>
                <h3 className="text-2xl md:text-3xl lg:text-4xl luxury-heading text-luxury-charcoal mb-4">
                  Your Personal Style Guide
                </h3>
                <p className="luxury-body text-luxury-charcoal/70 text-lg md:text-xl">
                  Comprehensive style transformation roadmap
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 md:py-32 bg-luxury-cream/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-16 md:mb-24">
            <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">Client Stories</h2>
            <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
              Hear from women who transformed their confidence and presence with ICONIK.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-8 md:p-10 bg-luxury-warm-white/80 backdrop-blur-sm border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 rounded-2xl hover:-translate-y-2 group"
              >
                <div className="space-y-6">
                  <div className="aspect-square bg-luxury-cream/50 flex items-center justify-center rounded-xl overflow-hidden">
                    <Image
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.name}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                  <p className="luxury-body text-luxury-charcoal/80 text-center text-lg leading-relaxed">
                    &ldquo;{testimonial.story}&rdquo;
                  </p>
                  <div className="text-center">
                    <p className="luxury-body text-luxury-charcoal/60 mb-3">{testimonial.name}</p>
                    <div className="flex justify-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-luxury-gold fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section - 3-Tier Cards */}
        <section id="pricing" className="py-20 md:py-32 bg-luxury-warm-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-16 md:mb-24">
            <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">Choose Your Plan</h2>
            <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
              Select the package that fits your style journey. All plans are one-time payments—no subscriptions.
            </p>
          </div>

          {/* Desktop: 3 columns, Mobile: Stacked (Seasonal first) */}
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
            {/* Desktop Layout */}
            <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8">
              {tiers.map((tier, index) => renderTierCard(tier, index))}
            </div>

            {/* Mobile Layout - Seasonal first, then VIP, then Starter */}
            <div className="md:hidden space-y-6">
              {renderTierCard(tiers[1], 0)} {/* Seasonal */}
              {renderTierCard(tiers[2], 1)} {/* VIP */}
              {renderTierCard(tiers[0], 2)} {/* Starter */}
            </div>
          </div>

          {/* Trust indicators below pricing */}
          <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 mt-12">
            <div className="flex flex-wrap items-center justify-center gap-6 text-luxury-charcoal/60 luxury-body text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>7-Day Money Back</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                <span>200+ Success Stories</span>
              </div>
            </div>
          </div>
        </section>

        {/* Before/After Visual Section */}
        <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="text-4xl md:text-6xl luxury-heading mb-8 text-luxury-charcoal">
                See the Transformation
              </h2>
              <p className="text-xl md:text-2xl luxury-subheading text-luxury-charcoal/70 max-w-3xl mx-auto">
                Real results from real women who transformed their style with ICONIK
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {[
                {
                  before: '/us-style-confidence-before.webp',
                  after: '/us-style-confidence-after.webp',
                  title: 'Style Confidence',
                  description: 'From feeling invisible to radiating elegance'
                },
                {
                  before: '/us-wardrobe-mastery-before.webp',
                  after: '/us-wardrobe-mastery-after.webp',
                  title: 'Wardrobe Mastery',
                  description: 'From style confusion to effortless chic'
                }
              ].map((comparison, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="group relative"
                >
                  <div className="bg-luxury-warm-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 hover:-translate-y-2">
                    <h3 className="text-3xl md:text-4xl luxury-heading text-luxury-charcoal mb-8 text-center">{comparison.title}</h3>

                    <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                      <div className="text-center">
                        <div className="luxury-body text-luxury-charcoal/60 mb-4">Before</div>
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                          <Image
                            src={comparison.before}
                            alt={`Before ${comparison.title}`}
                            width={250}
                            height={250}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="luxury-body text-luxury-charcoal/60 mb-4">After</div>
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-rose-100 to-pink-100">
                          <Image
                            src={comparison.after}
                            alt={`After ${comparison.title}`}
                            width={250}
                            height={250}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-rose-200/30 via-transparent to-transparent"></div>
                        </div>
                      </div>
                    </div>

                    <p className="text-lg md:text-xl luxury-body text-luxury-charcoal/70 text-center leading-relaxed">{comparison.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 md:py-32 px-4 bg-luxury-warm-white">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-8 md:mb-16"
            >
              <h2 className="text-4xl md:text-6xl luxury-heading mb-8 text-luxury-charcoal">
                Sound Familiar?
              </h2>
              <p className="text-xl md:text-2xl luxury-subheading text-luxury-charcoal/70 max-w-3xl mx-auto">
                Many women feel the same way. You&apos;re not alone in this journey.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {[
                {
                  icon: Users,
                  text: 'Feel underdressed compared to American colleagues, but showing too much skin feels uncomfortable?',
                  color: 'red',
                  image: '/ia-overlooked.webp',
                  imageAlt: 'Woman feeling between two worlds'
                },
                {
                  icon: Clock,
                  text: 'Lost in American stores—nothing fits right and you don\'t know which brands to trust?',
                  color: 'orange',
                  image: '/ia-postpartum.webp',
                  imageAlt: 'Shopping confusion'
                },
                {
                  icon: Heart,
                  text: 'Default to all black because it feels "safe" for the office?',
                  color: 'rose',
                  image: '/ia-corporate-challenge.webp',
                  imageAlt: 'Corporate office challenge'
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="group relative bg-luxury-cream/40 backdrop-blur-sm rounded-3xl p-6 md:p-8 lg:p-10 border border-luxury-cream hover:bg-luxury-cream/60 transition-all duration-300 hover:-translate-y-2"
                >
                  {/* Problem Image */}
                  <div className="relative w-full aspect-square mb-4 md:mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                    <Image
                      src={item.image}
                      alt={item.imageAlt}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  </div>

                  <div className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 rounded-full flex items-center justify-center ${item.color === 'red' ? 'bg-red-100' :
                    item.color === 'orange' ? 'bg-orange-100' : 'bg-rose-100'
                    }`}>
                    <item.icon className={`w-6 h-6 md:w-8 md:h-8 ${item.color === 'red' ? 'text-red-600' :
                      item.color === 'orange' ? 'text-orange-600' : 'text-rose-600'
                      }`} />
                  </div>
                  <p className="text-xl md:text-2xl luxury-heading text-luxury-charcoal text-center leading-relaxed">{item.text}</p>

                  {/* Glass shine effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 md:py-32 bg-luxury-cream/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl luxury-heading mb-4 text-luxury-charcoal">
              Frequently Asked Questions
            </h2>
            <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-base md:text-lg">
              Everything you need to know about our style packages.
            </p>
          </div>
          <div className="max-w-4xl mx-auto space-y-4 px-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="text-left p-5 md:p-6 bg-luxury-warm-white/80 backdrop-blur-sm rounded-xl border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 hover:-translate-y-1"
              >
                <h3 className="text-base md:text-lg luxury-heading mb-2 text-luxury-charcoal">{faq.question}</h3>
                <p className="luxury-body text-luxury-charcoal/80 text-sm md:text-base leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 md:py-32 px-4 bg-luxury-accent">
          <div className="max-w-4xl mx-auto text-center text-luxury-warm-white">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-6xl luxury-heading mb-8 text-luxury-warm-white">
                Ready to Discover Your Signature Style?
              </h2>
              <p className="text-xl md:text-2xl luxury-subheading mb-12 opacity-90 max-w-2xl mx-auto">
                Join 200+ women who have already transformed their confidence and discovered their elegant style
              </p>
              <div className="space-y-8">
                <Link
                  href="/monthly/checkout?tier=seasonal"
                  onClick={() => {
                    trackCTAClick('Final CTA', 'Bottom Section', 237, 'USD', 'USA_Monthly_Tiered');
                  }}
                  className="group relative inline-flex items-center justify-center bg-luxury-warm-white/95 backdrop-blur-xl text-luxury-charcoal px-12 py-5 rounded-full text-xl luxury-body hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-luxury-warm-white/30"
                >
                  <span className="relative z-10">✨ Start Your ICONIK Transformation Today</span>
                  {/* Glass shine effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-luxury-warm-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </Link>

                {/* Trust & Urgency */}
                <div className="max-w-sm mx-auto space-y-4">
                  <div className="bg-luxury-warm-white/10 backdrop-blur-xl border border-luxury-warm-white/20 rounded-2xl p-6 text-center">
                    <p className="luxury-body text-luxury-warm-white text-lg">⏰ Limited Time Pricing</p>
                    <p className="luxury-body text-luxury-warm-white/80">Save up to $240 on VIP package</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 luxury-body text-luxury-warm-white/80">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-luxury-gold rounded-full"></div>
                      <span>7-Day Money Back</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-luxury-gold rounded-full"></div>
                      <span>200+ Success Stories</span>
                    </div>
                  </div>
                </div>

                <p className="luxury-body opacity-75 text-center">Starting at $99 • One-time payment • No subscriptions</p>
              </div>
            </motion.div>
          </div>
        </section>

        <ExploreLinksSection
          eyebrow="Understand the Framework"
          title="Use the Core Pages Before Choosing a Tier"
          description="These pages explain the logic behind Iconik's recommendations, so you know whether one-time or ongoing styling support makes sense."
          groups={footerExploreGroups}
          className="bg-luxury-cream/20"
        />

        {/* Footer */}
        <footer className="py-20 bg-luxury-cream/30 border-t border-luxury-cream">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              {/* Brand */}
              <div className="md:col-span-2">
                <div className="text-3xl luxury-heading text-luxury-charcoal mb-6">ICONIK</div>
                <p className="luxury-body text-luxury-charcoal/70 mb-6 max-w-md leading-relaxed">
                  Discover your signature style, boost your confidence, and embrace your elegant, authentic self.
                </p>
                <div className="flex gap-4">
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="luxury-body text-luxury-charcoal/60 hover:text-luxury-green transition-colors"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="luxury-heading text-luxury-charcoal mb-6">Quick Links</h3>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="#features"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="#testimonials"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      Stories
                    </a>
                  </li>
                  <li>
                    <a
                      href="#pricing"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a
                      href="#faq"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal & Support */}
              <div>
                <h3 className="luxury-heading text-luxury-charcoal mb-6">Legal & Support</h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="/about"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/shipping"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      Shipping & Delivery
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/refund-policy"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      Refund Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/privacy-policy"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-luxury-cream pt-8 text-center">
              <p className="luxury-body text-luxury-charcoal/60">
                © {new Date().getFullYear()} Iconik. All rights reserved. | Personal styling with ongoing support.
              </p>
              <p className="luxury-body text-luxury-charcoal/50 text-sm mt-2">
                Business Legal Name: MITHIL NILESH NAVALAKHA
              </p>
              <p className="luxury-body text-luxury-charcoal/50 text-sm mt-1">
                Results may vary. Individual success depends on effort and commitment to the program.
              </p>
            </div>
          </div>
        </footer>

        {/* Sticky Mobile CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-luxury-warm-white/98 backdrop-blur-xl border-t border-luxury-cream p-3 md:hidden z-50">
          <div className="max-w-sm mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="luxury-body text-luxury-charcoal/70 text-xs">Style Starter</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-semibold text-luxury-green">$99</span>
                  <span className="text-luxury-charcoal/60 text-xs">one-time</span>
                </div>
              </div>
              <div className="text-right ml-2">
                <div className="luxury-body text-luxury-charcoal/60 text-xs">Expires:</div>
                <div className="luxury-body text-luxury-green text-sm font-medium">
                  {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </div>
              </div>
            </div>
            <Link
              href="/monthly/checkout?tier=starter"
              onClick={() => {
                trackCTAClick('Mobile Sticky CTA', 'Mobile Sticky', 99, 'USD', 'USA_Monthly_Tiered');
              }}
              className="w-full bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-6 py-4 text-lg rounded-full transition-all duration-300 luxury-body text-center block font-semibold shadow-lg hover:shadow-xl"
            >
              Get Started - $99
            </Link>
          </div>
        </div>
      </div>
  );
}
