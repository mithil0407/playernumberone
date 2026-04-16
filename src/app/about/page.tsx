'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, User, Mail, MapPin, Briefcase } from 'lucide-react';
import { trackPageView } from '@/lib/metaPixel';

export default function AboutPage() {
  // Track page view on mount
  useEffect(() => {
    trackPageView();
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Iconik
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">About Iconik</h1>
            <p className="text-xl text-gray-600">
              A personal styling service built to turn wardrobe confusion into a repeatable decision framework.
            </p>
          </div>

          {/* Business Information */}
          <div className="space-y-8">
            {/* Legal Business Information */}
            <section className="bg-blue-50/70 backdrop-blur-sm rounded-2xl p-8 border border-blue-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Briefcase className="w-6 h-6 text-blue-600" />
                Business Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Legal Business Name</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-4">MITHIL NILESH NAVALAKHA</p>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Brand Name</h3>
                  <p className="text-xl text-gray-700">Iconik</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Type</h3>
                  <p className="text-gray-700 mb-4">Individual Proprietorship</p>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Industry</h3>
                  <p className="text-gray-700">Personal Styling & Wardrobe Strategy</p>
                </div>
              </div>
            </section>

            {/* Services */}
            <section className="bg-green-50/70 backdrop-blur-sm rounded-2xl p-8 border border-green-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Services</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Iconik Style Blueprint</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Body shape and silhouette guidance</li>
                    <li>• Undertone-led colour recommendations</li>
                    <li>• Outfit formulas for work, casual, and occasion dressing</li>
                    <li>• Face-shape guidance for necklines and accessories</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Services</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• 1-on-1 stylist consultation</li>
                    <li>• Market-specific styling pages for India and international audiences</li>
                    <li>• Ongoing styling support through selected subscription products</li>
                    <li>• Editorial guides that explain the methodology in practical terms</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Mission & Vision */}
            <section className="bg-purple-50/70 backdrop-blur-sm rounded-2xl p-8 border border-purple-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Mission</h2>
              
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  At Iconik, we believe personal styling works best when it is clear, analytical, and practical. Our mission is to
                  help women understand what suits them, shop with confidence, and build wardrobes that work across real life.
                </p>
                
                <p className="text-gray-700 leading-relaxed">
                  Through a methodology-led approach to styling, Iconik helps clients buy better, dress more consistently,
                  and stop relying on generic fashion advice that does not translate to their real lives.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-gray-50/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
                    <p className="text-gray-700">
                      <a href="mailto:support@iconik.pro" className="text-blue-600 hover:underline">
                        support@iconik.pro
                      </a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Location</h3>
                    <p className="text-gray-700">India</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  For business inquiries, partnerships, or support, please reach out to us using the contact information above.
                </p>
              </div>
            </section>

            {/* Legal Compliance */}
            <section className="bg-yellow-50/70 backdrop-blur-sm rounded-2xl p-8 border border-yellow-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Legal Compliance</h2>
              
              <div className="space-y-4">
                <p className="text-gray-700">
                  <strong>Business Registration:</strong> Operating as an individual proprietorship under the name 
                  MITHIL NILESH NAVALAKHA.
                </p>
                
                <p className="text-gray-700">
                  <strong>Payment Processing:</strong> All payments are processed securely through Cashfree Payment Gateway, 
                  ensuring your financial information is protected.
                </p>
                
                <p className="text-gray-700">
                  <strong>Privacy & Data Protection:</strong> We are committed to protecting your personal information 
                  in accordance with our <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
                </p>
                
                <p className="text-gray-700">
                  <strong>Service Terms:</strong> All services are provided under our 
                  <Link href="/terms" className="text-blue-600 hover:underline"> Terms of Service</Link> with a 
                  7-day money-back guarantee as outlined in our 
                  <Link href="/refund-policy" className="text-blue-600 hover:underline"> Refund Policy</Link>.
                </p>
              </div>
            </section>
          </div>

          {/* CTA Section */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Transform Your Life?</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Join women who use Iconik to dress with more clarity, consistency, and confidence.
              </p>
              <Link 
                href="/checkout"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300"
              >
                Start Your Transformation
              </Link>
            </div>
          </div>

          {/* Last Updated */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Business information last updated: January 2024</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
