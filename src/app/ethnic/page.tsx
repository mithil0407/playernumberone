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
  X,
  Star,
  Sparkles,
  Crown,
  Gem,
  Shield,
  Trophy,
  Award,
  Flower2,
  Star as StarIcon,
  Sparkle
} from 'lucide-react';
import { useState } from 'react';

export default function EthnicPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const ethnicFeatures = [
    { 
      icon: Flower2, 
      title: 'Wedding Collection', 
      description: 'Bridal lehengas, sarees & traditional jewelry',
      color: 'amber'
    },
    { 
      icon: StarIcon, 
      title: 'Festival Wear', 
      description: 'Navratri, Diwali & cultural celebration outfits',
      color: 'orange'
    },
    { 
      icon: Gem, 
      title: 'Office Ethnic', 
      description: 'Professional kurtas, sarees & formal ethnic wear',
      color: 'amber'
    },
    { 
      icon: Heart, 
      title: 'Casual Ethnic', 
      description: 'Daily wear kurtas, palazzos & comfortable ethnic',
      color: 'orange'
    }
  ];

  const ethnicGarments = [
    'Sarees (Silk, Cotton, Georgette)',
    'Lehengas (A-line, Circular, Mermaid)',
    'Kurtas (Long, Short, Anarkali)',
    'Salwar Suits (Churidar, Patiala, Straight)',
    'Palazzos & Palazzo Sets',
    'Ethnic Dresses & Gowns'
  ];

  const ethnicAccessories = [
    'Traditional Jewelry Sets',
    'Ethnic Footwear (Juttis, Mojris)',
    'Handbags & Potli Bags',
    'Dupattas & Stoles',
    'Hair Accessories',
    'Bangles & Bracelets'
  ];

  const ethnicTestimonials = [
    {
      name: 'Meera, 29',
      story: 'My wedding look was absolutely stunning! The lehenga selection was perfect for my body type.',
      image: '/testimonial-meera.webp'
    },
    {
      name: 'Kavya, 31',
      story: 'Finally found ethnic wear that makes me feel confident at every festival and celebration.',
      image: '/testimonial-kavya.webp'
    },
    {
      name: 'Riya, 27',
      story: 'The office ethnic collection helped me maintain my cultural identity while looking professional.',
      image: '/testimonial-riya.webp'
    }
  ];

  const faqs = [
    {
      question: 'Will this help me find the perfect ethnic wear for my body type?',
      answer: 'Absolutely! Our Ethnic Elegance Package focuses on traditional Indian wear that flatters your body shape, skin tone, and personal style. We consider regional preferences and cultural significance.'
    },
    {
      question: 'Do you cover all Indian ethnic wear categories?',
      answer: 'Yes! We cover wedding wear, festival outfits, office ethnic, casual ethnic, and include detailed recommendations for sarees, lehengas, kurtas, salwar suits, plus accessories and footwear.'
    },
    {
      question: 'How quickly will I receive my ethnic style guide?',
      answer: 'You\'ll receive your personalized ethnic style guide within 3-5 days after your consultation call. The guide includes specific outfit recommendations, styling tips, and shopping links.'
    }
  ];

  return (
    <>
      <Head>
        <title>Ethnic Elegance Package - Embrace Your Cultural Elegance | IconOne</title>
        <meta name="description" content="Ethnic Elegance Package: Discover your perfect traditional Indian wear. 14 ethnic outfits with accessories, footwear & styling guide. Pan-Indian recommendations." />
        <meta name="keywords" content="ethnic wear, traditional indian wear, sarees, lehengas, kurtas, ethnic fashion, cultural elegance, indian fashion" />
        <meta property="og:title" content="Ethnic Elegance Package - Embrace Your Cultural Elegance" />
        <meta property="og:description" content="Ethnic Elegance Package: Discover your perfect traditional Indian wear with personalized recommendations." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://playernumberone.com/ethnic" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Ethnic Elegance Package - Embrace Your Cultural Elegance" />
        <meta name="twitter:description" content="Ethnic Elegance Package: Discover your perfect traditional Indian wear with personalized recommendations." />
        <link rel="canonical" href="https://playernumberone.com/ethnic" />
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-cream-50 to-orange-50 font-['Playfair Display',serif] text-gray-900 scroll-smooth overflow-x-hidden pb-20 md:pb-0">
        {/* Navigation */}
        <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-amber-100 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-md">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <span className="text-3xl font-light tracking-wide text-gray-900 font-['Bebas Neue',sans-serif]">Icon<span className="font-semibold text-amber-600">One</span></span>
              </div>
              <div className="hidden md:flex items-center space-x-10 font-['Inter',sans-serif]">
                <a href="#features" className="text-gray-700 hover:text-amber-600 transition-colors font-light tracking-wide">Features</a>
                <a href="#testimonials" className="text-gray-700 hover:text-amber-600 transition-colors font-light tracking-wide">Stories</a>
                <a href="#pricing" className="text-gray-700 hover:text-amber-600 transition-colors font-light tracking-wide">Investment</a>
                <a href="#faq" className="text-gray-700 hover:text-amber-600 transition-colors font-light tracking-wide">FAQ</a>
                <Link
                  href="/ethnic/checkout"
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-light tracking-wide"
                >
                  Begin Journey
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
              className="md:hidden bg-white/95 backdrop-blur-xl border-t border-amber-100"
            >
              <div className="px-6 py-6 space-y-4">
                <a href="#features" className="block text-gray-700 hover:text-amber-600 px-4 py-3 text-base font-light tracking-wide rounded-lg hover:bg-amber-50 transition-colors">Features</a>
                <a href="#testimonials" className="block text-gray-700 hover:text-amber-600 px-4 py-3 text-base font-light tracking-wide rounded-lg hover:bg-amber-50 transition-colors">Stories</a>
                <a href="#pricing" className="block text-gray-700 hover:text-amber-600 px-4 py-3 text-base font-light tracking-wide rounded-lg hover:bg-amber-50 transition-colors">Investment</a>
                <a href="#faq" className="block text-gray-700 hover:text-amber-600 px-4 py-3 text-base font-light tracking-wide rounded-lg hover:bg-amber-50 transition-colors">FAQ</a>
                <Link
                  href="/ethnic/checkout"
                  className="block bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-4 rounded-full text-base font-light tracking-wide text-center mt-6 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Begin Journey
                </Link>
              </div>
            </motion.div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="pt-20 md:pt-40 pb-16 md:pb-32 px-4 md:px-6 lg:px-8 relative overflow-hidden" id="hero">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl md:text-6xl lg:text-8xl font-light text-gray-900 mb-6 md:mb-8 leading-tight tracking-tight font-['Playfair Display',serif]"
              >
                Embrace Your
                <br />
                <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent font-semibold">Cultural Elegance</span>
                <br />
                <span className="text-2xl md:text-4xl lg:text-5xl font-light text-gray-600 font-['Cormorant Garamond',serif]">Traditional Indian Wear</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-lg md:text-xl text-gray-600 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed font-light font-['Inter',sans-serif] px-4"
              >
                Discover your perfect ethnic wardrobe with 14 curated traditional outfits, 
                accessories, and footwear recommendations tailored to your cultural heritage.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Link 
                  href="/ethnic/checkout" 
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.fbq) {
                      window.fbq('track', 'Lead', {
                        content_name: 'Ethnic Hero CTA Click',
                        content_category: 'Ethnic Elegance Package'
                      });
                    }
                  }}
                  className="inline-block bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 md:px-12 py-4 md:py-6 text-base md:text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 font-light tracking-wide"
                >
                  Discover Your Ethnic Style <ArrowRight className="ml-3 h-5 w-5 inline" />
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Elegant Stats */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-white to-amber-50">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 mb-12 md:mb-20">
              <div className="text-center group">
                <div className="text-3xl md:text-5xl font-light text-amber-600 mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300">150+</div>
                <div className="text-sm md:text-base text-gray-600 font-light tracking-wide font-['Inter',sans-serif]">Ethnic Transformations</div>
              </div>
              <div className="text-center group">
                <div className="text-3xl md:text-5xl font-light text-amber-600 mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300">14</div>
                <div className="text-sm md:text-base text-gray-600 font-light tracking-wide font-['Inter',sans-serif]">Curated Outfits</div>
              </div>
              <div className="text-center group">
                <div className="flex items-center justify-center mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl md:text-5xl font-light text-amber-600">4.8</span>
                  <Star className="h-5 w-5 md:h-7 md:w-7 text-amber-400 fill-current ml-1 md:ml-2" />
                </div>
                <div className="text-sm md:text-base text-gray-600 font-light tracking-wide font-['Inter',sans-serif]">Client Satisfaction</div>
              </div>
              <div className="text-center group">
                <div className="text-3xl md:text-5xl font-light text-amber-600 mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300">Pan</div>
                <div className="text-sm md:text-base text-gray-600 font-light tracking-wide font-['Inter',sans-serif]">Indian Coverage</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-light mb-4 md:mb-6 font-['Playfair Display',serif]">Ethnic Categories</h2>
            <p className="text-gray-600 font-light max-w-3xl mx-auto font-['Inter',sans-serif] text-base md:text-lg px-4">Traditional Indian wear curated for every occasion and celebration.</p>
          </div>
                
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            {ethnicFeatures.map((feature, i) => (
              <div key={i} className="p-6 md:p-8 shadow-lg border-amber-100 hover:shadow-xl transition-shadow duration-300 bg-white rounded-2xl hover:-translate-y-1 transition-transform duration-300">
                <div className="flex flex-col items-center space-y-3 md:space-y-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    feature.color === 'amber' ? 'bg-amber-100' : 'bg-orange-100'
                  }`}>
                    <feature.icon className={`h-8 w-8 ${
                      feature.color === 'amber' ? 'text-amber-600' : 'text-orange-600'
                    }`} />
                  </div>
                  <h3 className="text-lg md:text-xl font-light font-['Cormorant Garamond',serif] text-center">{feature.title}</h3>
                  <p className="text-sm text-gray-600 text-center font-light font-['Inter',sans-serif]">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Garments & Accessories */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-amber-50 to-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border-amber-100">
                <h3 className="text-2xl font-light mb-6 text-gray-900 font-['Cormorant Garamond',serif] text-center">Traditional Garments</h3>
                <ul className="space-y-3">
                  {ethnicGarments.map((garment, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 font-light font-['Inter',sans-serif]">{garment}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border-amber-100">
                <h3 className="text-2xl font-light mb-6 text-gray-900 font-['Cormorant Garamond',serif] text-center">Accessories & Footwear</h3>
                <ul className="space-y-3">
                  {ethnicAccessories.map((accessory, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 font-light font-['Inter',sans-serif]">{accessory}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-16 md:py-24 bg-gradient-to-b from-white to-amber-50">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-light mb-4 md:mb-6 font-['Playfair Display',serif]">Client Stories</h2>
            <p className="text-gray-600 font-light max-w-3xl mx-auto font-['Inter',sans-serif] text-base md:text-lg px-4">Hear from women who embraced their cultural elegance with IconOne.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-12 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            {ethnicTestimonials.map((testimonial, index) => (
              <div key={index} className="p-6 md:p-8 shadow-lg border-amber-100 hover:shadow-xl transition-shadow duration-300 bg-white rounded-2xl hover:-translate-y-1 transition-transform duration-300">
                <div className="space-y-3 md:space-y-4">
                  <div className="aspect-square bg-gradient-to-br from-amber-100 via-white to-orange-100 flex items-center justify-center rounded-lg overflow-hidden">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <p className="text-gray-700 font-light font-['Inter',sans-serif] text-center text-sm md:text-base">&ldquo;{testimonial.story}&rdquo;</p>
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">{testimonial.name}</p>
                    <div className="flex justify-center gap-1">
                      <Star className="h-4 w-4 md:h-5 md:w-5 text-amber-400 fill-current" />
                      <Star className="h-4 w-4 md:h-5 md:w-5 text-amber-400 fill-current" />
                      <Star className="h-4 w-4 md:h-5 md:w-5 text-amber-400 fill-current" />
                      <Star className="h-4 w-4 md:h-5 md:w-5 text-amber-400 fill-current" />
                      <Star className="h-4 w-4 md:h-5 md:w-5 text-amber-400 fill-current" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
              <h2 className="text-5xl font-light mb-6 font-['Playfair Display',serif] text-gray-900">
                See the Ethnic Transformation
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                Real results from real women who embraced their cultural elegance with IconOne
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {[
                {
                  before: '/ethnic-cultural-before.webp',
                  after: '/ethnic-cultural-after.webp',
                  title: 'Cultural Elegance',
                  description: 'From everyday wear to cultural celebrations'
                },
                {
                  before: '/ethnic-festive-before.webp',
                  after: '/ethnic-festive-after.webp',
                  title: 'Festive Glamour',
                  description: 'From simple to stunning festival looks'
                },
                {
                  before: '/ethnic-traditional-before.webp',
                  after: '/ethnic-traditional-after.webp',
                  title: 'Traditional Grace',
                  description: 'From casual to ceremonial elegance'
                }
              ].map((comparison, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="group relative"
                >
                  <div className="bg-white rounded-2xl shadow-lg border-amber-100 p-6 md:p-8 hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1 transition-transform duration-300">
                    <h3 className="text-2xl md:text-3xl font-light text-gray-900 mb-6 md:mb-8 text-center font-['Playfair Display',serif]">{comparison.title}</h3>
                    
                    <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                      <div className="text-center">
                        <div className="text-sm md:text-base font-light text-gray-600 mb-3 font-['Inter',sans-serif]">Before</div>
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
                        <div className="text-sm md:text-base font-light text-gray-600 mb-3 font-['Inter',sans-serif]">After</div>
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100">
                          <Image
                            src={comparison.after}
                            alt={`After ${comparison.title}`}
                            width={250}
                            height={250}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-amber-200/30 via-transparent to-transparent"></div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-base md:text-lg text-gray-600 text-center leading-relaxed font-light font-['Inter',sans-serif]">{comparison.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-light mb-4 md:mb-6 font-['Playfair Display',serif]">Investment</h2>
            <p className="text-gray-600 font-light max-w-3xl mx-auto font-['Inter',sans-serif] text-base md:text-lg px-4">Your journey to ethnic elegance starts here.</p>
          </div>

          {/* Main Product */}
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 mb-8 md:mb-12">
            <div className="bg-white rounded-2xl shadow-lg border-amber-100 hover:shadow-xl transition-shadow duration-300 overflow-hidden hover:-translate-y-1 transition-transform duration-300">
              <div className="p-6 md:p-8 lg:p-12">
                <div className="text-center mb-6 md:mb-8">
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-light mb-3 md:mb-4 font-['Playfair Display',serif] text-gray-900">Ethnic Elegance Package</h3>
                  <div className="text-4xl md:text-5xl lg:text-6xl font-light mb-3 md:mb-4 font-['Cormorant Garamond',serif] bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">₹1,999</div>
                  <p className="text-base md:text-lg lg:text-xl font-light text-gray-600 font-['Inter',sans-serif]">Complete ethnic wardrobe transformation</p>
                </div>
                
                <div className="max-w-4xl mx-auto">
                  <h4 className="text-xl font-light mb-6 text-gray-900 font-['Cormorant Garamond',serif] text-center">What&apos;s Included:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-light font-['Inter',sans-serif]">14 curated ethnic outfits across all categories</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-light font-['Inter',sans-serif]">Complete accessories & footwear guide</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-light font-['Inter',sans-serif]">Pan-Indian regional style recommendations</span>
                      </li>
                    </ul>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-light font-['Inter',sans-serif]">Personalized styling for your body type</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-light font-['Inter',sans-serif]">20-minute consultation with ethnic wear expert</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-light font-['Inter',sans-serif]">Lifetime access to your ethnic style profile</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-8 text-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">🌸</span>
                      </div>
                      <h4 className="text-xl font-light text-gray-900 font-['Cormorant Garamond',serif]">Cultural Heritage</h4>
                    </div>
                    <p className="text-gray-600 font-light font-['Inter',sans-serif]">Honoring traditions while embracing modern elegance</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <Link 
                    href="/ethnic/checkout" 
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.fbq) {
                        window.fbq('track', 'Lead', {
                          content_name: 'Ethnic Elegance Package CTA Click',
                          content_category: 'Ethnic Elegance Package',
                          value: 1999,
                          currency: 'INR'
                        });
                      }
                    }}
                    className="inline-block bg-gradient-to-r from-amber-500 to-orange-600 text-white px-12 py-4 rounded-full text-lg font-light hover:shadow-xl transition-all duration-300 font-['Inter',sans-serif]"
                  >
                    🌸 Get Your Ethnic Style Guide
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 bg-gradient-to-b from-amber-50 to-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center mb-16">
            <h2 className="text-5xl font-light mb-6 font-['Playfair Display',serif]">Frequently Asked Questions</h2>
            <p className="text-gray-600 font-light max-w-3xl mx-auto font-['Inter',sans-serif]">Everything you need to know about our ethnic elegance package.</p>
          </div>
          <div className="max-w-4xl mx-auto space-y-8">
            {faqs.map((faq, index) => (
              <div key={index} className="text-left p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-amber-100 hover:-translate-y-1 transition-transform duration-300">
                <h3 className="text-xl font-light mb-3 font-['Cormorant Garamond',serif] text-gray-900">{faq.question}</h3>
                <p className="text-gray-600 font-light font-['Inter',sans-serif]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-8 md:py-16 lg:py-20 px-4 bg-gradient-to-r from-amber-500 to-orange-600">
          <div className="max-w-4xl mx-auto text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-5xl font-light mb-6 font-['Playfair Display',serif]">
                Ready to Embrace Your Cultural Elegance?
              </h2>
              <p className="text-lg md:text-xl mb-6 md:mb-8 opacity-90 max-w-2xl mx-auto px-4 font-light font-['Inter',sans-serif]">
                Join 150+ women who have discovered their perfect ethnic style with IconOne
              </p>
              <div className="space-y-6">
                <Link 
                  href="/ethnic/checkout" 
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.fbq) {
                      window.fbq('track', 'Lead', {
                        content_name: 'Final Ethnic CTA Click',
                        content_category: 'Ethnic Elegance Package',
                        value: 1999,
                        currency: 'INR'
                      });
                    }
                  }}
                  className="group relative w-full max-w-sm mx-auto bg-white/90 backdrop-blur-xl text-amber-600 px-8 py-4 rounded-full text-xl font-light hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-white/30 flex items-center justify-center gap-3 font-['Inter',sans-serif]"
                >
                  <span className="relative z-10">🌸 Start Your Ethnic Transformation Today</span>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </Link>
                
                <div className="max-w-sm mx-auto space-y-3">
                  <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-4 text-center">
                    <p className="text-white font-light text-lg font-['Inter',sans-serif]">⏰ Limited Time Offer</p>
                    <p className="text-white/80 text-sm font-light font-['Inter',sans-serif]">Only 15 slots available this week</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-white/80 font-light font-['Inter',sans-serif]">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span>7-Day Money Back</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span>150+ Success Stories</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm opacity-75 text-center">₹1,999 + GST • Limited slots available</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 bg-gradient-to-b from-white to-amber-50 border-t border-amber-100">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="md:col-span-2">
                <div className="text-3xl font-light bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent mb-4 font-['Bebas Neue',sans-serif]">
                  IconOne
                </div>
                <p className="text-gray-400 mb-4 max-w-md">
                  Embrace your cultural elegance with traditional Indian wear that celebrates your heritage.
                </p>
                <div className="flex gap-4">
                  <a href="mailto:support@playernumberone.com" className="text-gray-400 hover:text-amber-600 transition-colors">
                    support@playernumberone.com
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#features" className="text-gray-400 hover:text-amber-600 transition-colors">Features</a>
                  </li>
                  <li>
                    <a href="#testimonials" className="text-gray-400 hover:text-amber-600 transition-colors">Stories</a>
                  </li>
                  <li>
                    <a href="#pricing" className="text-gray-400 hover:text-amber-600 transition-colors">Pricing</a>
                  </li>
                  <li>
                    <a href="#faq" className="text-gray-400 hover:text-amber-600 transition-colors">FAQ</a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-4">Legal & Support</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/about" className="text-gray-400 hover:text-amber-600 transition-colors">About Us</Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-gray-400 hover:text-amber-600 transition-colors">Contact Us</Link>
                  </li>
                  <li>
                    <Link href="/shipping" className="text-gray-400 hover:text-amber-600 transition-colors">Shipping & Delivery</Link>
                  </li>
                  <li>
                    <Link href="/refund-policy" className="text-gray-400 hover:text-amber-600 transition-colors">Refund Policy</Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-gray-400 hover:text-amber-600 transition-colors">Terms of Service</Link>
                  </li>
                  <li>
                    <Link href="/privacy-policy" className="text-gray-400 hover:text-amber-600 transition-colors">Privacy Policy</Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-8 text-center">
              <p className="text-gray-500 text-sm">
                © 2024 PlayerNumberOne IconOne. All rights reserved. | Embrace cultural elegance.
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

        {/* Sticky Mobile CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-amber-100 p-4 md:hidden z-50">
          <div className="max-w-sm mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-light text-gray-600 font-['Inter',sans-serif]">Ethnic Elegance Package</div>
                <div className="text-xl font-light text-gray-900 font-['Cormorant Garamond',serif]">₹1,999</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-light text-gray-500 font-['Inter',sans-serif]">Limited Time</div>
                <div className="text-sm font-light text-amber-600 font-['Cormorant Garamond',serif]">15 slots left</div>
              </div>
            </div>
            <Link
              href="/ethnic/checkout"
              onClick={() => {
                if (typeof window !== 'undefined' && window.fbq) {
                  window.fbq('track', 'Lead', {
                    content_name: 'Mobile Ethnic CTA Click',
                    content_category: 'Ethnic Elegance Package'
                  });
                }
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-3 text-base rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-light tracking-wide text-center block font-['Inter',sans-serif]"
            >
              Begin Your Ethnic Journey
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
