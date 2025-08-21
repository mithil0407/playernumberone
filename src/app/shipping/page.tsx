'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Clock, Mail, MessageCircle, Download, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Alpha1
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
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping & Delivery</h1>
            <p className="text-xl text-gray-600">
              Digital service delivery and program access information
            </p>
          </div>

          {/* Service Delivery Information */}
          <div className="space-y-8">
            {/* Digital Service Notice */}
            <section className="bg-blue-50/70 backdrop-blur-sm rounded-2xl p-8 border border-blue-200">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Important Notice</h2>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    <strong>PlayerNumberOne Alpha1</strong> is a <strong>digital transformation coaching service</strong>. 
                    We do not ship physical products. All services are delivered electronically through digital channels.
                  </p>
                </div>
              </div>
            </section>

            {/* Service Delivery Process */}
            <section className="bg-green-50/70 backdrop-blur-sm rounded-2xl p-8 border border-green-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Service Delivery Process
              </h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-green-500 pl-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Payment Confirmation</h3>
                  <p className="text-gray-700">
                    Once your payment is successfully processed, you&apos;ll receive an instant confirmation email 
                    with your order details and next steps.
                  </p>
                  <p className="text-sm text-green-600 mt-2">⏱️ Delivery Time: Immediate (within 5 minutes)</p>
                </div>

                <div className="border-l-4 border-blue-500 pl-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 2: Welcome Package</h3>
                  <p className="text-gray-700">
                    You&apos;ll receive a comprehensive welcome email containing:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                    <li>Program overview and expectations</li>
                    <li>Pre-session preparation guide</li>
                    <li>Style assessment questionnaire</li>
                    <li>Contact information for your coach</li>
                  </ul>
                  <p className="text-sm text-blue-600 mt-2">⏱️ Delivery Time: Within 1 hour of payment</p>
                </div>

                <div className="border-l-4 border-purple-500 pl-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 3: Session Scheduling</h3>
                  <p className="text-gray-700">
                    Access to our scheduling system to book your 1-on-1 transformation session at your convenience.
                  </p>
                  <p className="text-sm text-purple-600 mt-2">⏱️ Available: Immediately after payment confirmation</p>
                </div>

                <div className="border-l-4 border-orange-500 pl-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 4: Coaching Session</h3>
                  <p className="text-gray-700">
                    Your personalized 1-on-1 video consultation with our transformation expert, delivered via 
                    secure video conferencing platform.
                  </p>
                  <p className="text-sm text-orange-600 mt-2">⏱️ Scheduled: Within 7 days of purchase</p>
                </div>

                <div className="border-l-4 border-red-500 pl-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 5: Transformation Plan</h3>
                  <p className="text-gray-700">
                    Receive your personalized transformation roadmap via email within 24 hours of your session, 
                    including specific recommendations and action steps.
                  </p>
                  <p className="text-sm text-red-600 mt-2">⏱️ Delivery Time: Within 24 hours of session completion</p>
                </div>
              </div>
            </section>

            {/* Delivery Methods */}
            <section className="bg-purple-50/70 backdrop-blur-sm rounded-2xl p-8 border border-purple-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Digital Delivery Methods</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Delivery</h3>
                    <p className="text-gray-700">
                      All program materials, guides, and personalized recommendations are delivered 
                      directly to your registered email address.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <MessageCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Consultation</h3>
                    <p className="text-gray-700">
                      Live 1-on-1 coaching sessions conducted via secure video conferencing 
                      platforms (Zoom/Google Meet).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Download className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Digital Resources</h3>
                    <p className="text-gray-700">
                      Downloadable guides, checklists, and resources provided as PDF files 
                      for easy access and reference.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Calendar className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Online Scheduling</h3>
                    <p className="text-gray-700">
                      Access to our online booking system for scheduling your transformation 
                      session at your preferred time.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Delivery Timeline */}
            <section className="bg-yellow-50/70 backdrop-blur-sm rounded-2xl p-8 border border-yellow-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Delivery Timeline</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white/50 rounded-lg">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Payment Confirmation</h3>
                    <p className="text-gray-600">Instant - Within 5 minutes</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Welcome Package & Scheduling Access</h3>
                    <p className="text-gray-600">Within 1 hour</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/50 rounded-lg">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">1-on-1 Coaching Session</h3>
                    <p className="text-gray-600">Scheduled within 7 days (flexible timing)</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/50 rounded-lg">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Personalized Transformation Plan</h3>
                    <p className="text-gray-600">Within 24 hours of session completion</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact for Delivery Issues */}
            <section className="bg-red-50/70 backdrop-blur-sm rounded-2xl p-8 border border-red-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Delivery Support</h2>
              
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  If you experience any issues with service delivery or have questions about accessing 
                  your program materials, please contact us immediately:
                </p>

                <div className="bg-white/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <strong>Email:</strong> <a href="mailto:support@playernumberone.com" className="text-blue-600 hover:underline">support@playernumberone.com</a>
                    </p>
                    <p className="text-gray-700">
                      <strong>Response Time:</strong> Within 24 hours
                    </p>
                    <p className="text-gray-700">
                      <strong>Emergency Support:</strong> For urgent delivery issues, mark your email as &quot;URGENT - Delivery Issue&quot;
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-100 rounded-lg p-4 border border-yellow-300">
                  <p className="text-yellow-800">
                    <strong>Important:</strong> Please check your spam/junk folder if you don&apos;t receive 
                    confirmation emails within the specified timeframes. Add our email to your safe senders list.
                  </p>
                </div>
              </div>
            </section>

            {/* Business Information */}
            <section className="bg-gray-50/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Information</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Provider</h3>
                  <p className="text-gray-700"><strong>MITHIL NILESH NAVALAKHA</strong></p>
                  <p className="text-gray-600">PlayerNumberOne Alpha1</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Type</h3>
                  <p className="text-gray-700">Digital Coaching & Consultation Services</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Delivery Location</h3>
                  <p className="text-gray-700">Worldwide (Digital Services)</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Availability</h3>
                  <p className="text-gray-700">24/7 Email Support | Scheduled Sessions During Business Hours</p>
                </div>
              </div>
            </section>
          </div>

          {/* CTA Section */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start Your Transformation?</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Get instant access to your transformation program and schedule your 1-on-1 session today.
              </p>
              <Link 
                href="/checkout"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300"
              >
                Start Your Transformation
              </Link>
            </div>
          </div>

          {/* Related Links */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Related Information</h3>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
              <span className="text-gray-400">•</span>
              <Link href="/refund-policy" className="text-blue-600 hover:underline">Refund Policy</Link>
              <span className="text-gray-400">•</span>
              <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>
              <span className="text-gray-400">•</span>
              <Link href="/contact" className="text-blue-600 hover:underline">Contact Us</Link>
            </div>
          </div>

          {/* Last Updated */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Shipping & Delivery information last updated: January 2024</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
