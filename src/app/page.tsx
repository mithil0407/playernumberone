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
  TrendingUp
} from 'lucide-react';

export default function Home() {

  
  const beforeAfterImages = [
    { before: '/before1.jpg', after: '/after1.jpg', caption: 'Grooming & Style Transformation' },
    { before: '/before2.jpg', after: '/after2.jpg', caption: 'Fitness & Confidence Boost' },
    { before: '/before3.jpg', after: '/after3.jpg', caption: 'Outfit & Accessories Makeover' },
    { before: '/before4.jpg', after: '/after4.jpg', caption: 'Skin Care & Grooming' },
    { before: '/before5.jpg', after: '/after5.jpg', caption: 'Body Type Styling' },
    { before: '/before6.jpg', after: '/after6.jpg', caption: 'Professional Look Transformation' }
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
      before: '/testimonial1-before.jpg',
      after: '/testimonial1-after.jpg'
    },
    {
      name: 'Vikram, 28',
      story: 'My dating life completely transformed after just 2 weeks.',
      before: '/testimonial2-before.jpg',
      after: '/testimonial2-after.jpg'
    },
    {
      name: 'Arjun, 24',
      story: 'Finally got the confidence to approach women. Results were immediate.',
      before: '/testimonial3-before.jpg',
      after: '/testimonial3-after.jpg'
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
          >
            Stop Losing Out Because of Your Looks.
            <span className="block text-blue-400">Become the Man Women Notice.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl mb-8 text-gray-300"
          >
            Alpha1 is a 1-on-1 transformation program by India&apos;s top stylists — grooming, dressing, fitness, confidence.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/checkout" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold flex items-center gap-2 transition-all duration-300 transform hover:scale-105">
              Start Your Transformation <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2 text-yellow-400">
              <Star className="w-5 h-5 fill-current" />
              <span className="text-sm">Trusted by 200+ men</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Before/After Slider */}
      <section className="py-20 px-4 bg-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-4xl font-bold mb-12"
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
                className="bg-gray-700 rounded-lg p-6 hover:transform hover:scale-105 transition-all duration-300"
              >
                <div className="relative h-64 bg-gray-600 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-gray-400">Before/After Image {index + 1}</span>
                </div>
                <p className="text-gray-300">{image.caption}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Emotional Pain Callout */}
      <section className="py-20 px-4 bg-red-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-4xl font-bold mb-12 text-red-400"
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
                className="bg-red-900/30 rounded-lg p-6 border border-red-500/30"
              >
                <item.icon className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-xl font-semibold text-red-300">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-4xl font-bold mb-12 text-center"
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
                className="bg-gray-700 rounded-lg p-6 hover:transform hover:scale-105 transition-all duration-300"
              >
                <feature.icon className="w-12 h-12 text-blue-400 mb-4" />
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center mt-12 p-6 bg-blue-900/30 rounded-lg border border-blue-500/30"
          >
            <p className="text-lg text-blue-300">
              <strong>Conducted 1-on-1 with a female stylist</strong> (5+ years experience in men&apos;s transformation).
            </p>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-4xl font-bold mb-12 text-center"
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
                className="bg-gray-800 rounded-lg p-6 border border-gray-600"
              >
                <div className="flex gap-4 mb-4">
                  <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Before</span>
                  </div>
                  <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-gray-400 text-xs">After</span>
                  </div>
                </div>
                <p className="text-gray-300 mb-4 italic">&ldquo;{testimonial.story}&rdquo;</p>
                <p className="text-blue-400 font-semibold">— {testimonial.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Offer Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-900 to-purple-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Limited Time Offer</h2>
            
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-bold text-blue-400 mb-2">Alpha1 Full Program</h3>
              <div className="text-4xl font-bold mb-2">₹2,299</div>
              <p className="text-gray-300 mb-4">Complete 1-on-1 transformation program</p>
            </div>
            
            <div className="bg-yellow-900/30 rounded-lg p-4 mb-6 border border-yellow-500/30">
              <h4 className="text-lg font-semibold text-yellow-400 mb-2">🎁 Special Add-on</h4>
              <p className="text-white">See your Before & After Visualisation</p>
              <div className="text-2xl font-bold text-yellow-400">Only ₹199</div>
              <p className="text-sm text-yellow-300">(Valid today only)</p>
            </div>
            
            <div className="bg-red-900/30 rounded-lg p-4 mb-8 border border-red-500/30">
              <p className="text-red-300 font-semibold">⚠️ Only 20 slots per week available</p>
            </div>
            
            <Link href="/checkout" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 rounded-lg text-xl font-bold flex items-center gap-3 mx-auto transition-all duration-300 transform hover:scale-105">
              Transform Now <ArrowRight className="w-6 h-6" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-4xl font-bold mb-12 text-center"
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
                className="bg-gray-700 rounded-lg p-6"
              >
                <h3 className="text-xl font-semibold mb-3 text-blue-400">{faq.question}</h3>
                <p className="text-gray-300">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Sticky Footer on Mobile */}
      <section className="py-8 px-4 bg-gradient-to-r from-blue-600 to-purple-600 sticky bottom-0 z-50">
        <div className="max-w-4xl mx-auto text-center">
          <Link href="/checkout" className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-bold flex items-center gap-3 mx-auto transition-all duration-300 transform hover:scale-105 shadow-lg">
            👉 Start Your Alpha1 Transformation Today (₹2,299)
          </Link>
        </div>
      </section>
    </div>
  );
}
