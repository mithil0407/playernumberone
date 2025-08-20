'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
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
  Sparkles
} from 'lucide-react';

export default function Home() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 700 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [45, -45]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-45, 45]), springConfig);

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
      image: '/grooming.webp'
    },
    {
      name: 'Vikram, 28',
      story: 'My dating life completely transformed after just 2 weeks.',
      image: '/gym.webp'
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

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = event;
    const { innerWidth, innerHeight } = window;
    const x = (clientX - innerWidth / 2) / innerWidth;
    const y = (clientY - innerHeight / 2) / innerHeight;
    mouseX.set(x);
    mouseY.set(y);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-blue-900/20 animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/30 rounded-full"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div 
          className="relative z-10 text-center max-w-5xl mx-auto"
          onMouseMove={handleMouseMove}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent animate-shimmer"></div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
              Stop Losing Out Because of Your Looks.
              <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Become the Man Women Notice.
              </span>
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-xl md:text-2xl mb-8 text-gray-300 relative"
          >
            <span className="relative">
              Alpha1 is a 1-on-1 transformation program by India&apos;s top stylists — grooming, dressing, fitness, confidence.
              <div className="absolute inset-0 bg-blue-500/20 blur-xl animate-pulse"></div>
            </span>
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Link 
              href="/checkout" 
              className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-full text-xl font-semibold transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
            >
              <span className="relative z-10 flex items-center gap-3">
                Start Your Transformation <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </span>
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </Link>
            
            <div className="flex items-center gap-3 text-yellow-400 bg-yellow-400/10 backdrop-blur-sm px-6 py-3 rounded-full border border-yellow-400/20">
              <Star className="w-6 h-6 fill-current" />
              <span className="text-lg font-medium">Trusted by 200+ men</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Before/After Image Showcase */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold mb-16 text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
          >
            Real Transformations Possible with Alpha1
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {beforeAfterImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-sm border border-white/10 hover:border-blue-400/50 transition-all duration-500">
                  <div className="relative h-80 overflow-hidden">
                    <img
                      src={image.image}
                      alt={image.caption}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-blue-300">{image.caption}</h3>
                    <p className="text-gray-300 text-sm">{image.description}</p>
                  </div>
                  
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Emotional Pain Callout */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold mb-16 text-center bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent"
          >
            Sound Familiar?
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Users, text: 'Tired of being ignored by women?' },
              { icon: Clock, text: 'Still dressing like a college kid?' },
              { icon: Heart, text: 'Confidence low because of looks?' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="group relative"
              >
                <div className="relative p-8 rounded-2xl bg-gradient-to-br from-red-900/20 to-pink-900/20 backdrop-blur-sm border border-red-500/20 hover:border-red-400/50 transition-all duration-500 hover:transform hover:scale-105">
                  <div className="relative z-10 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 p-4 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full border border-red-400/30 group-hover:border-red-400/60 transition-all duration-500">
                      <item.icon className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-xl font-semibold text-red-300 group-hover:text-red-200 transition-colors">{item.text}</p>
                  </div>
                  
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold mb-16 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
          >
            What You&apos;ll Get in Alpha1
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="relative p-8 rounded-2xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-sm border border-blue-500/20 hover:border-blue-400/50 transition-all duration-500 hover:transform hover:scale-105">
                  <div className="relative z-10">
                    <div className="w-16 h-16 mb-6 p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full border border-blue-400/30 group-hover:border-blue-400/60 transition-all duration-500">
                      <feature.icon className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4 text-blue-300 group-hover:text-blue-200 transition-colors">{feature.title}</h3>
                    <p className="text-gray-300 group-hover:text-gray-200 transition-colors">{feature.description}</p>
                  </div>
                  
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center mt-16"
          >
            <div className="relative p-8 rounded-2xl bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-blue-500/30">
              <p className="text-xl text-blue-200 font-medium">
                <strong>Conducted 1-on-1 with a female stylist</strong> (5+ years experience in men&apos;s transformation).
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold mb-16 text-center bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent"
          >
            Real Stories, Real Results
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="group relative"
              >
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-green-900/20 to-blue-900/20 backdrop-blur-sm border border-green-500/20 hover:border-green-400/50 transition-all duration-500">
                  <div className="relative z-10">
                    <div className="w-full h-48 mb-6 rounded-xl overflow-hidden">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                    </div>
                    <p className="text-gray-300 mb-4 italic text-lg">&ldquo;{testimonial.story}&rdquo;</p>
                    <p className="text-blue-400 font-semibold text-lg">— {testimonial.name}</p>
                  </div>
                  
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Offer Section */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative p-12 rounded-3xl bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-md border border-white/20 shadow-2xl"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Limited Time Offer
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="relative p-8 rounded-2xl bg-gradient-to-br from-blue-800/30 to-purple-800/30 backdrop-blur-sm border border-blue-500/30">
                <h3 className="text-2xl font-bold text-blue-300 mb-3">Alpha1 Full Program</h3>
                <div className="text-5xl font-bold mb-3 text-white">₹2,299</div>
                <p className="text-gray-300 text-lg">Complete 1-on-1 transformation program</p>
              </div>
              
              <div className="relative p-8 rounded-2xl bg-gradient-to-br from-yellow-800/30 to-orange-800/30 backdrop-blur-sm border border-yellow-500/30">
                <h4 className="text-xl font-semibold text-yellow-400 mb-3">🎁 Special Add-on</h4>
                <p className="text-white text-lg mb-2">See your Before & After Visualisation</p>
                <div className="text-3xl font-bold text-yellow-400 mb-2">Only ₹199</div>
                <p className="text-sm text-yellow-300">(Valid today only)</p>
              </div>
            </div>
            
            <div className="text-center mb-8">
              <div className="inline-block p-4 rounded-2xl bg-gradient-to-r from-red-900/30 to-pink-900/30 backdrop-blur-sm border border-red-500/30">
                <p className="text-red-300 font-semibold text-lg">⚠️ Only 20 slots per week available</p>
              </div>
            </div>
            
            <div className="text-center">
              <Link 
                href="/checkout" 
                className="group relative inline-block overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-16 py-5 rounded-full text-2xl font-bold transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Transform Now <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
                </span>
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold mb-16 text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
          >
            Frequently Asked Questions
          </motion.h2>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="relative p-8 rounded-2xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-sm border border-blue-500/20 hover:border-blue-400/50 transition-all duration-500">
                  <div className="relative z-10">
                    <h3 className="text-xl font-semibold mb-4 text-blue-300 group-hover:text-blue-200 transition-colors">{faq.question}</h3>
                    <p className="text-gray-300 group-hover:text-gray-200 transition-colors text-lg">{faq.answer}</p>
                  </div>
                  
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Sticky Footer on Mobile */}
      <section className="py-8 px-4 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-md sticky bottom-0 z-50 border-t border-white/20">
        <div className="max-w-5xl mx-auto text-center">
          <Link 
            href="/checkout" 
            className="group relative inline-block overflow-hidden bg-white text-blue-600 px-10 py-4 rounded-full text-xl font-bold transition-all duration-500 transform hover:scale-105 shadow-2xl hover:shadow-white/50"
          >
            <span className="relative z-10 flex items-center gap-3">
              👉 Start Your Alpha1 Transformation Today (₹2,299)
            </span>
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </Link>
        </div>
      </section>
    </div>
  );
}
