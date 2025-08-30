'use client';

import Head from 'next/head';

// Facebook Pixel types
interface FacebookPixel {
  (command: 'init', pixelId: string): void;
  (command: 'track', eventName: string, parameters?: Record<string, unknown>): void;
  (command: 'trackCustom', eventName: string, parameters?: Record<string, unknown>): void;
}

declare global {
  interface Window {
    fbq: FacebookPixel;
  }
}

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import CountdownTimer from '../components/CountdownTimer';
import { 
  CheckCircle, 
  ArrowRight, 
  Clock, 
  Users,
  Heart,
  Zap,
  Target,
  TrendingUp,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    { 
      icon: CheckCircle, 
      title: 'Personal Style Assessment', 
      description: 'Discover your unique style based on body shape, lifestyle & personality',
      image: '/style-assessment.webp',
      imageAlt: 'Style assessment'
    },
    { 
      icon: Target, 
      title: 'Personalized Color Palette', 
      description: 'Colors that make your skin glow and enhance your natural beauty',
      image: '/color-palette.webp',
      imageAlt: 'Color palette'
    },
    { 
      icon: TrendingUp, 
      title: 'Wardrobe Blueprint', 
      description: 'Mix-and-match formulas for effortless, elegant looks',
      image: '/wardrobe-blueprint.webp',
      imageAlt: 'Wardrobe blueprint'
    },
    { 
      icon: Heart, 
      title: 'Beauty & Wellness Plan', 
      description: 'Confidence-building rituals for inner and outer radiance',
      image: '/beauty-wellness.webp',
      imageAlt: 'Wellness plan'
    },
    { 
      icon: Zap, 
      title: 'Expert Style Consultation', 
      description: '20-minute personalized call with our leading stylist',
      image: '/expert-consultation.webp',
      imageAlt: 'Style consultation'
    }
  ];

  const testimonials = [
    {
      name: 'Priya, 28',
      story: 'Finally discovered my signature style. I feel confident and elegant in my own skin.',
      image: '/testimonial-priya.webp'
    },
    {
      name: 'Ananya, 32',
      story: 'The color palette changed everything! People keep asking what I did differently.',
      image: '/testimonial-ananya.webp'
    },
    {
      name: 'Shreya, 26',
      story: 'Shopping is no longer overwhelming. I know exactly what works for me.',
      image: '/testimonial-shreya.webp'
    }
  ];

  const faqs = [
    {
      question: 'Will this really help me look more elegant and confident?',
      answer: 'Absolutely! IconOne focuses on your complete style transformation - personalized colors, flattering silhouettes, and confidence-building. We\'ve helped 200+ women discover their signature style.'
    },
    {
      question: 'What if the style suggestions don\'t feel like me?',
      answer: 'We work 1-on-1 with you to ensure the style feels authentically you. Your stylist will adapt all recommendations to match your personality and comfort level.'
    },
    {
      question: 'How quickly will I see results?',
      answer: 'Most women see immediate improvements in how they feel about their appearance within the first week. The complete transformation and confidence boost typically develops over 2-3 weeks.'
    }
  ];

  return (
    <>
      <Head>
        <title>IconOne - Discover Your Signature Style & Transform Your Confidence</title>
        <meta name="description" content="IconOne: Your complete style transformation program. Discover your unique style, personalized color palette, and build unshakeable confidence. Join 200+ women who transformed their lives." />
        <meta name="keywords" content="style transformation, personal style, color palette, women fashion, confidence building, style consultation, wardrobe makeover" />
        <meta property="og:title" content="IconOne - Discover Your Signature Style & Transform Your Confidence" />
        <meta property="og:description" content="IconOne: Your complete style transformation program. Discover your unique style, personalized color palette, and build unshakeable confidence." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://playernumberone.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="IconOne - Discover Your Signature Style & Transform Your Confidence" />
        <meta name="twitter:description" content="IconOne: Your complete style transformation program. Discover your unique style, personalized color palette, and build unshakeable confidence." />
        <link rel="canonical" href="https://playernumberone.com" />
      </Head>
      <div className="min-h-screen bg-white text-gray-900 overflow-hidden relative touch-manipulation">
        {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                IconOne
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#features" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">Features</a>
                <a href="#testimonials" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">Stories</a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">Pricing</a>
                <a href="#faq" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">FAQ</a>
              </div>
            </div>

            {/* CTA Button */}
            <div className="hidden md:block">
              <Link
                href="/checkout"
                className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Start Now
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-gray-900 p-2"
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
            className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200/50"
          >
            <div className="px-4 py-6 space-y-3">
              <a href="#features" className="block text-gray-600 hover:text-gray-900 px-4 py-3 text-base font-medium rounded-lg hover:bg-gray-50 transition-colors">Features</a>
              <a href="#testimonials" className="block text-gray-600 hover:text-gray-900 px-4 py-3 text-base font-medium rounded-lg hover:bg-gray-50 transition-colors">Stories</a>
              <a href="#pricing" className="block text-gray-600 hover:text-gray-900 px-4 py-3 text-base font-medium rounded-lg hover:bg-gray-50 transition-colors">Pricing</a>
              <a href="#faq" className="block text-gray-600 hover:text-gray-900 px-4 py-3 text-base font-medium rounded-lg hover:bg-gray-50 transition-colors">FAQ</a>
              <Link
                href="/checkout"
                className="block bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-4 rounded-full text-base font-semibold text-center mt-6 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Now
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-20 md:pt-24 pb-16 md:pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 lg:mb-8 leading-tight tracking-tight px-2">
              <span className="text-gray-900">Stop Feeling Invisible. Start Feeling</span>{' '}
              <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Irresistible.</span>
            </h1>
            
            {/* Product Preview - Book Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mb-12"
            >
              <div className="text-center">
                <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto mb-6">
                  <Image
                    src="/book.png"
                    alt="IconOne Style Guide Preview"
                    width={320}
                    height={320}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl mb-12 text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            IconOne is a personalized style transformation program by India&apos;s leading stylists — elegance, confidence, and authentic self-expression.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center mb-12 md:mb-16"
          >
            <Link 
              href="/checkout" 
              onClick={() => {
                // Track CTA click with Meta Pixel
                if (typeof window !== 'undefined' && window.fbq) {
                  window.fbq('track', 'Lead', {
                    content_name: 'Hero CTA Click',
                    content_category: 'Transformation Program'
                  });
                }
              }}
              className="group relative bg-gradient-to-r from-rose-500/90 to-pink-500/90 backdrop-blur-xl text-white px-8 md:px-10 py-4 md:py-4 rounded-full text-base md:text-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-500 flex items-center gap-3 border border-white/20 w-full sm:w-auto justify-center"
            >
              <span className="relative z-10">Start Your Transformation</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
              {/* Glass shine effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </Link>
            
            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xl px-6 py-4 rounded-full border border-white/30 shadow-lg">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full border-2 border-white shadow-sm"></div>
                ))}
              </div>
              <span className="text-gray-700 font-medium">200+ transformations</span>
            </div>
          </motion.div>

          {/* Countdown Timer for Urgency */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-8"
          >
            <CountdownTimer 
              endTime={new Date(Date.now() + 5 * 60 * 1000)} // 5 minutes from now
              className="w-full max-w-md mx-auto"
            />
          </motion.div>
        </div>
      </section>

      {/* Hero Transformations - Moved Right Below Hero */}
      <section className="py-12 md:py-20 lg:py-24 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-center mb-12 md:mb-16"
          >
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
              Real Style Transformations in Just Weeks
            </h3>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              See how our personalized approach helps women discover their signature style and radiate confidence
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {[
                { image: '/style-discovery.webp', title: 'Personal Style Discovery', description: 'Discover your unique style signature with colors, silhouettes, and pieces that make you feel authentically beautiful.' },
                { image: '/beauty-routine.webp', title: 'Elegant Beauty Routine', description: 'Master the art of effortless elegance with personalized beauty and grooming techniques that enhance your natural glow.' },
                { image: '/wellness-confidence.webp', title: 'Confidence & Wellness', description: 'Build inner and outer strength with wellness plans designed for busy women who want to feel radiant and energized.' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 + index * 0.2 }}
                  className="group relative"
                >
                  {/* Glassmorphism Card */}
                  <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-4 md:p-6 border border-white/30 shadow-2xl md:hover:shadow-3xl md:hover:bg-white/90 md:transition-all md:duration-300 md:hover:-translate-y-2">
                                      <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-4 md:mb-6 bg-gradient-to-br from-gray-100 to-gray-50">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover md:transition-transform md:duration-300 md:hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                  </div>
                    <h4 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">{item.title}</h4>
                    <p className="text-gray-600 leading-relaxed text-sm md:text-base">{item.description}</p>
                    
                    {/* Glass shine effect */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      </section>

      {/* Visual Stats Section - Added for More Visual Appeal */}
      <section className="py-8 md:py-12 lg:py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 lg:gap-8">
            {[
              { number: '200+', label: 'Women Transformed', icon: '✨', color: 'from-rose-400 to-pink-400' },
              { number: '95%', label: 'Confidence Boost', icon: '💪', color: 'from-purple-400 to-indigo-400' },
              { number: '4.9★', label: 'Customer Rating', icon: '⭐', color: 'from-yellow-400 to-orange-400' },
              { number: '2-3', label: 'Weeks to Results', icon: '🚀', color: 'from-green-400 to-teal-400' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center group"
              >
                <div className={`w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 md:mb-4 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center text-2xl md:text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon}
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">{stat.number}</div>
                <div className="text-sm md:text-base text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section - Mobile Optimized */}
      <section className="py-8 md:py-16 lg:py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-gray-900">
              Sound Familiar?
            </h2>
                          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                Many women feel the same way. You&apos;re not alone in this journey.
              </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {[
              { 
                icon: Users, 
                text: 'Feel overlooked or invisible in social settings?', 
                color: 'red',
                image: '/feeling-overlooked.webp',
                imageAlt: 'Woman feeling overlooked'
              },
              { 
                icon: Clock, 
                text: 'Confused about what styles actually suit you?', 
                color: 'orange',
                image: '/style-confusion.webp',
                imageAlt: 'Style confusion'
              },
              { 
                icon: Heart, 
                text: 'Lost confidence in your appearance?', 
                color: 'rose',
                image: '/confidence-issues.webp',
                imageAlt: 'Confidence building'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-4 md:p-6 lg:p-8 shadow-2xl border border-white/20 md:hover:shadow-3xl md:hover:bg-white/80 md:transition-all md:duration-300 md:hover:-translate-y-1"
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
                
                <div className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 rounded-full flex items-center justify-center ${
                  item.color === 'red' ? 'bg-red-100' :
                  item.color === 'orange' ? 'bg-orange-100' : 'bg-rose-100'
                }`}>
                  <item.icon className={`w-6 h-6 md:w-8 md:h-8 ${
                    item.color === 'red' ? 'text-red-600' :
                    item.color === 'orange' ? 'text-orange-600' : 'text-rose-600'
                  }`} />
                </div>
                <p className="text-lg md:text-xl font-semibold text-gray-900 text-center leading-tight">{item.text}</p>
                
                {/* Glass shine effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Visual Section - Added for More Visual Impact */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-gray-900">
              See the Transformation
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Real results from real women who transformed their style with IconOne
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {[
              {
                before: '/style-before.webp',
                after: '/style-after.webp',
                title: 'Style Confidence',
                description: 'From feeling invisible to radiating elegance'
              },
              {
                before: '/wardrobe-before.webp',
                after: '/wardrobe-after.webp',
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
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 md:p-6 border border-white/30 shadow-2xl">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 text-center">{comparison.title}</h3>
                  
                  <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                    <div className="text-center">
                      <div className="text-sm md:text-base font-semibold text-gray-600 mb-2">Before</div>
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
                      <div className="text-sm md:text-base font-semibold text-gray-600 mb-2">After</div>
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
                  
                  <p className="text-sm md:text-base text-gray-600 text-center leading-relaxed">{comparison.description}</p>
                  
                  {/* Glass shine effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Mobile Optimized */}
      <section id="features" className="py-8 md:py-16 lg:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-gray-900">
              What You&apos;ll Get in IconOne
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              A complete style transformation program designed specifically for Indian women
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-8 md:mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-4 md:p-8 shadow-2xl border border-white/20 md:hover:shadow-3xl md:hover:bg-white/80 md:hover:-translate-y-1 md:transition-all md:duration-300"
              >
                {/* Feature Image */}
                <div className="relative w-full aspect-square mb-4 md:mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                  <Image
                    src={feature.image}
                    alt={feature.imageAlt}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover md:transition-transform md:duration-300 md:hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-transparent"></div>
                </div>
                
                <div className="w-12 h-12 md:w-16 md:h-16 mb-4 md:mb-6 bg-gradient-to-r from-rose-100/80 to-pink-100/80 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                  <feature.icon className="w-6 h-6 md:w-8 md:h-8 text-rose-600" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-gray-900 leading-tight">{feature.title}</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">{feature.description}</p>
                
                {/* Glass shine effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-3xl p-4 md:p-8 border border-rose-200 text-center"
          >
            <div className="max-w-3xl mx-auto">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 md:w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-gray-900 leading-tight">1-on-1 with Expert Style Consultant</h3>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                Work directly with our experienced style consultants who understand the unique beauty of Indian women. 
                Get personalized advice based on 5+ years of transforming women&apos;s confidence through style.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials - Mobile Optimized */}
      <section id="testimonials" className="py-8 md:py-16 lg:py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-gray-900">
              Real Stories, Real Results
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              See how IconOne has transformed the confidence of women just like you
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-4 md:p-8 shadow-2xl border border-white/20 md:hover:shadow-3xl md:hover:bg-white/80 md:hover:-translate-y-1 md:transition-all md:duration-300"
              >
                <div className="w-full aspect-square mb-4 md:mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 border border-white/30">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover md:transition-transform md:duration-300 md:hover:scale-105"
                  />
                </div>
                <blockquote className="text-gray-700 mb-4 md:mb-6 italic text-base md:text-lg leading-relaxed">
                  &ldquo;{testimonial.story}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-rose-500/90 to-pink-500/90 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 shadow-lg">
                    <span className="text-white font-bold text-xs md:text-sm">{testimonial.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm md:text-base">{testimonial.name}</p>
                    <p className="text-xs md:text-sm text-gray-500">IconOne Graduate</p>
                  </div>
                </div>
                
                {/* Glass shine effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Process Section - Added for More Visual Appeal */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-gray-900">
              Your Transformation Journey
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Simple steps to unlock your signature style and confidence
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {[
              {
                step: '01',
                title: 'Style Assessment',
                description: 'Complete your personalized style questionnaire',
                image: '/step1-assessment.webp',
                imageAlt: 'Style assessment'
              },
              {
                step: '02',
                title: 'Expert Consultation',
                description: '20-minute call with our style consultant',
                image: '/step2-consultation.webp',
                imageAlt: 'Expert consultation'
              },
              {
                step: '03',
                title: 'Personalized Plan',
                description: 'Get your custom style transformation roadmap',
                image: '/step3-plan.webp',
                imageAlt: 'Personalized plan'
              },
              {
                step: '04',
                title: 'Transform & Shine',
                description: 'Apply your new style and feel confident',
                image: '/step4-results.webp',
                imageAlt: 'Transform and shine'
              }
            ].map((process, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="group relative text-center"
              >
                <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-4 md:p-6 border border-white/30 shadow-2xl md:hover:shadow-3xl md:hover:bg-white/90 md:transition-all md:duration-300 md:hover:-translate-y-2">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 md:w-12 md:h-12 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-lg">
                    {process.step}
                  </div>
                  
                  {/* Process Image */}
                  <div className="relative w-full aspect-square mt-4 md:mt-6 mb-4 md:mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                    <Image
                      src={process.image}
                      alt={process.imageAlt}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-gray-900 leading-tight">{process.title}</h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">{process.description}</p>
                  
                  {/* Glass shine effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                
                {/* Connection Line (except for last item) */}
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-rose-200 to-pink-200 transform -translate-y-1/2 z-0"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Mobile Optimized */}
      <section id="pricing" className="py-8 md:py-16 lg:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-gray-900">
              Choose Your Style Transformation
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Your IconOne Style Transformation Package
            </p>
          </motion.div>

          {/* Main Product */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden mb-8"
          >
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-4 md:p-6 text-white text-center">
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-2">IconOne Style Consultation</h3>
              <div className="text-2xl md:text-3xl lg:text-5xl font-bold mb-2">₹999</div>
              <p className="text-sm md:text-base lg:text-lg opacity-90">Complete personal style transformation</p>
            </div>
            
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-bold mb-3 text-gray-900">What&apos;s Included:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Complete style assessment tailored to your features</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Personalized color palette that makes your skin glow</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Body-flattering silhouettes that work with your shape</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Hair & beauty advice for your unique features</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">20-minute one-on-one call with expert stylist</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
                  <div className="text-center">
                    <div className="text-lg mb-2">✨</div>
                    <h4 className="font-bold text-rose-800 mb-2">Personal Touch</h4>
                    <p className="text-rose-700 text-sm">Tailored specifically for you</p>
                  </div>
                </div>
                
                {/* Book Preview */}
                <div className="text-center mt-4">
                  <div className="relative w-24 h-32 mx-auto mb-3">
                    <Image
                      src="/book.png"
                      alt="IconOne Style Guide Preview"
                      width={96}
                      height={128}
                      className="object-contain rounded-lg shadow-md"
                    />
                  </div>
                  <p className="text-xs text-gray-600">Style Guide Preview</p>
                </div>
              </div>
              
              <div className="text-center">
                <Link 
                  href="/checkout" 
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.fbq) {
                      window.fbq('track', 'Lead', {
                        content_name: 'Style Consultation CTA Click',
                        content_category: 'Style Consultation',
                        value: 999,
                        currency: 'INR'
                      });
                    }
                  }}
                  className="inline-block bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:from-rose-600 hover:to-pink-600 transition-all duration-300"
                >
                  ✨ Get Your Style Consultation
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Advanced Plan */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-4 md:p-8 text-white text-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-2">Complete IconOne Package</h3>
              <div className="text-4xl md:text-6xl font-bold mb-2">₹2,197</div>
              <p className="text-lg md:text-xl opacity-90">Style + Shopping + Wellness Bundle</p>
            </div>
            
            <div className="p-4 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8">
                <div>
                  <h4 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-gray-900">What&apos;s Included:</h4>
                  <ul className="space-y-2 md:space-y-3">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 text-sm md:text-base">{feature.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 md:p-6 border border-yellow-200">
                  <div className="text-center">
                    <div className="text-xl md:text-2xl mb-2">💰</div>
                    <h4 className="text-base md:text-lg font-bold text-gray-900 mb-2">Bundle Savings</h4>
                    <p className="text-gray-700 mb-3 text-sm md:text-base">Individual Price: ₹2,197</p>
                    <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1">Save ₹800</div>
                    <p className="text-xs md:text-sm text-orange-600 font-medium">(Limited time bundle)</p>
                  </div>
                </div>
                
                {/* Book Preview for Advanced Plan */}
                <div className="text-center mt-4">
                  <div className="relative w-24 h-32 mx-auto mb-3">
                    <Image
                      src="/book.png"
                      alt="IconOne Complete Package"
                      width={96}
                      height={128}
                      className="object-contain rounded-lg shadow-md"
                    />
                  </div>
                  <p className="text-xs text-gray-600">Complete Style Package</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 md:p-6 mb-6 md:mb-8 text-center">
                <p className="text-red-700 font-semibold text-base md:text-lg">
                  ⚠️ Only 15 slots available this week
                </p>
              </div>
              
              <div className="text-center space-y-4">
                {/* Mobile-Optimized CTA */}
                <Link 
                  href="/checkout" 
                  onClick={() => {
                    // Track pricing CTA click with Meta Pixel
                    if (typeof window !== 'undefined' && window.fbq) {
                      window.fbq('track', 'Lead', {
                        content_name: 'Complete Package CTA Click',
                        content_category: 'Style Transformation Package',
                        value: 2197,
                        currency: 'INR'
                      });
                    }
                  }}
                  className="group relative w-full max-w-sm mx-auto bg-gradient-to-r from-rose-500/90 to-pink-500/90 backdrop-blur-xl text-white px-8 py-4 rounded-full text-xl font-bold hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-white/20 flex items-center justify-center gap-3"
                >
                  <span className="relative z-10">✨ Transform Now</span>
                  <ArrowRight className="w-6 h-6 relative z-10" />
                  {/* Glass shine effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </Link>
                
                {/* Mobile Urgency & Trust */}
                <div className="max-w-sm mx-auto space-y-3">
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-center">
                    <p className="text-red-700 font-semibold text-lg">⏰ Only 15 slots left this week!</p>
                    <p className="text-red-600 text-sm">Don&apos;t miss your style transformation opportunity</p>
                  </div>
                  
                                     <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                       <span>7-Day Money Back</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                       <span>200+ Success Stories</span>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Visual Gallery Section - Added for More Visual Impact */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-gray-900">
              Style Inspiration Gallery
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Discover the endless possibilities of your personal style transformation
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            {[
              { image: '/gallery-style1.webp', alt: 'Elegant style transformation' },
              { image: '/gallery-beauty1.webp', alt: 'Beauty and grooming' },
              { image: '/gallery-natural.webp', alt: 'Natural beauty enhancement' },
              { image: '/gallery-sophisticated.webp', alt: 'Sophisticated style' },
              { image: '/gallery-wellness.webp', alt: 'Confidence and wellness' },
              { image: '/gallery-confidence.webp', alt: 'Body confidence' },
              { image: '/gallery-care.webp', alt: 'Personal care' },
              { image: '/gallery-discovery.webp', alt: 'Style discovery' }
            ].map((gallery, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <Image
                  src={gallery.image}
                  alt={gallery.alt}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Hover overlay with style tip */}
                <div className="absolute inset-0 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/90 backdrop-blur-sm rounded-t-2xl p-3 mb-2 text-center">
                    <p className="text-xs md:text-sm font-semibold text-gray-800">Style Tip #{index + 1}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center mt-8 md:mt-12"
          >
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Each image represents a different aspect of your style journey. 
              From color analysis to wardrobe building, discover what makes you uniquely beautiful.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section - Mobile Optimized */}
      <section id="faq" className="py-8 md:py-16 lg:py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Everything you need to know about IconOne
            </p>
          </motion.div>
          
          <div className="space-y-4 md:space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-4 md:p-8 shadow-2xl border border-white/20 md:hover:shadow-3xl md:hover:bg-white/80 md:transition-all md:duration-300"
              >
                <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-gray-900 leading-tight">{faq.question}</h3>
                <p className="text-gray-600 text-sm md:text-lg leading-relaxed">{faq.answer}</p>
                
                {/* Glass shine effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Trust Section - Added for More Visual Impact */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-gray-900">
              Why Women Trust IconOne
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Real results, real women, real transformations
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {[
              {
                image: '/trust-results.webp',
                title: 'Proven Results',
                description: '200+ women have transformed their style and confidence',
                stats: '95% Success Rate'
              },
              {
                image: '/trust-expert.webp',
                title: 'Expert Guidance',
                description: 'Certified stylists with 5+ years of experience',
                stats: '5-Star Rating'
              },
              {
                image: '/trust-personalized.webp',
                title: 'Personalized Approach',
                description: 'Every transformation is unique to your style goals',
                stats: '100% Custom'
              }
            ].map((trust, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="group relative text-center"
              >
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 md:p-6 border border-white/30 shadow-2xl md:hover:shadow-3xl md:hover:bg-white/90 md:transition-all md:duration-300 md:hover:-translate-y-2">
                  {/* Trust Image */}
                  <div className="relative w-full aspect-square mb-4 md:mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                    <Image
                      src={trust.image}
                      alt={trust.title}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-transparent"></div>
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-gray-900 leading-tight">{trust.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base mb-3 md:mb-4">{trust.description}</p>
                  
                  {/* Stats Badge */}
                  <div className="inline-block bg-gradient-to-r from-rose-100 to-pink-100 px-3 py-2 rounded-full">
                    <span className="text-sm md:text-base font-semibold text-rose-700">{trust.stats}</span>
                  </div>
                  
                  {/* Glass shine effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section - Mobile Optimized */}
      <section className="py-8 md:py-16 lg:py-20 px-4 bg-gradient-to-r from-rose-500 to-pink-500">
        <div className="max-w-4xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
              Ready to Discover Your Signature Style?
            </h2>
            <p className="text-lg md:text-xl mb-6 md:mb-8 opacity-90 max-w-2xl mx-auto px-4">
              Join 200+ women who have already transformed their confidence and discovered their elegant style
            </p>
            <div className="space-y-6">
              <Link 
                href="/checkout" 
                onClick={() => {
                  // Track final CTA click with Meta Pixel
                  if (typeof window !== 'undefined' && window.fbq) {
                    window.fbq('track', 'Lead', {
                      content_name: 'Final CTA Click',
                      content_category: 'Style Transformation Program',
                      value: 999,
                      currency: 'INR'
                    });
                  }
                }}
                className="group relative w-full max-w-sm mx-auto bg-white/90 backdrop-blur-xl text-rose-600 px-8 py-4 rounded-full text-xl font-bold hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-white/30 flex items-center justify-center gap-3"
              >
                <span className="relative z-10">✨ Start Your IconOne Transformation Today</span>
                {/* Glass shine effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Link>
              
              {/* Mobile Trust & Urgency */}
              <div className="max-w-sm mx-auto space-y-3">
                <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-4 text-center">
                  <p className="text-white font-semibold text-lg">⏰ Limited Time Offer</p>
                  <p className="text-white/80 text-sm">Only 15 slots available this week</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-white/80">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span>7-Day Money Back</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span>200+ Success Stories</span>
                  </div>
                </div>
              </div>
              
                              <p className="text-sm opacity-75 text-center">₹999 • Limited slots available</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mobile Sticky CTA - High Conversion */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-2xl">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="text-center">
                <p className="text-sm text-red-600 font-semibold mb-1">⏰ Limited Time Offer</p>
                <p className="text-lg font-bold text-gray-900">₹999</p>
                <p className="text-xs text-gray-600">Style Transformation</p>
              </div>
            </div>
            <Link 
              href="/checkout" 
              onClick={() => {
                if (typeof window !== 'undefined' && window.fbq) {
                  window.fbq('track', 'Lead', {
                    content_name: 'Mobile Sticky CTA',
                    content_category: 'Mobile Conversion',
                    value: 999,
                    currency: 'INR'
                  });
                }
              }}
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 md:px-6 py-4 rounded-full text-base md:text-lg font-bold text-center shadow-lg hover:shadow-xl transition-all duration-300 min-h-[48px] flex items-center justify-center"
            >
              ✨ Start Now
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-24 right-4 md:right-6 z-50 md:hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <Link
            href="/checkout"
            onClick={() => {
              // Track mobile FAB click with Meta Pixel
              if (typeof window !== 'undefined' && window.fbq) {
                window.fbq('track', 'Lead', {
                  content_name: 'Mobile FAB Click',
                  content_category: 'Style Transformation Program'
                });
              }
            }}
            className="group relative bg-gradient-to-r from-rose-500 to-pink-500 text-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center justify-center touch-manipulation"
          >
            <ArrowRight className="w-6 h-6 md:w-8 md:h-8 group-hover:rotate-45 transition-transform duration-300" />
            {/* Pulse animation */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-400 to-pink-400 animate-ping opacity-20"></div>
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white pb-24 md:pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent mb-4">
                IconOne
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Discover your signature style, boost your confidence, and embrace your elegant, authentic self.
              </p>
              <div className="flex gap-4">
                <a href="mailto:support@playernumberone.com" className="text-gray-400 hover:text-white transition-colors">
                  support@playernumberone.com
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
                </li>
                <li>
                  <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">Stories</a>
                </li>
                <li>
                  <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
                </li>
                <li>
                  <a href="#faq" className="text-gray-400 hover:text-white transition-colors">FAQ</a>
                </li>
              </ul>
            </div>

            {/* Legal & Support */}
            <div>
              <h3 className="text-white font-semibold mb-4">Legal & Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link>
                </li>
                <li>
                  <Link href="/shipping" className="text-gray-400 hover:text-white transition-colors">Shipping & Delivery</Link>
                </li>
                <li>
                  <Link href="/refund-policy" className="text-gray-400 hover:text-white transition-colors">Refund Policy</Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2024 PlayerNumberOne IconOne. All rights reserved. | Transform with elegance.
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Business Legal Name: MITHIL NILESH NAVALAKHA
            </p>
            <p className="text-gray-600 text-xs mt-1">
              Results may vary. Individual success depends on effort and commitment to the program.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
