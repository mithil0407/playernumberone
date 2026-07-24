'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, MessageCircle, Clock, CheckCircle, Send } from 'lucide-react';
import { SeoEditorialFooter, SeoEditorialHeader } from '@/components/seo/SeoEditorial';
import { trackPageView, trackLead } from '@/lib/metaPixel';
import {
  BUSINESS_HOURS,
  SUPPORT_EMAIL,
  SUPPORT_WHATSAPP_DISPLAY,
  SUPPORT_WHATSAPP_URL,
} from '@/lib/siteFacts';

export default function ContactPage() {
  // Track page view on mount
  useEffect(() => {
    trackPageView();
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    orderNumber: '',
    website: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error('Unable to send message');
      }
      trackLead(undefined, 'Contact Form Submission');
      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch {
      setIsSubmitting(false);
      setSubmitError(`We could not send the form. Please email ${SUPPORT_EMAIL} or message us on WhatsApp.`);
    }
  };

  if (isSubmitted) {
    return (
      <div className="seo-editorial min-h-screen">
        <SeoEditorialHeader />
        <main className="seo-editorial-shell grid min-h-[70vh] place-items-center py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl rounded-[1.75rem] border border-[#2C2622]/10 bg-white/35 p-8 text-center shadow-[0_28px_72px_rgba(44,38,34,0.12)] md:p-12"
          >
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-[#1A2228]">
              <CheckCircle className="h-8 w-8 text-[#B79A67]" />
            </div>
            <p className="seo-eyebrow">Message received</p>
            <h1 className="mt-3 font-[family-name:var(--font-fraunces)] text-5xl font-light tracking-[-0.04em]">
              Thank you.
            </h1>
            <p className="mt-5 leading-7 text-[#2C2622]/65">
              Our team will reply during {BUSINESS_HOURS.display}.
            </p>
            <Link
              href="/"
              className="mt-7 inline-flex rounded-full bg-[#2C2622] px-6 py-3 text-sm text-[#F8F3E9]"
            >
              Back to ICONIK
            </Link>
          </motion.div>
        </main>
        <SeoEditorialFooter />
      </div>
    );
  }

  return (
    <div className="seo-editorial min-h-screen">
      <SeoEditorialHeader />

      <main className="seo-editorial-shell py-14 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <header className="mb-14 max-w-4xl">
            <nav aria-label="Breadcrumb" className="seo-breadcrumbs">
              <Link href="/">Home</Link> / <span aria-current="page">Contact</span>
            </nav>
            <p className="seo-eyebrow">Support · ICONIK LLP</p>
            <h1 className="mt-4 font-[family-name:var(--font-fraunces)] text-[clamp(3.2rem,8vw,6.4rem)] font-light leading-[0.95] tracking-[-0.045em]">
              How can we help?
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#2C2622]/65">
              Ask about your Blueprint, consultation, payment or delivery. Include your order
              number when you have one so we can find the right record quickly.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="rounded-[1.75rem] border border-[#2C2622]/10 bg-white/35 p-7 shadow-[0_28px_72px_rgba(44,38,34,0.10)] md:p-10"
            >
              <p className="seo-eyebrow">Contact form</p>
              <h2 className="mb-7 mt-3 font-[family-name:var(--font-fraunces)] text-4xl font-light tracking-[-0.035em]">
                Send us a message
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-[#2C2622]/15 bg-[#F8F3E9]/70 px-4 py-3 text-[#2C2622] outline-none focus:border-[#9A7D4A] focus:ring-2 focus:ring-[#9A7D4A]/20"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-[#2C2622]/15 bg-[#F8F3E9]/70 px-4 py-3 text-[#2C2622] outline-none focus:border-[#9A7D4A] focus:ring-2 focus:ring-[#9A7D4A]/20"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-900 mb-2">
                    Order Number (Optional)
                  </label>
                  <input
                    type="text"
                    id="orderNumber"
                    name="orderNumber"
                    value={formData.orderNumber}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-[#2C2622]/15 bg-[#F8F3E9]/70 px-4 py-3 text-[#2C2622] outline-none focus:border-[#9A7D4A] focus:ring-2 focus:ring-[#9A7D4A]/20"
                    placeholder="alpha1_xxxxx (if applicable)"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-900 mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-[#2C2622]/15 bg-[#F8F3E9]/70 px-4 py-3 text-[#2C2622] outline-none focus:border-[#9A7D4A] focus:ring-2 focus:ring-[#9A7D4A]/20"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="payment">Payment Issues</option>
                    <option value="refund">Refund Request</option>
                    <option value="scheduling">Scheduling Help</option>
                    <option value="program">Program Questions</option>
                    <option value="technical">Technical Support</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-900 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full resize-none rounded-xl border border-[#2C2622]/15 bg-[#F8F3E9]/70 px-4 py-3 text-[#2C2622] outline-none focus:border-[#9A7D4A] focus:ring-2 focus:ring-[#9A7D4A]/20"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full rounded-full bg-[#2C2622] px-6 py-4 font-[family-name:var(--font-fraunces)] text-lg text-[#F8F3E9] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="w-5 h-5" />
                      </>
                    )}
                  </span>
                </button>
                {submitError && (
                  <p role="alert" className="text-sm text-red-700">
                    {submitError}
                  </p>
                )}
              </form>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-6"
            >
              {/* Contact Methods */}
              <div className="rounded-[1.75rem] bg-[#1A2228] p-8 text-[#F8F3E9] shadow-[0_28px_72px_rgba(44,38,34,0.16)]">
                <p className="seo-eyebrow text-white/50">Direct support</p>
                <h2 className="mb-7 mt-3 font-[family-name:var(--font-fraunces)] text-4xl font-light">Get in touch</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
                      <Mail className="h-6 w-6 text-[#B79A67]" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-white">Email support</h3>
                      <p className="mb-2 text-white/55">Questions, orders and delivery</p>
                      <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-[#D1B781] hover:underline">
                        {SUPPORT_EMAIL}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
                      <MessageCircle className="h-6 w-6 text-[#B79A67]" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-white">WhatsApp support</h3>
                      <p className="mb-2 text-white/55">Quick help during business hours</p>
                      <a href={SUPPORT_WHATSAPP_URL} className="font-medium text-[#D1B781] hover:underline">
                        {SUPPORT_WHATSAPP_DISPLAY}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
                      <Clock className="h-6 w-6 text-[#B79A67]" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-white">Business hours</h3>
                      <p className="text-white/55">
                        {BUSINESS_HOURS.display}<br />
                        Replies are handled during these hours.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ Quick Links */}
              <div className="rounded-[1.75rem] border border-[#2C2622]/10 bg-[#EDE5D2] p-8">
                <h2 className="mb-6 font-[family-name:var(--font-fraunces)] text-3xl font-light">Quick help</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Common Questions</h3>
                    <ul className="space-y-2">
                      <li>
                        <Link href="/faq" className="underline decoration-[#9A7D4A] underline-offset-4">
                          → Browse frequently asked questions
                        </Link>
                      </li>
                      <li>
                        <Link href="/refund-policy" className="underline decoration-[#9A7D4A] underline-offset-4">
                          → What is your refund policy?
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Payment Issues</h3>
                    <p className="text-gray-600 text-sm">
                      If you&apos;re experiencing payment problems, please include your order number 
                      and payment method in your message for faster resolution.
                    </p>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        </motion.div>
      </main>
      <SeoEditorialFooter />
    </div>
  );
}
