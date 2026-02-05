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
            Back to ICONIK
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
                Welcome to ICONIK (Player Number One), operated by <strong>MITHIL NILESH NAVALAKHA</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
                These Terms of Service (&quot;Terms&quot;) govern your use of our website and services, including style consultations
                and subscription services. By accessing or using our services, you agree to be bound by these Terms.
              </p>
            </section>

            {/* Services Description */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Services Description</h2>
              <div className="space-y-4">
                <p className="leading-relaxed">
                  ICONIK provides personal styling and wardrobe services for women, including:
                </p>

                <div className="bg-purple-50/70 backdrop-blur-sm rounded-2xl p-6 border border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">One-Time Services</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>ICONIK Style Consultations - Personalized 1-on-1 styling sessions</li>
                    <li>Complete Style DNA Analysis</li>
                    <li>Personalized Color Palette</li>
                    <li>Body-Flattering Silhouette Mapping</li>
                    <li>Hair & Makeup Blueprint</li>
                    <li>Optional Add-ons: Wardrobe Detox, Smart Shopper&apos;s Guide, Outfit Preview</li>
                  </ul>
                </div>

                <div className="bg-blue-50/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Subscription Services</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Style Club:</strong> Monthly curated outfit recommendations (₹1,699/mo or ₹17,299/yr)</li>
                    <li><strong>Iconik Closet:</strong> Personalized shopping assistant with complete outfit sets (₹699/mo or ₹7,188/yr)</li>
                    <li>WhatsApp stylist support</li>
                    <li>Direct purchase links to Myntra, Ajio, and other retailers</li>
                  </ul>
                </div>

                <p className="leading-relaxed">
                  Our services are provided by qualified fashion and image consultants and are designed to help women
                  discover their personal style, build confidence, and simplify their wardrobes.
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
                  Payments are processed securely through Razorpay Payment Gateway. By making a payment,
                  you agree to Razorpay&apos;s terms and conditions. We do not store your payment card information.
                </p>

                <h3 className="text-lg font-semibold text-gray-900">4.3 Subscription Billing</h3>
                <p className="leading-relaxed">
                  For subscription services:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Recurring Billing:</strong> Subscriptions automatically renew at the end of each billing period unless cancelled.</li>
                  <li><strong>Billing Date:</strong> Your payment method will be charged on the same date each billing period.</li>
                  <li><strong>Price Changes:</strong> We will notify you at least 30 days before any price changes. Continued use after notification constitutes acceptance.</li>
                  <li><strong>Failed Payments:</strong> If a payment fails, your subscription may be paused. We&apos;ll notify you to update payment details.</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900">4.4 Refunds and Cancellations</h3>
                <p className="leading-relaxed">
                  Refunds and cancellations are governed by our <Link href="/refund-policy" className="text-blue-600 hover:underline">Refund & Cancellation Policy</Link>,
                  which forms part of these Terms.
                </p>
              </div>
            </section>

            {/* Subscription Terms */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Subscription-Specific Terms</h2>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">5.1 Service Delivery</h3>
                <p className="leading-relaxed">
                  Subscription services are delivered monthly via WhatsApp or email. You agree to provide accurate contact
                  information and check your messages regularly.
                </p>

                <h3 className="text-lg font-semibold text-gray-900">5.2 Content Availability</h3>
                <p className="leading-relaxed">
                  Curated outfit recommendations and shopping links are based on current product availability.
                  We are not responsible if specific recommended items become out of stock.
                </p>

                <h3 className="text-lg font-semibold text-gray-900">5.3 Cancellation</h3>
                <p className="leading-relaxed">
                  You may cancel your subscription at any time. Access continues until the end of your current billing period.
                  See our <Link href="/refund-policy" className="text-blue-600 hover:underline">Refund & Cancellation Policy</Link> for details.
                </p>
              </div>
            </section>

            {/* User Responsibilities */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. User Responsibilities</h2>
              <div className="space-y-4">
                <p className="leading-relaxed">By using our services, you agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate and complete information</li>
                  <li>Attend scheduled consultation sessions on time (for consultation services)</li>
                  <li>Maintain the confidentiality of your account credentials</li>
                  <li>Treat our staff and other users with respect</li>
                  <li>Not share or redistribute our proprietary content, style guides, or recommendations</li>
                  <li>Not use our services for any illegal or unauthorized purpose</li>
                  <li>Not resell or commercially exploit our content</li>
                </ul>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
              <div className="bg-purple-50/70 backdrop-blur-sm rounded-2xl p-6 border border-purple-200">
                <p className="leading-relaxed">
                  All content, materials, and intellectual property provided through our services remain
                  the exclusive property of ICONIK (Player Number One). This includes but is not limited to
                  styling guides, color palettes, outfit recommendations, curated shopping links, educational materials,
                  and any AI-generated or custom content. You are granted a personal, non-transferable,
                  non-commercial license to use this content for your personal styling purposes only.
                </p>
              </div>
            </section>

            {/* Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Privacy and Data Protection</h2>
              <div className="space-y-4">
                <p className="leading-relaxed">
                  Your privacy is important to us. Our collection and use of personal information is governed
                  by our <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>,
                  which forms part of these Terms.
                </p>
                <p className="leading-relaxed">
                  We may collect photos, measurements, style preferences, and shopping behavior as part of our service delivery.
                  You consent to such collection and use for the purposes of providing personalized styling services.
                </p>
              </div>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimers</h2>
              <div className="bg-yellow-50/70 backdrop-blur-sm rounded-2xl p-6 border border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div className="space-y-3">
                    <p className="leading-relaxed">
                      <strong>Results Disclaimer:</strong> Individual results and satisfaction may vary.
                      We cannot guarantee specific outcomes or that you will love every recommendation.
                    </p>
                    <p className="leading-relaxed">
                      <strong>Third-Party Retailers:</strong> We provide links to third-party retailers (Myntra, Ajio, etc.)
                      for convenience. We are not responsible for product quality, availability, pricing, or shipping from these retailers.
                    </p>
                    <p className="leading-relaxed">
                      <strong>No Shopping Obligation:</strong> Our recommendations are suggestions only.
                      You are under no obligation to purchase any recommended items.
                    </p>
                    <p className="leading-relaxed">
                      <strong>Service Availability:</strong> We strive to provide uninterrupted services but
                      cannot guarantee 100% uptime or availability of WhatsApp/email delivery.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p className="leading-relaxed">
                To the maximum extent permitted by law, ICONIK (Player Number One) shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages, including but not limited
                to loss of profits, data, or other intangible losses resulting from:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Your use or inability to use our services</li>
                <li>Unauthorized access to your account or data</li>
                <li>Errors or omissions in styling recommendations</li>
                <li>Product purchases from third-party retailers</li>
                <li>Any interruption or termination of our services</li>
              </ul>
              <p className="leading-relaxed mt-3">
                Our total liability for any claim arising out of or relating to these Terms shall not exceed
                the amount you paid us in the 12 months preceding the claim.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Termination</h2>
              <div className="space-y-4">
                <p className="leading-relaxed">
                  We may terminate or suspend your access to our services at any time, with or without cause,
                  with or without notice, effective immediately, including but not limited to violations of these Terms
                  or fraudulent, abusive, or illegal activity.
                </p>
                <p className="leading-relaxed">
                  You may terminate your use of our services at any time by:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Cancelling your subscription (if applicable) per our Refund & Cancellation Policy</li>
                  <li>Ceasing to use our services</li>
                  <li>Contacting us to close your account</li>
                </ul>
                <p className="leading-relaxed">
                  Termination does not automatically entitle you to a refund unless specified in our Refund & Cancellation Policy.
                </p>
              </div>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law</h2>
              <p className="leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of India.
                Any disputes arising under these Terms shall be subject to the exclusive jurisdiction
                of the courts in Mumbai, Maharashtra, India.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to Terms</h2>
              <div className="bg-gray-50/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
                <p className="leading-relaxed">
                  We reserve the right to modify these Terms at any time. Changes will be posted on this page
                  with an updated &quot;Last Modified&quot; date. For material changes, we may notify you via email.
                  Your continued use of our services after any changes constitutes acceptance of the new Terms.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Information</h2>
              <div className="bg-blue-50/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-200">
                <p className="leading-relaxed mb-4">
                  If you have any questions about these Terms, please contact us:
                </p>
                <div className="space-y-2">
                  <p><strong>Business Name:</strong> ICONIK (Player Number One)</p>
                  <p><strong>Operated by:</strong> MITHIL NILESH NAVALAKHA</p>
                  <p><strong>Email:</strong> <a href="mailto:support@playernumberone.com" className="text-blue-600 hover:underline">support@playernumberone.com</a></p>
                  <p><strong>Support:</strong> <a href="mailto:support@playernumberone.com" className="text-blue-600 hover:underline">support@playernumberone.com</a></p>
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
            <p>Last updated: February 2026</p>
            <p className="mt-2">
              By using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
