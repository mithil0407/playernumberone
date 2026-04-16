'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Shield, Clock, CheckCircle, RefreshCcw } from 'lucide-react';

export default function RefundPolicyPage() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Refund & Cancellation Policy</h1>
            <p className="text-xl text-gray-600">
              Your satisfaction is our priority. Here&apos;s our transparent refund and cancellation policy.
            </p>
          </div>

          {/* Policy Content */}
          <div className="space-y-8">
            {/* Style Consultations */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Style Consultations (One-Time Purchase)</h2>

              {/* 7-Day Guarantee */}
              <div className="bg-green-50/70 backdrop-blur-sm rounded-2xl p-6 border border-green-200 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">7-Day Money-Back Guarantee</h3>
                    <p className="text-gray-700 leading-relaxed">
                      We offer a <strong>7-day money-back guarantee</strong> from the date of purchase for all style consultation services.
                      If you&apos;re not completely satisfied with your consultation, you can request a full refund within 7 days.
                    </p>
                  </div>
                </div>
              </div>

              {/* Consultation Refund Conditions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">✅ Eligible for Refund</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Request made within 7 days of purchase</li>
                    <li>• Valid reason for dissatisfaction</li>
                    <li>• Original payment method available</li>
                    <li>• Consultation not yet completed</li>
                  </ul>
                </div>

                <div className="bg-red-50/70 backdrop-blur-sm rounded-2xl p-6 border border-red-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">❌ Not Eligible for Refund</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Request made after 7 days</li>
                    <li>• Consultation session completed</li>
                    <li>• Full style profile delivered</li>
                    <li>• Add-ons already provided</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Subscription Services */}
            <section className="border-t pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Subscription Services (Style Club & Iconik Closet)</h2>

              {/* 30-Day Guarantee for Subscriptions */}
              <div className="bg-purple-50/70 backdrop-blur-sm rounded-2xl p-6 border border-purple-200 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <RefreshCcw className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">30-Day Satisfaction Guarantee</h3>
                    <p className="text-gray-700 leading-relaxed">
                      For new subscription members, we offer a <strong>30-day money-back guarantee</strong> on your first payment.
                      If you don&apos;t save at least 3 hours of shopping time or find at least 2 outfits you love in your first month,
                      we&apos;ll refund your first month&apos;s payment—no questions asked.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cancellation Policy */}
              <div className="bg-yellow-50/70 backdrop-blur-sm rounded-2xl p-6 border border-yellow-200 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Subscription Cancellation</h3>
                <div className="space-y-3 text-gray-700">
                  <p className="leading-relaxed">
                    <strong>Monthly Subscriptions:</strong> Cancel anytime. You&apos;ll continue to have access until the end of your current billing period.
                    No refunds for partial months.
                  </p>
                  <p className="leading-relaxed">
                    <strong>Annual Subscriptions:</strong> Cancel anytime, but refunds are prorated based on usage:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Within 30 days: Full refund available</li>
                    <li>After 30 days: Prorated refund for unused months (minus processing fee of ₹500)</li>
                    <li>After 6 months: No refunds available</li>
                  </ul>
                </div>
              </div>

              {/* How to Cancel Subscription */}
              <div className="bg-gray-50/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">How to Cancel Your Subscription</h3>
                <ol className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                    <p className="text-gray-700">Email us at <a href="mailto:support@iconik.pro" className="text-blue-600 hover:underline">support@iconik.pro</a> with subject &quot;Cancel Subscription&quot;</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                    <p className="text-gray-700">Include your registered email address and subscription ID</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                    <p className="text-gray-700">We&apos;ll confirm cancellation within 24 hours</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                    <p className="text-gray-700">Your subscription will remain active until the end of the current billing period</p>
                  </li>
                </ol>
              </div>
            </section>

            {/* How to Request Refund (General) */}
            <section className="border-t pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Request a Refund</h2>
              <div className="bg-gray-50/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
                <ol className="space-y-4">
                  <li className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Contact Our Support Team</h4>
                      <p className="text-gray-700">Email us at <a href="mailto:support@iconik.pro" className="text-blue-600 hover:underline">support@iconik.pro</a> with your order details.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Provide Required Information</h4>
                      <p className="text-gray-700">Include your order/subscription ID, purchase date, and reason for refund request.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Wait for Processing</h4>
                      <p className="text-gray-700">We&apos;ll review your request and respond within 24-48 hours.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Receive Your Refund</h4>
                      <p className="text-gray-700">If approved, refunds are processed within 5-7 business days to your original payment method.</p>
                    </div>
                  </li>
                </ol>
              </div>
            </section>

            {/* Processing Time */}
            <section className="bg-yellow-50/70 backdrop-blur-sm rounded-2xl p-6 border border-yellow-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Processing Timeline</h2>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Review Time:</strong> 24-48 hours after request submission</p>
                    <p><strong>Refund Processing:</strong> 5-7 business days once approved</p>
                    <p><strong>Bank Processing:</strong> Additional 2-3 business days depending on your bank</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Additional Terms */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Terms</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  • <strong>Partial Refunds:</strong> For consultations, if you&apos;ve partially used the service,
                  we may offer a partial refund based on the services not yet utilized.
                </p>
                <p>
                  • <strong>Add-on Services:</strong> Add-ons purchased with consultations (Wardrobe Detox, Smart Shopper&apos;s Guide, Outfit Preview)
                  are covered under the same 7-day refund policy, provided they haven&apos;t been delivered.
                </p>
                <p>
                  • <strong>Payment Gateway Fees:</strong> In some cases, payment gateway processing fees (typically ₹50-100)
                  may be deducted from refund amounts as they are non-refundable from the payment processor.
                </p>
                <p>
                  • <strong>Dispute Resolution:</strong> We encourage direct communication to resolve
                  any issues before initiating payment disputes with your bank or card company.
                </p>
                <p>
                  • <strong>Policy Updates:</strong> This refund policy may be updated from time to time.
                  The version in effect at the time of your purchase applies to your transaction.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-blue-50/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-200 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions About Refunds or Cancellations?</h2>
              <p className="text-gray-700 mb-6">
                Our support team is here to help with any questions about our refund or cancellation policy.
              </p>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <strong>Email:</strong> <a href="mailto:support@iconik.pro" className="text-blue-600 hover:underline">support@iconik.pro</a>
                </p>
                <p className="text-gray-700">
                  <strong>Response Time:</strong> Within 24 hours
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300 mt-4"
              >
                Contact Support
              </Link>
            </section>
          </div>

          {/* Last Updated */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Last updated: February 2026</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
