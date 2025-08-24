'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';

export default function TermsOfServicePage() {
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
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-xl text-gray-600">
              Please read these terms carefully before using our services.
            </p>
          </div>

          {/* Terms Content */}
          <div className="space-y-8 text-gray-700">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="leading-relaxed">
                Welcome to PlayerNumberOne Alpha1, operated by <strong>MITHIL NILESH NAVALAKHA</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). 
                These Terms of Service (&quot;Terms&quot;) govern your use of our website and services, including our men&apos;s 
                transformation coaching program. By accessing or using our services, you agree to be bound by these Terms.
              </p>
            </section>

            {/* Services Description */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Services Description</h2>
              <div className="space-y-4">
                <p className="leading-relaxed">
                  Alpha1 provides personalized men&apos;s transformation coaching services, including but not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>1-on-1 styling and grooming consultations</li>
                  <li>Personalized fitness and nutrition guidance</li>
                  <li>Confidence and communication coaching</li>
                  <li>Fashion and wardrobe recommendations</li>
                  <li>AI-powered before/after visualizations (optional add-on)</li>
                </ul>
                <p className="leading-relaxed">
                  Our services are provided by qualified professionals and are designed to help men improve 
                  their overall appearance, confidence, and social presence.
                </p>
              </div>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Eligibility</h2>
              <div className="bg-blue-50/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-200">
                <p className="leading-relaxed">
                  You must be at least 18 years old to use our services. By using our services, you represent 
                  and warrant that you meet this age requirement and have the legal capacity to enter into 
                  these Terms.
                </p>
              </div>
            </section>

            {/* Payment Terms */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Payment Terms</h2>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">4.1 Pricing</h3>
                <p className="leading-relaxed">
                  All prices are listed in Indian Rupees (INR) and are subject to change without notice. 
                  Current pricing is displayed on our website at the time of purchase.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900">4.2 Payment Processing</h3>
                <p className="leading-relaxed">
                  Payments are processed securely through Cashfree Payment Gateway. By making a payment, 
                  you agree to Cashfree&apos;s terms and conditions.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900">4.3 Refunds</h3>
                <p className="leading-relaxed">
                  Refunds are governed by our <Link href="/refund-policy" className="text-blue-600 hover:underline">Refund Policy</Link>, 
                  which forms part of these Terms.
                </p>
              </div>
            </section>

            {/* User Responsibilities */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. User Responsibilities</h2>
              <div className="space-y-4">
                <p className="leading-relaxed">By using our services, you agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate and complete information</li>
                  <li>Attend scheduled sessions on time</li>
                  <li>Follow the guidance and recommendations provided</li>
                  <li>Treat our staff and other users with respect</li>
                  <li>Not share or redistribute our proprietary content</li>
                  <li>Not use our services for any illegal or unauthorized purpose</li>
                </ul>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
              <div className="bg-purple-50/70 backdrop-blur-sm rounded-2xl p-6 border border-purple-200">
                <p className="leading-relaxed">
                  All content, materials, and intellectual property provided through our services remain 
                  the exclusive property of PlayerNumberOne Alpha1. This includes but is not limited to 
                  styling guides, fitness plans, educational materials, and AI-generated content.
                </p>
              </div>
            </section>

            {/* Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Privacy and Data Protection</h2>
              <div className="space-y-4">
                <p className="leading-relaxed">
                  Your privacy is important to us. Our collection and use of personal information is governed 
                  by our <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>, 
                  which forms part of these Terms.
                </p>
                <p className="leading-relaxed">
                  We may collect photos and measurements as part of our service delivery. You consent to 
                  such collection and use for the purposes of providing our services.
                </p>
              </div>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disclaimers</h2>
              <div className="bg-yellow-50/70 backdrop-blur-sm rounded-2xl p-6 border border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div className="space-y-3">
                    <p className="leading-relaxed">
                      <strong>Results Disclaimer:</strong> Individual results may vary. We cannot guarantee 
                      specific outcomes or results from our coaching services.
                    </p>
                    <p className="leading-relaxed">
                      <strong>Health Disclaimer:</strong> Our fitness and nutrition recommendations are for 
                      general guidance only and do not constitute medical advice. Consult with healthcare 
                      professionals before making significant lifestyle changes.
                    </p>
                    <p className="leading-relaxed">
                      <strong>Service Availability:</strong> We strive to provide uninterrupted services but 
                      cannot guarantee 100% uptime or availability.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="leading-relaxed">
                To the maximum extent permitted by law, PlayerNumberOne Alpha1 shall not be liable for any 
                indirect, incidental, special, consequential, or punitive damages, including but not limited 
                to loss of profits, data, or other intangible losses resulting from your use of our services.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
              <div className="space-y-4">
                <p className="leading-relaxed">
                  We may terminate or suspend your access to our services at any time, with or without cause, 
                  with or without notice, effective immediately.
                </p>
                <p className="leading-relaxed">
                  You may terminate your use of our services at any time. Termination does not automatically 
                  entitle you to a refund unless specified in our Refund Policy.
                </p>
              </div>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
              <p className="leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of India. 
                Any disputes arising under these Terms shall be subject to the exclusive jurisdiction 
                of the courts in Mumbai, India.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to Terms</h2>
              <div className="bg-gray-50/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
                <p className="leading-relaxed">
                  We reserve the right to modify these Terms at any time. Changes will be posted on this page 
                  with an updated &quot;Last Modified&quot; date. Your continued use of our services after any changes 
                  constitutes acceptance of the new Terms.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
              <div className="bg-blue-50/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-200">
                <p className="leading-relaxed mb-4">
                  If you have any questions about these Terms, please contact us:
                </p>
                <div className="space-y-2">
                  <p><strong>Email:</strong> <a href="mailto:bramhaan.ai@gmail.com" className="text-blue-600 hover:underline">bramhaan.ai@gmail.com</a></p>
                                      <p><strong>Support:</strong> <a href="mailto:bramhaan.ai@gmail.com" className="text-blue-600 hover:underline">bramhaan.ai@gmail.com</a></p>
                </div>
                <Link 
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300 mt-4"
                >
                  Contact Us
                </Link>
              </div>
            </section>
          </div>

          {/* Last Updated */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Last updated: January 2024</p>
            <p className="mt-2">
              By using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
