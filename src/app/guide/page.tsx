'use client';

import Head from 'next/head';
import { trackCTAClick } from '@/lib/metaPixel';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Clock, 
  Users,
  Heart,
  Zap,
  Target,
  TrendingUp,
  Menu,
  X,
  Star,
  Sparkles,
  Gem,
  Shield,
  Trophy,
  Award
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

export default function GuidePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    minutes: 5,
    seconds: 0
  });

  // Transformation images data
  const transformationImages = useMemo(() => [
    {
      src: '/transformation-1.webp',
      testimonial: 'Finally found my signature style! I feel confident every day.',
      name: 'Shreya, Mumbai'
    },
    {
      src: '/transformation-2.webp',
      testimonial: 'The color palette changed everything. I get compliments daily!',
      name: 'Kavya, Delhi'
    },
    {
      src: '/transformation-3.webp',
      testimonial: 'Shopping is no longer overwhelming. I know exactly what works for me.',
      name: 'Priya, Bangalore'
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
          // Reset to 5 minutes when timer reaches 0
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
      question: 'Will this guide really help me look more elegant and confident?',
      answer: 'Absolutely! ICONIK focuses on your complete style transformation - personalized colors, flattering silhouettes, and confidence-building. We\'ve helped 200+ women discover their signature style through our comprehensive digital guide.'
    },
    {
      question: 'What if the style suggestions don\'t feel like me?',
      answer: 'The guide is designed to help you find your authentic style. It provides frameworks and tools that you can adapt to match your personality and comfort level, ensuring everything feels genuinely you.'
    },
    {
      question: 'How quickly will I see results?',
      answer: 'Most women see immediate improvements in how they feel about their appearance within the first week of implementing the guide. The complete transformation and confidence boost typically develops over 2-3 weeks.'
    }
  ];

  const bonuses = [
    {
      title: 'Posing & Confidence Guide',
      value: '₹1,500',
      description: 'Learn how to pose and move in front of the camera like a natural. Perfect for photos, reels, or your first fashion shoot.'
    },
    {
      title: 'Shopping Masterlist',
      value: '₹2,000',
      description: 'Every essential piece to build your Iconik wardrobe — on a real Indian budget.'
    }
  ];

  return (
    <>
      <Head>
        <title>ICONIK - Your Personal Styling Transformation Guide for Indian Women</title>
        <meta name="description" content="Transform your style with ICONIK - the ultimate styling guide for Indian women. Learn body shape analysis, color palettes, and confident styling techniques." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
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
              <a href="#pricing" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-green transition-colors">Investment</a>
              <a href="#faq" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-green transition-colors">FAQ</a>
              <Link
                href="/guide/checkout"
                className="bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-8 py-3 rounded-full transition-all duration-300 luxury-body"
              >
                Get Guide
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
              <a href="#pricing" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-green px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">Investment</a>
              <a href="#faq" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-green px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">FAQ</a>
              <Link
                href="/guide/checkout"
                className="block bg-luxury-accent text-luxury-warm-white px-8 py-4 rounded-full luxury-body text-center mt-6 transition-all duration-300"
              >
                Get Guide
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
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-7xl lg:text-8xl luxury-heading text-luxury-charcoal mb-4 md:mb-6 leading-[0.9] tracking-tight"
            >
              From Ordinary to Iconic
              <br />
              <span className="text-luxury-green">Start Your Style Revolution</span>
            </motion.h1>
            
            {/* Testimonial Slideshow Above the Fold */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="max-w-4xl mx-auto mb-4 md:mb-6"
            >
              <div className="bg-luxury-cream/50 backdrop-blur-sm rounded-3xl p-4 md:p-6 border border-luxury-cream">
                <div className="text-center mb-4">
                  <h3 className="text-xl md:text-2xl luxury-heading text-luxury-charcoal mb-1">
                    Real Results from Real Women
                  </h3>
                  <p className="luxury-body text-luxury-charcoal/70 text-base md:text-lg">
                    See the transformations our clients have achieved
                  </p>
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
                      className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                        index === currentImageIndex ? 'bg-luxury-accent' : 'bg-luxury-accent/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
          >
              <Link 
              href="/guide/checkout" 
              onClick={() => {
                // Track CTA click with Meta Pixel
                trackCTAClick('Begin Your Transformation', 'Hero Section');
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
      <section className="py-20 md:py-32 bg-luxury-cream/30">
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
      <section id="features" className="py-20 md:py-32 bg-luxury-warm-white relative">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-16 md:mb-24">
          <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">What You'll Receive</h2>
          <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
            A complete step-by-step digital style guide that helps you define your personal style, discover what flatters your body, and build a wardrobe that radiates confidence.
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 mb-16">
          <div className="bg-luxury-cream/40 backdrop-blur-sm rounded-3xl border border-luxury-cream p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl luxury-heading mb-8 text-luxury-charcoal text-center">
              Inside the ICONIK Guide:
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: "Body Shape Discovery", description: "Learn silhouettes that flatter your figure" },
                { title: "Face Shape & Color Palette", description: "Discover shades that make your skin glow" },
                { title: "Wardrobe Foundation", description: "Essential pieces for every Indian woman" },
                { title: "Style Archetype Quiz", description: "Find your true fashion personality" },
                { title: "Mix & Match System", description: "30+ outfit ideas using 10 smart pieces" },
                { title: "Occasion Styling", description: "Office, festive, date-night & daily looks" },
                { title: "Accessories & Footwear Guide", description: "Finish every outfit perfectly" },
                { title: "Confidence Blueprint", description: "Tips on posture, posing & presence" },
                { title: "Smart Shopping System", description: "Build a wardrobe that saves time and money" }
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-luxury-green flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="luxury-heading text-luxury-charcoal mb-2">{item.title}</h4>
                    <p className="luxury-body text-luxury-charcoal/80">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <p className="text-xl luxury-body text-luxury-charcoal/80">
                💡 Everything you need to master your personal style — in one guide.
              </p>
            </div>
          </div>
        </div>

        {/* Fast Action Bonuses */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="bg-luxury-pink-bg/50 backdrop-blur-sm rounded-3xl border border-luxury-cream p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl luxury-heading mb-8 text-luxury-charcoal text-center">
              💎 Fast Action Bonuses (Worth ₹3,500 — FREE Today)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-luxury-warm-white/80 rounded-2xl p-6">
                <h4 className="text-xl luxury-heading text-luxury-charcoal mb-3">
                  🎁 Posing & Confidence Guide (₹1,500 Value)
                </h4>
                <p className="luxury-body text-luxury-charcoal/80">
                  Learn how to pose and move in front of the camera like a natural. Perfect for photos, reels, or your first fashion shoot.
                </p>
              </div>
              
              <div className="bg-luxury-warm-white/80 rounded-2xl p-6">
                <h4 className="text-xl luxury-heading text-luxury-charcoal mb-3">
                  🎁 Smart Shopping Masterlist (₹2,000 Value)
                </h4>
                <p className="luxury-body text-luxury-charcoal/80">
                  Every essential piece to build your Iconik wardrobe — on a real Indian budget.
                </p>
              </div>
            </div>
            
            <div className="text-center mt-6">
              <p className="text-lg luxury-body text-luxury-charcoal/80">
                ✨ Free with your guide for a limited time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Book Image Card */}
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
                  alt="IconOne Style Guide Preview"
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



      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 bg-luxury-warm-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-16 md:mb-24">
          <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">Investment</h2>
          <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
            Select a package that aligns with your journey to elegance.
          </p>
        </div>

        {/* Main Product */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 mb-12 md:mb-16">
          <div className="bg-luxury-cream/40 backdrop-blur-sm rounded-3xl border border-luxury-cream hover:bg-luxury-cream/60 transition-all duration-300 overflow-hidden hover:-translate-y-2">
            <div className="p-8 md:p-12 lg:p-16">
              <div className="text-center mb-12">
                <h3 className="text-3xl md:text-4xl lg:text-5xl luxury-heading mb-6 text-luxury-charcoal">
                  ICONIK Style Guide
                </h3>
                <div className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 text-luxury-green">₹499 + GST</div>
                <p className="text-xl md:text-2xl luxury-subheading text-luxury-charcoal/70">
                  Complete personal style transformation guide
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                <div>
                  <h4 className="text-2xl luxury-heading mb-8 text-luxury-charcoal">What&apos;s Included:</h4>
                  <ul className="space-y-6">
                    <li className="flex items-start gap-4">
                      <CheckCircle className="w-6 h-6 text-luxury-green flex-shrink-0 mt-1" />
                      <span className="luxury-body text-luxury-charcoal/80 text-lg">
                        Complete Digital Style Guide
                      </span>
                    </li>
                    <li className="flex items-start gap-4">
                      <CheckCircle className="w-6 h-6 text-luxury-green flex-shrink-0 mt-1" />
                      <span className="luxury-body text-luxury-charcoal/80 text-lg">
                        Body Shape & Color Analysis
                      </span>
                    </li>
                    <li className="flex items-start gap-4">
                      <CheckCircle className="w-6 h-6 text-luxury-green flex-shrink-0 mt-1" />
                      <span className="luxury-body text-luxury-charcoal/80 text-lg">
                        Wardrobe Foundation System
                      </span>
                    </li>
                    <li className="flex items-start gap-4">
                      <CheckCircle className="w-6 h-6 text-luxury-green flex-shrink-0 mt-1" />
                      <span className="luxury-body text-luxury-charcoal/80 text-lg">
                        Style Archetype Assessment
                      </span>
                    </li>
                    <li className="flex items-start gap-4">
                      <CheckCircle className="w-6 h-6 text-luxury-green flex-shrink-0 mt-1" />
                      <span className="luxury-body text-luxury-charcoal/80 text-lg">
                        30+ Outfit Combinations Guide
                      </span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-luxury-pink-bg border border-luxury-accent/20 rounded-2xl p-8 text-center">
                  <div className="text-4xl mb-6">✨</div>
                  <h4 className="text-2xl luxury-heading text-luxury-charcoal mb-4">Personal Touch</h4>
                  <p className="luxury-body text-luxury-charcoal/70 text-lg">Tailored specifically for you</p>
                </div>
              </div>
              
              <div className="text-center">
                <Link
                  href="/guide/checkout"
                  onClick={() => {
                    trackCTAClick('Style Guide', 'Pricing Section', 499);
                  }}
                  className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-16 py-5 rounded-full text-xl luxury-body hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  ✨ Get Your Style Guide
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Fast Action Bonuses */}
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="bg-luxury-cream/40 backdrop-blur-sm rounded-3xl border border-luxury-cream hover:bg-luxury-cream/60 transition-all duration-300 overflow-hidden hover:-translate-y-2">
            <div className="p-8 md:p-12">
              <div className="text-center mb-8">
                <h3 className="text-3xl md:text-4xl luxury-heading mb-4 text-luxury-charcoal">
                  Fast Action Bonuses
                </h3>
                <div className="text-3xl md:text-4xl font-semibold mb-4 text-luxury-green">FREE</div>
                <p className="text-xl md:text-2xl luxury-subheading text-luxury-charcoal/70">
                  Limited Time Bonuses
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                <div>
                  <h4 className="text-2xl luxury-heading mb-8 text-luxury-charcoal">Bonus Items:</h4>
                  <ul className="space-y-6">
                    {bonuses.map((bonus, index) => (
                      <li key={index} className="flex items-start gap-4">
                        <CheckCircle className="w-6 h-6 text-luxury-green flex-shrink-0 mt-1" />
                        <div>
                          <span className="luxury-body text-luxury-charcoal/80 text-lg">{bonus.title}</span>
                          <div className="text-sm text-luxury-charcoal/60">({bonus.value} Value)</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-luxury-pink-bg border border-luxury-accent/20 rounded-2xl p-8 text-center">
                  <div className="text-4xl mb-6">💰</div>
                  <h4 className="text-2xl luxury-heading text-luxury-charcoal mb-4">Bonus Value</h4>
                  <p className="luxury-body text-luxury-charcoal/70 mb-3 text-lg">Total Bonus Value: ₹3,500</p>
                  <div className="text-2xl font-semibold text-luxury-green mb-2">FREE Today</div>
                  <p className="luxury-body text-luxury-green text-sm">Limited time offer</p>
                </div>
              </div>
              
              <div className="bg-luxury-red/10 border border-luxury-red/20 rounded-2xl p-6 mb-8 text-center">
                <p className="luxury-body text-luxury-red-700 text-lg">⚠️ Only 15 slots available this week</p>
              </div>
              
              <div className="text-center">
                <Link
                  href="/guide/checkout"
                  onClick={() => {
                    trackCTAClick('Complete Package', 'Pricing Section', 499);
                  }}
                  className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-16 py-5 rounded-full text-xl luxury-body hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  ✨ Transform Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-32 bg-luxury-cream/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center mb-16 md:mb-24">
          <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">
            Frequently Asked Questions
          </h2>
          <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
            Everything you need to know about our styling guide.
          </p>
        </div>
        <div className="max-w-4xl mx-auto space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="text-left p-8 md:p-10 bg-luxury-warm-white/80 backdrop-blur-sm rounded-2xl border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 hover:-translate-y-1"
            >
              <h3 className="text-xl md:text-2xl luxury-heading mb-4 text-luxury-charcoal">{faq.question}</h3>
              <p className="luxury-body text-luxury-charcoal/80 text-lg leading-relaxed">{faq.answer}</p>
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
                href="/guide/checkout"
                onClick={() => {
                  // Track final CTA click with Meta Pixel
                  trackCTAClick('Final CTA', 'Bottom Section', 499);
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
                  <p className="luxury-body text-luxury-warm-white text-lg">⏰ Limited Time Offer</p>
                  <p className="luxury-body text-luxury-warm-white/80">Only 15 slots available this week</p>
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

              <p className="luxury-body opacity-75 text-center">₹499 + GST • Limited slots available</p>
            </div>
          </motion.div>
        </div>
      </section>

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
                  href="mailto:support@playernumberone.com"
                  className="luxury-body text-luxury-charcoal/60 hover:text-luxury-green transition-colors"
                >
                  support@playernumberone.com
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
              © 2024 PlayerNumberOne ICONIK. All rights reserved. | Transform with elegance.
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
              <div className="luxury-body text-luxury-charcoal/70 text-xs">Complete Guide</div>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-semibold text-luxury-green">₹499 + GST</span>
                <span className="line-through text-luxury-charcoal/40 text-xs">₹25,000</span>
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
            href="/guide/checkout"
            onClick={() => {
              // Track CTA click with Meta Pixel
              trackCTAClick('Mobile Sticky CTA', 'Mobile Sticky', 499);
            }}
            className="w-full bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-6 py-4 text-lg rounded-full transition-all duration-300 luxury-body text-center block font-semibold shadow-lg hover:shadow-xl"
          >
            Get Your Guide Now
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}
