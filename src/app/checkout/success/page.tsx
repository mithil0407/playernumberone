'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Shield, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackCompleteRegistration, trackPageView, trackViewContent, trackInitiateCheckout } from '@/lib/metaPixel';

const ICONIK_CLUB_PLANS = [
  { id: 'monthly' as const, label: 'Monthly', price: '₹699', period: '/month', subtext: 'Cancel anytime', badge: null },
  { id: 'yearly' as const, label: 'Annual', price: '₹599', period: '/month', subtext: 'Billed ₹7,188/year', badge: 'BEST VALUE' },
];

const BENEFITS = [
  '6 complete outfit sets every month — matched to your exact body frame, colour palette, and lifestyle',
  'Every piece is shoppable — direct links from Myntra, Ajio, and Amazon, ready to buy in one click',
  'Your private Style Vault — a personal wardrobe that grows month on month',
  'Occasion-sorted — office looks, casual days, and festive dressing, balanced to your preferences',
  'Built on your Blueprint — every recommendation follows your Geometric, Chromatic, and Facial Architecture profile',
];

type SampleItem = {
  id: string;
  item_name: string;
  brand?: string;
  image_url: string;
  price?: number;
  currency?: string;
  purchase_link?: string;
  category?: string;
};

const FAQS = [
  {
    q: '"I\'ll sign up later."',
    a: 'Your Blueprint data is freshest right now — your consultation details, your preferences, your specific goals. The first outfit drop is always the most accurate. Later means starting from scratch.',
  },
  {
    q: '"How is this different from my consultation?"',
    a: 'Your consultation and Blueprint are your style science — the rules that govern what works on your body. Iconik Club is the application — every month, we translate those rules into real outfits with real pieces you can actually buy. One gives you the knowledge. The other puts it to work.',
  },
  {
    q: '"What if I don\'t shop every month?"',
    a: "Your Vault stays live. Every outfit set we've ever built for you lives there — browse it whenever you need to shop. Nothing expires.",
  },
];

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);

  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderId, setOrderId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [upsellTracked, setUpsellTracked] = useState(false);
  const [sampleItems, setSampleItems] = useState<SampleItem[]>([]);
  const [sampleLoading, setSampleLoading] = useState(true);
  const [hasClub, setHasClub] = useState(false);

  useEffect(() => {
    fetch('/api/iconik-club/items/sample')
      .then(r => r.json())
      .then(d => setSampleItems(d.items ?? []))
      .catch(() => { })
      .finally(() => setSampleLoading(false));
  }, []);

  useEffect(() => {
    if (document.querySelector('script[src*="razorpay.com"]')) { return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
  }, []);

  useEffect(() => {
    trackPageView();
    const urlCustomerId = searchParams.get('customer_id');
    const urlOrderId = searchParams.get('order_id');
    const dbOrderId = searchParams.get('db_order_id');
    const paymentId = searchParams.get('payment_id');
    const purchaseAmount = localStorage.getItem('purchaseAmount');
    const purchaseCurrency = localStorage.getItem('purchaseCurrency') || 'INR';
    if (purchaseAmount) {
      trackCompleteRegistration(parseFloat(purchaseAmount), 'ICONIK Style Consultation Purchase', purchaseCurrency);
    }
    if (urlCustomerId) localStorage.setItem('customerId', urlCustomerId);
    if (dbOrderId) { localStorage.setItem('orderId', dbOrderId); setOrderId(dbOrderId); }
    else if (urlOrderId) { localStorage.setItem('orderId', urlOrderId); setOrderId(urlOrderId); }
    if (paymentId) localStorage.setItem('paymentId', paymentId);
    setCustomerEmail(localStorage.getItem('customerEmail') || '');
    setCustomerPhone(localStorage.getItem('customerPhone') || '');
    setCustomerName(localStorage.getItem('customerName') || '');
    setHasClub(localStorage.getItem('iconikClubPurchased') === 'true');
    if (!upsellTracked) {
      trackViewContent('Iconik Club Upsell', 7188, ['iconik_club_subscription'], 'INR', 'Upsell');
      setUpsellTracked(true);
    }
  }, [searchParams, upsellTracked]);

  const handleSubscription = useCallback(async () => {
    setIsProcessing(true);
    const planLabels = { monthly: 'Monthly', yearly: 'Annual' };
    const planAmounts = { monthly: 699, yearly: 7188 };
    trackInitiateCheckout(planAmounts[selectedPlan], 1, `Iconik Club ${planLabels[selectedPlan]}`, 'INR', 'Upsell');
    try {
      const email = customerEmail || localStorage.getItem('customerEmail') || '';
      const phone = customerPhone || localStorage.getItem('customerPhone') || '';
      const name = customerName || localStorage.getItem('customerName') || email.split('@')[0];
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_type: selectedPlan, customer_email: email, customer_phone: phone, customer_name: name, original_order_id: orderId }),
      });
      const data = await response.json();
      if (!data.success || !data.subscription_id) throw new Error(data.error || 'Failed to create subscription');
      type RazorpaySubOptions = { key: string; subscription_id: string; name: string; description: string; handler: () => void; prefill: { name: string; email: string; contact: string }; theme: { color: string } };
      type RazorpayInstance = { open(): void };
      const openRazorpay = () => {
        const options: RazorpaySubOptions = {
          key: data.key, subscription_id: data.subscription_id, name: 'Iconik Club',
          description: `Iconik Club ${planLabels[selectedPlan]}`,
          handler: () => { window.location.href = '/iconik-club/join/success'; },
          prefill: { name, email, contact: phone }, theme: { color: '#ff6b9d' },
        };
        const rzp = new (window as unknown as { Razorpay: new (opts: RazorpaySubOptions) => RazorpayInstance }).Razorpay(options);
        rzp.open();
        setIsProcessing(false);
      };
      if ((window as unknown as { Razorpay?: unknown }).Razorpay) { openRazorpay(); }
      else {
        const check = setInterval(() => { if ((window as unknown as { Razorpay?: unknown }).Razorpay) { clearInterval(check); openRazorpay(); } }, 100);
        setTimeout(() => { clearInterval(check); setIsProcessing(false); }, 10000);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start subscription. Please try again.');
      setIsProcessing(false);
    }
  }, [customerEmail, customerPhone, customerName, orderId, selectedPlan]);

  return (
    <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal font-sans pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* ── Payment confirmed strip ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm mx-auto mb-4"
        >
          <div className="bg-green-50 border border-green-200 flex items-center gap-3 p-3 rounded-xl shadow-sm">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="luxury-body font-semibold text-xs text-green-900 m-0">
                Payment Confirmed
              </p>
              <p className="luxury-body text-[11px] text-green-800/70 mt-0.5 m-0">
                {hasClub
                  ? 'Your Blueprint is being prepared. Your first ICONIK Club drop will arrive once your Blueprint is ready.'
                  : 'Your Blueprint is being prepared. Expect it within 4–5 days.'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Attention hook ── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="text-center mb-8"
        >
          <p className="luxury-heading text-xl md:text-2xl text-luxury-charcoal font-semibold">
            Wait — Don&apos;t Close This Page Yet
          </p>
        </motion.div>

        {/* ── Main OTO ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl mx-auto"
        >
          <div className="bg-white rounded-3xl p-6 md:p-12 shadow-2xl shadow-luxury-gold/5 border border-luxury-cream/60 relative overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-luxury-accent via-luxury-gold to-luxury-accent opacity-80" />

            {/* Label */}
            <div className="text-center mb-8 mt-2">
              <span className="inline-block px-5 py-1.5 bg-luxury-cream border border-luxury-gold/20 text-luxury-gold text-[10px] font-bold uppercase tracking-[0.2em] rounded-full">
                Exclusive · Blueprint Clients Only
              </span>
            </div>

            {/* Headline */}
            <div className="text-center mb-10">
              <p className="luxury-body text-sm md:text-base text-luxury-charcoal/70 mb-3 font-medium tracking-wide">
                Your Blueprint tells you what works.
              </p>
              <h1 className="luxury-heading text-3xl md:text-5xl text-luxury-charcoal leading-tight m-0">
                Iconik Club shows you <span className="text-luxury-accent italic">exactly</span> what to buy.
              </h1>
            </div>

            {/* VSL */}
            <div className="rounded-2xl overflow-hidden mb-10 shadow-lg" style={{ border: '1px solid #ffb3d1' }}>
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src="https://www.youtube.com/embed/vVdlzFKSsmA?rel=0&modestbranding=1&playsinline=1"
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ border: 'none' }}
                />
              </div>
            </div>

            {/* Subheadline */}
            <p className="luxury-body text-base text-luxury-charcoal/70 leading-relaxed text-center mb-10">
              Most women finish their Blueprint and still freeze when they open Myntra. You know your science — but finding pieces that actually match it takes hours. Iconik Club does that for you, every single month.
            </p>

            {/* Benefits */}
            <div className="space-y-5 mb-10">
              {BENEFITS.map(b => (
                <div key={b} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-luxury-cream flex items-center justify-center flex-shrink-0 mt-0.5 border border-luxury-gold/20">
                    <CheckCircle className="w-3.5 h-3.5 text-luxury-accent" />
                  </div>
                  <p className="luxury-body text-sm md:text-base text-luxury-charcoal/80 leading-relaxed m-0">{b}</p>
                </div>
              ))}
            </div>

            {/* Sample outfit preview */}
            {(sampleLoading || sampleItems.length > 0) && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px flex-1 bg-luxury-cream" />
                  <p className="luxury-body text-[9px] tracking-[0.22em] uppercase text-luxury-charcoal/40 whitespace-nowrap">
                    From our current catalogue
                  </p>
                  <div className="h-px flex-1 bg-luxury-cream" />
                </div>

                <div className="rounded-2xl overflow-hidden border border-luxury-cream/80 shadow-sm">
                  {/* Outfit header */}
                  <div className="px-5 py-4 border-b border-luxury-cream flex items-start justify-between gap-3 bg-white">
                    <div>
                      <p className="text-[9px] tracking-[0.25em] uppercase text-luxury-charcoal/35 mb-1.5 font-medium">Sample · Office Wear</p>
                      <p className="luxury-heading text-[17px] leading-snug text-luxury-charcoal">
                        Boardroom to Dinner,<br />Effortlessly
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-[9px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-luxury-cream text-luxury-charcoal/50 mt-0.5">
                      1 of 6
                    </span>
                  </div>

                  {/* Items grid — skeleton while loading */}
                  {sampleLoading ? (
                    <div className="grid grid-cols-2 divide-x divide-luxury-cream bg-white [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-luxury-cream">
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} className="flex flex-col animate-pulse">
                          <div className="aspect-[3/4] bg-luxury-cream/60" />
                          <div className="px-3 py-3 space-y-2">
                            <div className="h-1.5 bg-luxury-cream/80 rounded-full w-2/3" />
                            <div className="h-2.5 bg-luxury-cream/60 rounded-full" />
                            <div className="h-2.5 bg-luxury-cream/60 rounded-full w-4/5" />
                            <div className="h-2 bg-luxury-cream/40 rounded-full w-1/2 mt-1" />
                            <div className="h-7 bg-luxury-cream/80 rounded mt-3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 divide-x divide-luxury-cream bg-white [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-luxury-cream">
                      {sampleItems.map(item => (
                        <div key={item.id} className="flex flex-col group overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image_url}
                            alt={item.item_name}
                            className="aspect-[3/4] w-full object-cover transition-all duration-500 group-hover:scale-[1.04] group-hover:brightness-[0.96]"
                          />
                          <div className="px-3 py-3 flex flex-col flex-1 border-t border-luxury-cream">
                            {item.brand && (
                              <p className="text-[8px] tracking-[0.2em] uppercase text-luxury-charcoal/35 mb-1.5 font-semibold truncate">{item.brand}</p>
                            )}
                            <p className="text-[12px] text-luxury-charcoal leading-snug mb-2 flex-1 font-medium line-clamp-2">{item.item_name}</p>
                            {item.price != null && (
                              <p className="text-[11px] text-luxury-charcoal/50 mb-2.5 font-medium">
                                {item.currency ?? '₹'}{item.price.toLocaleString('en-IN')}
                              </p>
                            )}
                            {item.purchase_link ? (
                              <a
                                href={item.purchase_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] tracking-[0.12em] uppercase font-bold text-white bg-luxury-charcoal hover:bg-luxury-charcoal/80 py-2 text-center transition-colors flex items-center justify-center gap-1"
                              >
                                Shop now <ArrowRight size={8} />
                              </a>
                            ) : (
                              <div className="py-2 text-center text-[9px] tracking-[0.1em] uppercase font-medium text-luxury-charcoal/30 border border-luxury-cream rounded">
                                Available soon
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="px-5 py-3.5 border-t border-luxury-cream bg-luxury-cream/20 flex items-center justify-between gap-3">
                    <p className="luxury-body text-[10px] text-luxury-charcoal/40 leading-snug">
                      Your drop is curated to your exact Blueprint profile
                    </p>
                    <Link
                      href="/iconik-club/client"
                      className="luxury-body text-[10px] font-bold text-luxury-accent hover:text-luxury-accent/70 flex items-center gap-1.5 whitespace-nowrap transition-colors"
                    >
                      See full portal <ArrowRight size={10} />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Guarantee */}
            <div className="bg-luxury-cream/40 rounded-2xl p-5 border border-luxury-cream/80 flex items-start gap-4 mb-10 shadow-sm">
              <Shield className="w-6 h-6 text-luxury-green flex-shrink-0 mt-0.5" />
              <p className="luxury-body text-sm text-luxury-charcoal/80 leading-relaxed m-0">
                <strong className="text-luxury-charcoal font-semibold">30-day guarantee.</strong> If your first outfit drop doesn&apos;t feel like it was built <em>specifically for you</em> — email us and we&apos;ll refund your first month. No questions asked.
              </p>
            </div>

            {/* Pricing header */}
            <div className="text-center mb-6">
              <p className="luxury-heading text-lg md:text-xl text-luxury-charcoal m-0 mb-2">
                Choose how you want to continue
              </p>
              <p className="luxury-body text-xs md:text-sm text-luxury-charcoal/60 m-0 px-2">
                A single in-person styling session costs ₹3,000–8,000. Iconik Club gives you a full month of personalized curation for less.
              </p>
            </div>

            {/* Pricing cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {ICONIK_CLUB_PLANS.map(plan => {
                const active = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative rounded-2xl p-4 md:p-5 text-center cursor-pointer transition-all duration-300 outline-none
                      ${active
                        ? 'bg-luxury-cream/30 border-2 border-luxury-accent shadow-lg shadow-luxury-accent/10 transform scale-[1.02]'
                        : 'bg-white border border-luxury-cream hover:border-luxury-accent/30 hover:bg-luxury-cream/10'
                      }`}
                  >
                    {plan.badge && (
                      <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap tracking-wider
                        ${active ? 'bg-luxury-accent text-white shadow-sm' : 'bg-luxury-charcoal text-white'}`}>
                        {plan.badge}
                      </span>
                    )}
                    <p className={`luxury-body text-[10px] md:text-xs font-semibold uppercase tracking-widest mb-2
                      ${active ? 'text-luxury-accent' : 'text-luxury-charcoal/60'}`}>
                      {plan.label}
                    </p>
                    <p className={`luxury-heading text-xl md:text-2xl mb-1
                      ${active ? 'text-luxury-charcoal' : 'text-luxury-charcoal/80'}`}>
                      {plan.price}
                    </p>
                    <p className="luxury-body text-[10px] text-luxury-charcoal/50 mb-3">{plan.period}</p>
                    <div className={`h-px w-full mx-auto mb-3 ${active ? 'bg-luxury-accent/20' : 'bg-luxury-cream'}`} />
                    <p className={`luxury-body text-[9px] md:text-[10px] font-medium leading-tight
                      ${active ? 'text-luxury-accent' : 'text-luxury-charcoal/60'}`}>
                      {plan.subtext}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* CTA */}
            <button
              onClick={handleSubscription}
              disabled={isProcessing}
              className={`w-full py-4 md:py-5 rounded-full border-none cursor-pointer flex items-center justify-center gap-2 transition-all duration-500 luxury-body text-base md:text-lg text-white font-medium
                ${isProcessing
                  ? 'bg-luxury-charcoal/40 opacity-80 cursor-default'
                  : 'bg-luxury-accent hover:bg-luxury-accent/90 shadow-xl shadow-luxury-accent/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-luxury-accent/30'
                }`}
            >
              {isProcessing ? 'Redirecting securely…' : (
                <>Join Iconik Club <ArrowRight size={20} className="ml-1" /></>
              )}
            </button>
            <p className="luxury-body text-[10px] md:text-xs text-center text-luxury-charcoal/40 mt-3 mb-10">
              Secure checkout securely via Razorpay.
            </p>

            {/* Divider */}
            <div className="h-px bg-luxury-cream w-full mb-8" />

            {/* FAQs */}
            <div className="space-y-4 mb-8">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group border-b border-luxury-cream pb-4">
                  <summary className="luxury-body flex justify-between items-center font-medium cursor-pointer list-none text-sm md:text-base text-luxury-charcoal/80 group-open:text-luxury-accent transition-colors">
                    {q}
                    <span className="transition-transform group-open:rotate-45 text-xl font-light ml-4 flex-shrink-0 text-luxury-charcoal/40 group-open:text-luxury-accent">+</span>
                  </summary>
                  <p className="luxury-body text-sm text-luxury-charcoal/60 mt-4 leading-relaxed pr-8">
                    {a}
                  </p>
                </details>
              ))}
            </div>

            {/* Skip */}
            <div className="text-center pt-2">
              <Link href="/" className="luxury-body text-xs md:text-sm text-luxury-charcoal/50 hover:text-luxury-charcoal underline underline-offset-4 transition-colors">
                No thanks, I&apos;ll pass for now
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-luxury-warm-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-luxury-accent animate-spin mx-auto mb-4" />
          <p className="luxury-body text-sm text-luxury-charcoal/70">Loading secure checkout…</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
