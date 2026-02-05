'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Shield, Eye, Lock, Database, UserCheck } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-xl text-gray-600">
              Your privacy matters to us. Learn how we collect, use, and protect your information.
            </p>
          </div>

          {/* Privacy Content */}
          <div className="space-y-8 text-gray-700">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="leading-relaxed">
                ICONIK (Player Number One), operated by <strong>MITHIL NILESH NAVALAKHA</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;),
                is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose,
                and safeguard your information when you use our website, style consultation services, and subscription services.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Information We Collect</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <UserCheck className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li>• Full name</li>
                    <li>• Email address</li>
                    <li>• Phone number</li>
                    <li>• Payment information</li>
                    <li>• Photos (for styling purposes)</li>
                    <li>• Body measurements and sizing</li>
                    <li>• Style preferences and shopping habits</li>
                    <li>• WhatsApp number (for subscription services)</li>
                  </ul>
                </div>

                <div className="bg-purple-50/70 backdrop-blur-sm rounded-2xl p-6 border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Usage Information</h3>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li>• Website usage data</li>
                    <li>• IP address and geolocation</li>
                    <li>• Browser and device information</li>
                    <li>• Subscription activity and engagement</li>
                    <li>• Click-through behavior on shopping links</li>
                    <li>• Cookies and similar technologies</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <div className="space-y-4">
                <p className="leading-relaxed">We use the information we collect for the following purposes:</p>

                <div className="bg-green-50/70 backdrop-blur-sm rounded-2xl p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Delivery</h3>
                  <ul className="space-y-2">
                    <li>• Provide personalized style consultations and recommendations</li>
                    <li>• Deliver monthly curated outfit suggestions (subscription services)</li>
                    <li>• Process payments and manage your account</li>
                    <li>• Schedule and conduct 1-on-1 styling sessions</li>
                    <li>• Send service-related communications via email or WhatsApp</li>
                    <li>• Provide shopping links and outfit recommendations</li>
                  </ul>
                </div>

                <div className="bg-yellow-50/70 backdrop-blur-sm rounded-2xl p-6 border border-yellow-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Operations</h3>
                  <ul className="space-y-2">
                    <li>• Improve our services and user experience</li>
                    <li>• Analyze usage patterns and content performance</li>
                    <li>• Prevent fraud and ensure security</li>
                    <li>• Comply with legal obligations and tax requirements</li>
                    <li>• Resolve disputes and provide customer support</li>
                    <li>• Send marketing communications (with consent)</li>
                  </ul>
                </div>

                <div className="bg-purple-50/70 backdrop-blur-sm rounded-2xl p-6 border border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Subscription Management</h3>
                  <ul className="space-y-2">
                    <li>• Process recurring subscription payments</li>
                    <li>• Track subscription status and billing cycles</li>
                    <li>• Send renewal reminders and payment confirmations</li>
                    <li>• Handle cancellations and refund requests</li>
                    <li>• Personalize content based on subscription tier</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              <div className="space-y-4">
                <p className="leading-relaxed">
                  We do not sell, trade, or otherwise transfer your personal information to third parties,
                  except in the following circumstances:
                </p>

                <div className="bg-gray-50/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Authorized Disclosures</h3>
                  <ul className="space-y-2">
                    <li>• <strong>Service Providers:</strong> Trusted third parties who assist in operating our business (payment processors, database hosting, email services, etc.)</li>
                    <li>• <strong>Payment Processing:</strong> Razorpay for payment processing (subject to their privacy policy)</li>
                    <li>• <strong>Shopping Partners:</strong> We may share anonymized data with retail partners (Myntra, Ajio) for affiliate tracking</li>
                    <li>• <strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                    <li>• <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                    <li>• <strong>Consent:</strong> When you have given explicit consent for specific disclosures</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <div className="bg-red-50/70 backdrop-blur-sm rounded-2xl p-6 border border-red-200">
                <div className="flex items-start gap-3">
                  <Lock className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Security Measures</h3>
                    <p className="leading-relaxed mb-4">
                      We implement appropriate technical and organizational security measures to protect your
                      personal information against unauthorized access, alteration, disclosure, or destruction.
                    </p>
                    <ul className="space-y-2">
                      <li>• SSL/TLS encryption for data transmission</li>
                      <li>• Secure database storage with Supabase</li>
                      <li>• Payment data secured by Razorpay (PCI DSS compliant)</li>
                      <li>• Regular security audits and updates</li>
                      <li>• Access controls and authentication</li>
                      <li>• Staff training on data protection</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
              <div className="space-y-4">
                <p className="leading-relaxed">
                  We retain your personal information for as long as necessary to fulfill the purposes outlined
                  in this Privacy Policy, unless a longer retention period is required or permitted by law.
                </p>

                <div className="bg-blue-50/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Retention Periods</h3>
                  <ul className="space-y-2">
                    <li>• <strong>Account Information:</strong> Until account deletion or 3 years of inactivity</li>
                    <li>• <strong>Active Subscriptions:</strong> Duration of subscription plus 1 year</li>
                    <li>• <strong>Payment Records:</strong> 7 years for tax and legal compliance</li>
                    <li>• <strong>Photos and Measurements:</strong> Until service completion or account deletion</li>
                    <li>• <strong>Communication Records:</strong> 2 years for customer support purposes</li>
                    <li>• <strong>Style Preferences:</strong> Until account deletion or subscription cancellation</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights</h2>
              <div className="space-y-4">
                <p className="leading-relaxed">
                  You have certain rights regarding your personal information:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50/70 backdrop-blur-sm rounded-xl p-4 border border-green-200">
                    <h4 className="font-semibold text-gray-900 mb-2">✅ Access Rights</h4>
                    <p className="text-sm">Request a copy of your personal information</p>
                  </div>

                  <div className="bg-blue-50/70 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-2">✏️ Correction Rights</h4>
                    <p className="text-sm">Request correction of inaccurate information</p>
                  </div>

                  <div className="bg-red-50/70 backdrop-blur-sm rounded-xl p-4 border border-red-200">
                    <h4 className="font-semibold text-gray-900 mb-2">🗑️ Deletion Rights</h4>
                    <p className="text-sm">Request deletion of your personal information</p>
                  </div>

                  <div className="bg-purple-50/70 backdrop-blur-sm rounded-xl p-4 border border-purple-200">
                    <h4 className="font-semibold text-gray-900 mb-2">📤 Portability Rights</h4>
                    <p className="text-sm">Request transfer of your data to another service</p>
                  </div>

                  <div className="bg-yellow-50/70 backdrop-blur-sm rounded-xl p-4 border border-yellow-200">
                    <h4 className="font-semibold text-gray-900 mb-2">🔕 Opt-Out Rights</h4>
                    <p className="text-sm">Unsubscribe from marketing communications</p>
                  </div>

                  <div className="bg-orange-50/70 backdrop-blur-sm rounded-xl p-4 border border-orange-200">
                    <h4 className="font-semibold text-gray-900 mb-2">🛑 Objection Rights</h4>
                    <p className="text-sm">Object to processing of your data</p>
                  </div>
                </div>

                <p className="leading-relaxed mt-4">
                  To exercise these rights, please contact us at{' '}
                  <a href="mailto:privacy@playernumberone.com" className="text-blue-600 hover:underline">
                    privacy@playernumberone.com
                  </a>
                </p>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <div className="bg-orange-50/70 backdrop-blur-sm rounded-2xl p-6 border border-orange-200">
                <div className="flex items-start gap-3">
                  <Eye className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="leading-relaxed mb-4">
                      We use cookies and similar tracking technologies to enhance your experience on our website.
                      These help us understand how you use our services and improve functionality.
                    </p>
                    <div className="space-y-2">
                      <p><strong>Essential Cookies:</strong> Required for basic website functionality, checkout, and account access</p>
                      <p><strong>Analytics Cookies:</strong> Help us understand website usage patterns (Meta Pixel, Google Analytics)</p>
                      <p><strong>Marketing Cookies:</strong> Used for targeted advertising and retargeting (with consent)</p>
                      <p><strong>Preference Cookies:</strong> Remember your style preferences and subscription settings</p>
                    </div>
                    <p className="mt-4 text-sm">
                      You can control cookie preferences through your browser settings. Note that disabling
                      certain cookies may affect website functionality.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Third-Party Services</h2>
              <div className="space-y-4">
                <p className="leading-relaxed">
                  Our website and services may contain links to third-party websites or integrate with
                  third-party services. We are not responsible for the privacy practices of these third parties.
                </p>

                <div className="bg-gray-50/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Third-Party Integrations</h3>
                  <ul className="space-y-2">
                    <li>• <strong>Razorpay:</strong> Payment processing for consultations and subscriptions (subject to Razorpay&apos;s privacy policy)</li>
                    <li>• <strong>Supabase:</strong> Database and backend services for secure data storage</li>
                    <li>• <strong>Vercel:</strong> Website hosting and deployment</li>
                    <li>• <strong>Google Sheets:</strong> Customer data synchronization (encrypted)</li>
                    <li>• <strong>Meta Pixel:</strong> Marketing analytics and conversion tracking</li>
                    <li>• <strong>WhatsApp Business:</strong> Subscription content delivery and customer support</li>
                    <li>• <strong>Shopping Partners:</strong> Myntra, Ajio, and other retailers (for product links only - we don&apos;t share your data)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children&apos;s Privacy</h2>
              <div className="bg-yellow-50/70 backdrop-blur-sm rounded-2xl p-6 border border-yellow-200">
                <p className="leading-relaxed">
                  Our services are not intended for individuals under the age of 18. We do not knowingly
                  collect personal information from children under 18. If you become aware that a child
                  has provided us with personal information, please contact us immediately.
                </p>
              </div>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. International Data Transfers</h2>
              <p className="leading-relaxed">
                Your information may be transferred to and processed in countries other than your country
                of residence (particularly through our hosting provider Vercel and database provider Supabase).
                We ensure appropriate safeguards are in place to protect your information in accordance with
                this Privacy Policy and applicable data protection laws.
              </p>
            </section>

            {/* Marketing Communications */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Marketing Communications</h2>
              <div className="bg-blue-50/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-200">
                <p className="leading-relaxed mb-3">
                  We may send you promotional emails about new services, special offers, or other information
                  we think you may find interesting. You can opt out at any time by:
                </p>
                <ul className="space-y-2">
                  <li>• Clicking the &quot;unsubscribe&quot; link in any marketing email</li>
                  <li>• Contacting us at support@playernumberone.com</li>
                  <li>• Adjusting your account preferences</li>
                </ul>
                <p className="leading-relaxed mt-3 text-sm">
                  Note: You cannot opt out of transactional emails (order confirmations, subscription renewals,
                  password resets, etc.) as these are necessary for service delivery.
                </p>
              </div>
            </section>

            {/* Changes to Privacy Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to This Privacy Policy</h2>
              <div className="bg-blue-50/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-200">
                <p className="leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes
                  by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date.
                  For significant changes, we may also send you an email notification. You are advised to review
                  this Privacy Policy periodically for any changes.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Us</h2>
              <div className="bg-green-50/70 backdrop-blur-sm rounded-2xl p-6 border border-green-200">
                <p className="leading-relaxed mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="space-y-2">
                  <p><strong>Business Name:</strong> ICONIK (Player Number One)</p>
                  <p><strong>Operated by:</strong> MITHIL NILESH NAVALAKHA</p>
                  <p><strong>Privacy Officer:</strong> <a href="mailto:privacy@playernumberone.com" className="text-blue-600 hover:underline">privacy@playernumberone.com</a></p>
                  <p><strong>General Support:</strong> <a href="mailto:support@playernumberone.com" className="text-blue-600 hover:underline">support@playernumberone.com</a></p>
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
              By using our services, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
