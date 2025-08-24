'use client';

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
import LazyImage from '../components/LazyImage';
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
    { icon: CheckCircle, title: 'Grooming & Skincare Routine', description: 'Personalized grooming plan for your skin type' },
    { icon: Target, title: 'Style & Outfit Recommendations', description: 'Clothing that matches your body type & personality' },
    { icon: TrendingUp, title: 'Gym Plan', description: 'Custom fitness routine based on your height/weight' },
    { icon: Heart, title: 'Perfume & Accessories', description: 'Complete accessory guide to complete your look' },
    { icon: Zap, title: 'Communication & Confidence', description: 'Tips to boost your confidence around women' }
  ];

  const testimonials = [
    {
      name: 'Rahul, 26',
      story: 'Went from being invisible to getting noticed. Alpha1 changed everything.',
      image: '/skin.webp'
    },
    {
      name: 'Vikram, 28',
      story: 'My dating life completely transformed after just 2 weeks.',
      image: '/slim.webp'
    },
    {
      name: 'Arjun, 24',
      story: 'Finally got the confidence to approach women. Results were immediate.',
      image: '/stylish.webp'
    }
  ];

  const faqs = [
    {
      question: 'Will this really make me more attractive?',
      answer: 'Yes! Alpha1 focuses on your complete transformation - grooming, style, fitness, and confidence. We\'ve helped 200+ men become more attractive and confident.'
    },
    {
      question: 'What if I don\'t like the suggestions?',
      answer: 'We work 1-on-1 with you to ensure you love your new look. Your stylist will adapt recommendations to your preferences and comfort level.'
    },
    {
      question: 'How soon will I see results?',
      answer: 'Most men see immediate improvements in confidence and attention from women within the first week. Full transformation typically takes 2-3 weeks.'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden relative">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Alpha1
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
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
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
            <div className="px-4 py-4 space-y-2">
              <a href="#features" className="block text-gray-600 hover:text-gray-900 px-3 py-2 text-base font-medium">Features</a>
              <a href="#testimonials" className="block text-gray-600 hover:text-gray-900 px-3 py-2 text-base font-medium">Stories</a>
              <a href="#pricing" className="block text-gray-600 hover:text-gray-900 px-3 py-2 text-base font-medium">Pricing</a>
              <a href="#faq" className="block text-gray-600 hover:text-gray-900 px-3 py-2 text-base font-medium">FAQ</a>
              <Link
                href="/checkout"
                className="block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full text-base font-semibold text-center mt-4"
              >
                Start Now
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight">
              <span className="text-gray-900">Stop Losing Out Because of Your</span>{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Looks.</span>
            </h1>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900">
              Become the Man Women Notice.
            </h2>

            {/* Product Preview - Book Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mb-12"
            >
              <div className="text-center">
                <div className="relative w-48 h-60 mx-auto mb-4">
                  <LazyImage
                    src="/book.png"
                    alt="Alpha1 Transformation Guide Preview"
                    width={192}
                    height={240}
                    className="object-contain rounded-lg"
                  />
                </div>
                <p className="text-lg text-gray-600 max-w-md mx-auto">
                  Your complete transformation guide with personalized coaching and step-by-step instructions
                </p>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl mb-12 text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            Alpha1 is a 1-on-1 transformation program by India&apos;s top stylists — grooming, dressing, fitness, confidence.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
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
              className="group relative bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl text-white px-10 py-4 rounded-full text-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-500 flex items-center gap-3 border border-white/20"
            >
              <span className="relative z-10">Start Your Transformation</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
              {/* Glass shine effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </Link>
            
            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xl px-6 py-4 rounded-full border border-white/30 shadow-lg">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-2 border-white shadow-sm"></div>
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



          {/* Hero Transformations */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="relative max-w-6xl mx-auto"
          >
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Real Transformations in Just Weeks
              </h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                See how our personalized approach transforms ordinary men into confident, attractive individuals
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { image: '/grooming.webp', title: 'Grooming Mastery', description: 'Learn professional grooming techniques that enhance your natural features and create a polished, attractive appearance.' },
                { image: '/gym.webp', title: 'Fitness & Confidence', description: 'Build the physique and mindset that radiates confidence and attracts positive attention from everyone around you.' },
                { image: '/style.webp', title: 'Style Transformation', description: 'Discover your personal style with clothing that fits perfectly and expresses your best, most confident self.' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 + index * 0.2 }}
                  className="group relative"
                >
                  {/* Glassmorphism Card */}
                  <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl md:hover:shadow-3xl md:hover:bg-white/80 md:transition-all md:duration-300 md:hover:-translate-y-1">
                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-gray-100 to-gray-50">
                      <LazyImage
                        src={item.image}
                        alt={item.title}
                        width={400}
                        height={400}
                        className="w-full h-full object-cover md:transition-transform md:duration-300 md:hover:scale-105"
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h4>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                    
                    {/* Glass shine effect */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section - Mobile Optimized */}
      <section className="py-12 md:py-20 px-4 bg-gray-50">
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
              Many men struggle with these exact same issues. You&apos;re not alone.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {[
              { icon: Users, text: 'Tired of being ignored by women?', color: 'red' },
              { icon: Clock, text: 'Still dressing like a college kid?', color: 'orange' },
              { icon: Heart, text: 'Confidence low because of looks?', color: 'blue' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-4 md:p-8 shadow-2xl border border-white/20 md:hover:shadow-3xl md:hover:bg-white/80 md:transition-all md:duration-300 md:hover:-translate-y-1"
              >
                <div className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 rounded-full flex items-center justify-center ${
                  item.color === 'red' ? 'bg-red-100' :
                  item.color === 'orange' ? 'bg-orange-100' : 'bg-blue-100'
                }`}>
                  <item.icon className={`w-6 h-6 md:w-8 md:h-8 ${
                    item.color === 'red' ? 'text-red-600' :
                    item.color === 'orange' ? 'text-orange-600' : 'text-blue-600'
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

      {/* Features Section - Mobile Optimized */}
      <section id="features" className="py-12 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-gray-900">
              What You&apos;ll Get in Alpha1
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              A complete transformation program designed specifically for Indian men
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-4 md:p-8 shadow-2xl border border-white/20 md:hover:shadow-3xl md:hover:bg-white/80 md:hover:-translate-y-1 md:transition-all md:duration-300"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 mb-4 md:mb-6 bg-gradient-to-r from-blue-100/80 to-purple-100/80 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                  <feature.icon className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
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
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-4 md:p-8 border border-blue-200 text-center"
          >
            <div className="max-w-3xl mx-auto">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 md:w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-gray-900 leading-tight">1-on-1 with Expert Female Stylist</h3>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                Work directly with our experienced female stylists who understand what women find attractive. 
                Get personalized advice based on 5+ years of transforming Indian men.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials - Mobile Optimized */}
      <section id="testimonials" className="py-12 md:py-20 px-4 bg-gray-50">
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
              See how Alpha1 has transformed the lives of men just like you
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-4 md:p-8 shadow-2xl border border-white/20 md:hover:shadow-3xl md:hover:bg-white/80 md:hover:-translate-y-1 md:transition-all md:duration-300"
              >
                <div className="w-full aspect-square mb-4 md:mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 border border-white/30">
                  <LazyImage
                    src={testimonial.image}
                    alt={testimonial.name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover md:transition-transform md:duration-300 md:hover:scale-105"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  />
                </div>
                <blockquote className="text-gray-700 mb-4 md:mb-6 italic text-base md:text-lg leading-relaxed">
                  &ldquo;{testimonial.story}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-500/90 to-purple-500/90 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 shadow-lg">
                    <span className="text-white font-bold text-xs md:text-sm">{testimonial.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm md:text-base">{testimonial.name}</p>
                    <p className="text-xs md:text-sm text-gray-500">Alpha1 Graduate</p>
                  </div>
                </div>
                
                {/* Glass shine effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Mobile Optimized */}
      <section id="pricing" className="py-12 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-gray-900">
              Choose Your Transformation Path
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Start with our PDF guide or go all-in with personalized coaching
            </p>
          </motion.div>

          {/* Basic Plan */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden mb-8"
          >
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-4 md:p-6 text-white text-center">
              <h3 className="text-xl md:text-2xl font-bold mb-2">Basic Starter PDF</h3>
              <div className="text-3xl md:text-5xl font-bold mb-2">₹799</div>
              <p className="text-base md:text-lg opacity-90">Self-paced transformation guide</p>
            </div>
            
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-bold mb-3 text-gray-900">What&apos;s Included:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Instant Download PDF Guide</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Grooming & Skincare Routine</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Style & Outfit Recommendations</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Gym & Fitness Basics</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Communication & Confidence Hacks</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <div className="text-center">
                    <div className="text-lg mb-2">❌</div>
                    <h4 className="font-bold text-red-800 mb-2">No Personal Consultation</h4>
                    <p className="text-red-700 text-sm">Self-paced transformation only</p>
                  </div>
                </div>
                
                {/* Book Preview */}
                <div className="text-center mt-4">
                  <div className="relative w-24 h-32 mx-auto mb-3">
                    <LazyImage
                      src="/book.png"
                      alt="Alpha1 Transformation Guide Preview"
                      width={96}
                      height={128}
                      className="object-contain rounded-lg shadow-md"
                    />
                  </div>
                  <p className="text-xs text-gray-600">PDF Guide Preview</p>
                </div>
              </div>
              
              <div className="text-center">
                <Link 
                  href="/checkout" 
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.fbq) {
                      window.fbq('track', 'Lead', {
                        content_name: 'Basic Plan CTA Click',
                        content_category: 'PDF Guide',
                        value: 799,
                        currency: 'INR'
                      });
                    }
                  }}
                  className="inline-block bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-full font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-300"
                >
                  📖 Get PDF Guide
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
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 md:p-8 text-white text-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-2">Alpha1 Transformation</h3>
              <div className="text-4xl md:text-6xl font-bold mb-2">₹2,500</div>
              <p className="text-lg md:text-xl opacity-90">Advanced Full Program</p>
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
                    <div className="text-xl md:text-2xl mb-2">🎁</div>
                    <h4 className="text-base md:text-lg font-bold text-gray-900 mb-2">Special Add-on</h4>
                    <p className="text-gray-700 mb-3 text-sm md:text-base">Before & After AI Visualisation</p>
                    <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1">₹199</div>
                    <p className="text-xs md:text-sm text-orange-600 font-medium">(Limited time only)</p>
                  </div>
                </div>
                
                {/* Book Preview for Advanced Plan */}
                <div className="text-center mt-4">
                  <div className="relative w-24 h-32 mx-auto mb-3">
                    <LazyImage
                      src="/book.png"
                      alt="Alpha1 Transformation Guide + Coaching"
                      width={96}
                      height={128}
                      className="object-contain rounded-lg shadow-md"
                    />
                  </div>
                  <p className="text-xs text-gray-600">PDF Guide + 1-on-1 Session</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 md:p-6 mb-6 md:mb-8 text-center">
                <p className="text-red-700 font-semibold text-base md:text-lg">
                  ⚠️ Only 20 slots available per week
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
                        content_name: 'Pricing CTA Click',
                        content_category: 'Transformation Program',
                        value: 2500,
                        currency: 'INR'
                      });
                    }
                  }}
                  className="group relative w-full max-w-sm mx-auto bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl text-white px-8 py-4 rounded-full text-xl font-bold hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-white/20 flex items-center justify-center gap-3"
                >
                  <span className="relative z-10">🚀 Transform Now</span>
                  <ArrowRight className="w-6 h-6 relative z-10" />
                  {/* Glass shine effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </Link>
                
                {/* Mobile Urgency & Trust */}
                <div className="max-w-sm mx-auto space-y-3">
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-center">
                    <p className="text-red-700 font-semibold text-lg">⏰ Only 20 slots left this week!</p>
                    <p className="text-red-600 text-sm">Don&apos;t miss your transformation opportunity</p>
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

      {/* FAQ Section - Mobile Optimized */}
      <section id="faq" className="py-12 md:py-20 px-4 bg-gray-50">
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
              Everything you need to know about Alpha1
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

      {/* Final CTA Section - Mobile Optimized */}
      <section className="py-12 md:py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
              Ready to Transform Your Life?
            </h2>
            <p className="text-lg md:text-xl mb-6 md:mb-8 opacity-90 max-w-2xl mx-auto px-4">
              Join 200+ men who have already transformed their confidence and attractiveness
            </p>
            <div className="space-y-6">
              <Link 
                href="/checkout" 
                onClick={() => {
                  // Track final CTA click with Meta Pixel
                  if (typeof window !== 'undefined' && window.fbq) {
                    window.fbq('track', 'Lead', {
                      content_name: 'Final CTA Click',
                      content_category: 'Transformation Program',
                      value: 2299,
                      currency: 'INR'
                    });
                  }
                }}
                className="group relative w-full max-w-sm mx-auto bg-white/90 backdrop-blur-xl text-blue-600 px-8 py-4 rounded-full text-xl font-bold hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-white/30 flex items-center justify-center gap-3"
              >
                <span className="relative z-10">🚀 Start Your Alpha1 Transformation Today</span>
                {/* Glass shine effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Link>
              
              {/* Mobile Trust & Urgency */}
              <div className="max-w-sm mx-auto space-y-3">
                <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-4 text-center">
                  <p className="text-white font-semibold text-lg">⏰ Limited Time Offer</p>
                  <p className="text-white/80 text-sm">Only 20 slots available this week</p>
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
              
                              <p className="text-sm opacity-75 text-center">₹799 • Limited slots available</p>
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
                <p className="text-lg font-bold text-gray-900">₹799</p>
                <p className="text-xs text-gray-600">Complete Transformation</p>
              </div>
            </div>
            <Link 
              href="/checkout" 
              onClick={() => {
                if (typeof window !== 'undefined' && window.fbq) {
                  window.fbq('track', 'Lead', {
                    content_name: 'Mobile Sticky CTA',
                    content_category: 'Mobile Conversion',
                    value: 2299,
                    currency: 'INR'
                  });
                }
              }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-full text-lg font-bold text-center shadow-lg hover:shadow-xl transition-all duration-300"
            >
              🚀 Start Now
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white pb-24 md:pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                Alpha1
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Transform your look, boost your confidence, and become the man women notice.
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
              © 2024 PlayerNumberOne Alpha1. All rights reserved. | Transform with confidence.
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
  );
}
