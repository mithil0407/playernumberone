'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  CheckCircle, 
  Star, 
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

  const beforeAfterImages = [
    { 
      image: '/grooming.webp', 
      caption: 'Grooming & Style Transformation',
      description: 'From basic grooming to premium styling'
    },
    { 
      image: '/gym.webp', 
      caption: 'Fitness & Confidence Boost',
      description: 'Transform your body and mindset'
    },
    { 
      image: '/skin.webp', 
      caption: 'Skin Care & Grooming',
      description: 'Clear, healthy skin transformation'
    },
    { 
      image: '/stylish.webp', 
      caption: 'Outfit & Accessories Makeover',
      description: 'Complete style transformation'
    },
    { 
      image: '/slim.webp', 
      caption: 'Body Type Styling',
      description: 'Dress for your body type'
    },
    { 
      image: '/style.webp', 
      caption: 'Professional Look Transformation',
      description: 'From casual to professional'
    }
  ];

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
      image: '/style.webp'
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
              className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-3"
            >
              Start Your Transformation 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <div className="flex items-center gap-3 bg-gray-50 px-6 py-4 rounded-full border border-gray-200">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-2 border-white"></div>
                ))}
              </div>
              <span className="text-gray-700 font-medium">200+ transformations</span>
            </div>
          </motion.div>

          {/* Hero Image Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="relative max-w-5xl mx-auto"
          >
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 border border-gray-200 shadow-2xl">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {beforeAfterImages.slice(0, 6).map((image, index) => (
                  <div key={index} className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-lg">
                    <img
                      src={image.image}
                      alt={image.caption}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Sound Familiar?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Many men struggle with these exact same issues. You&apos;re not alone.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
                  item.color === 'red' ? 'bg-red-100' :
                  item.color === 'orange' ? 'bg-orange-100' : 'bg-blue-100'
                }`}>
                  <item.icon className={`w-8 h-8 ${
                    item.color === 'red' ? 'text-red-600' :
                    item.color === 'orange' ? 'text-orange-600' : 'text-blue-600'
                  }`} />
                </div>
                <p className="text-xl font-semibold text-gray-900 text-center">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              What You&apos;ll Get in Alpha1
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A complete transformation program designed specifically for Indian men
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              >
                <div className="w-16 h-16 mb-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 border border-blue-200 text-center"
          >
            <div className="max-w-3xl mx-auto">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">1-on-1 with Expert Female Stylist</h3>
              <p className="text-lg text-gray-700">
                Work directly with our experienced female stylists who understand what women find attractive. 
                Get personalized advice based on 5+ years of transforming Indian men.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Real Stories, Real Results
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how Alpha1 has transformed the lives of men just like you
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              >
                <div className="w-full h-48 mb-6 rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <blockquote className="text-gray-700 mb-6 italic text-lg leading-relaxed">
                  &ldquo;{testimonial.story}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{testimonial.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">Alpha1 Graduate</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Limited Time Offer
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transform your life with our comprehensive 1-on-1 program
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white text-center">
              <h3 className="text-3xl font-bold mb-2">Alpha1 Full Program</h3>
              <div className="text-6xl font-bold mb-2">₹2,299</div>
              <p className="text-xl opacity-90">Complete 1-on-1 transformation</p>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-xl font-bold mb-4 text-gray-900">What&apos;s Included:</h4>
                  <ul className="space-y-3">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🎁</div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Special Add-on</h4>
                    <p className="text-gray-700 mb-3">Before & After AI Visualisation</p>
                    <div className="text-3xl font-bold text-orange-600 mb-1">₹199</div>
                    <p className="text-sm text-orange-600 font-medium">(Limited time only)</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 text-center">
                <p className="text-red-700 font-semibold text-lg">
                  ⚠️ Only 20 slots available per week
                </p>
              </div>
              
              <div className="text-center">
                <Link 
                  href="/checkout" 
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-full text-xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Transform Now <ArrowRight className="w-6 h-6" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about Alpha1
            </p>
          </motion.div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
              >
                <h3 className="text-xl font-bold mb-4 text-gray-900">{faq.question}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Life?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join 200+ men who have already transformed their confidence and attractiveness
            </p>
            <Link 
              href="/checkout" 
              className="inline-flex items-center gap-3 bg-white text-blue-600 px-12 py-4 rounded-full text-xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Start Your Alpha1 Transformation Today
            </Link>
            <p className="mt-4 text-sm opacity-75">₹2,299 • Limited slots available</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Alpha1
            </div>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Transform your look, boost your confidence, and become the man women notice.
            </p>
            <div className="border-t border-gray-800 pt-8">
              <p className="text-gray-500 text-sm">
                © 2024 Alpha1. All rights reserved. | Transform with confidence.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
