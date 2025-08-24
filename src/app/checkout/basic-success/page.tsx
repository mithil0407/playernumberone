'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle, Download, Clock, Mail, ArrowRight, Home } from 'lucide-react';

export default function BasicSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-24 h-24 mx-auto mb-8 bg-green-100 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>

          {/* Main Success Message */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            🎉 Payment Successful!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
          >
            Welcome to your Alpha1 transformation journey! Your Basic Starter PDF Guide is being prepared with care.
          </motion.p>

          {/* What Happens Next */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 mb-8 max-w-3xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 What Happens Next?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Within 24 Hours</h3>
                  <p className="text-gray-600 text-sm">
                    You&apos;ll receive your personalized Alpha1 Basic Starter PDF Guide via email
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Download className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Instant Access</h3>
                  <p className="text-gray-600 text-sm">
                    Download your guide and start implementing the transformation steps immediately
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4 md:col-span-2">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
                  <p className="text-gray-600 text-sm">
                    Have questions about your guide? Email us at{' '}
                    <a href="mailto:bramhaan.ai@gmail.com" className="text-blue-600 hover:underline font-medium">
                      bramhaan.ai@gmail.com
                    </a>
                    {' '}for assistance
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* What's Included in Basic Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-gradient-to-r from-blue-50/70 to-purple-50/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 mb-8 max-w-3xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📖 What&apos;s in Your Basic Guide?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Grooming & Skincare Routine</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Style & Outfit Recommendations</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Gym & Fitness Basics</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Communication & Confidence Hacks</span>
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Step-by-step action plan for immediate results</span>
              </div>
            </div>
          </motion.div>

          {/* Upgrade Option */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="bg-gradient-to-r from-orange-50 to-red-50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-orange-200/50 mb-8 max-w-3xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🚀 Want Even Better Results?</h2>
            <p className="text-gray-700 mb-6">
              Upgrade to our Advanced Full Program and get personalized 1-on-1 coaching, AI visualization, and a complete transformation plan!
            </p>
            
            <div className="bg-white rounded-xl p-4 mb-6 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">Advanced Full Program</span>
                <div className="text-right">
                  <span className="text-xl font-bold text-orange-600">₹1,999</span>
                  <div className="text-sm text-gray-500 line-through">₹2,500</div>
                </div>
              </div>
              <p className="text-sm text-gray-600">Limited time upgrade offer - Save ₹501!</p>
            </div>

            <Link
              href="/checkout?plan=advanced&upsell=true"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 group"
            >
              Upgrade Now & Save ₹501
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
            
            <a
              href="mailto:bramhaan.ai@gmail.com"
              className="inline-flex items-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-xl font-bold text-lg border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
            >
              <Mail className="w-5 h-5" />
              Contact Support
            </a>
          </motion.div>

          {/* Important Note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-gray-500">
              Check your email (including spam folder) for your Alpha1 Basic Guide within 24 hours.
              <br />
              Need immediate help? Email us at{' '}
              <a href="mailto:bramhaan.ai@gmail.com" className="text-blue-600 hover:underline">
                bramhaan.ai@gmail.com
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
