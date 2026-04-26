'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Shield, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getAttributionPayload } from '@/lib/attribution';

const PLANS = [
  { id: 'monthly' as const, label: 'Monthly', price: '₹699',   period: '/month', subtext: 'Cancel anytime',    badge: null },
  { id: 'yearly'  as const, label: 'Annual',  price: '₹7,188', period: '/year',  subtext: '₹599/month · Save ₹1,200', badge: 'BEST VALUE' },
];

const BENEFITS = [
  '6 complete outfit sets every month — matched to your body frame, colour palette, and lifestyle',
  'Every piece is shoppable — direct links from Myntra, Ajio, and Amazon, ready to buy in one click',
  'Your private Style Vault — a growing wardrobe you can browse any time',
  'Occasion-sorted — office, casual, and festive looks, balanced to your life',
  'Built on your body\'s geometry — recommendations that follow the science of your frame, not trends',
];

const FAQS = [
  {
    q: '"What makes this different from just browsing Myntra?"',
    a: 'Myntra shows you everything that\'s trending. Your monthly drop shows you exactly what works on your body — based on your frame, your colouring, and the occasions you dress for. There\'s no scrolling involved. It\'s done for you.',
  },
  {
    q: '"How personalised is it, really?"',
    a: 'Your outfits are built across three layers: your body\'s geometric structure, your natural colour season, and your lifestyle occasions. Every piece in every outfit is selected against all three. Nothing in your drop is generic.',
  },
  {
    q: '"What if I don\'t shop every month?"',
    a: 'Your Vault stays live. Every outfit set we\'ve ever built for you is there — browse whenever you need to shop. Nothing expires.',
  },
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

function JoinPageContent() {
  const searchParams = useSearchParams();

  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [error,   setError]   = useState('');
  const [sampleItems, setSampleItems]   = useState<SampleItem[]>([]);
  const [sampleLoading, setSampleLoading] = useState(true);

  useEffect(() => {
    if (document.querySelector('script[src*="razorpay.com"]')) { setRazorpayLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
  }, []);

  useEffect(() => {
    const pName  = searchParams.get('name');
    const pEmail = searchParams.get('email');
    const pPhone = searchParams.get('phone');
    if (pName)  setName(pName);
    if (pEmail) setEmail(pEmail);
    if (pPhone) setPhone(pPhone);
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/iconik-club/items/sample')
      .then(r => r.json())
      .then(d => setSampleItems((d.items ?? []).slice(0, 3)))
      .catch(() => {})
      .finally(() => setSampleLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/subscription', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          plan_type:      selectedPlan,
          customer_name:  name.trim(),
          customer_email: email.trim(),
          customer_phone: phone.trim(),
          attribution:    getAttributionPayload(),
        }),
      });

      const data = await res.json();

      if (!data.success || !data.subscription_id) {
        throw new Error(data.error || 'Failed to create subscription. Please try again.');
      }

      type RazorpaySubOptions = {
        key: string; subscription_id: string; name: string; description: string;
        handler: () => void; prefill: { name: string; email: string; contact: string };
        theme: { color: string };
      };
      type RazorpayInstance = { open(): void };

      const openRazorpay = () => {
        const options: RazorpaySubOptions = {
          key:             data.key,
          subscription_id: data.subscription_id,
          name:            'Iconik Club',
          description:     `Iconik Club — ${selectedPlan}`,
          handler:         () => { window.location.href = '/iconik-club/join/success'; },
          prefill:         { name: name.trim(), email: email.trim(), contact: phone.trim() },
          theme:           { color: '#C9A96E' },
        };
        const rzp = new (window as unknown as { Razorpay: new (opts: RazorpaySubOptions) => RazorpayInstance }).Razorpay(options);
        rzp.open();
        setLoading(false);
      };

      if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
        openRazorpay();
      } else {
        const check = setInterval(() => {
          if ((window as unknown as { Razorpay?: unknown }).Razorpay) { clearInterval(check); openRazorpay(); }
        }, 100);
        setTimeout(() => { clearInterval(check); setLoading(false); }, 10000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const inputCls = [
    'w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all luxury-body',
    'border-luxury-cream bg-white text-luxury-charcoal placeholder:text-luxury-charcoal/30',
    'focus:ring-2 focus:ring-luxury-accent/20 focus:border-luxury-accent/60',
  ].join(' ');

  return (
    <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal font-sans pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl mx-auto"
        >
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl shadow-luxury-gold/5 border border-luxury-cream/60 relative overflow-hidden">

            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-luxury-accent via-luxury-gold to-luxury-accent opacity-80" />

            {/* Label */}
            <div className="text-center mb-8 mt-2">
              <span className="inline-block px-5 py-1.5 bg-luxury-cream border border-luxury-gold/20 text-luxury-gold text-[10px] font-bold uppercase tracking-[0.2em] rounded-full">
                Iconik Club · Membership
              </span>
            </div>

            {/* Headline */}
            <div className="text-center mb-10">
              <p className="luxury-body text-sm md:text-base text-luxury-charcoal/60 mb-3 font-medium tracking-wide">
                Six outfits. Every month.
              </p>
              <h1 className="luxury-heading text-3xl md:text-5xl text-luxury-charcoal leading-tight m-0">
                Styled to the exact <span className="text-luxury-accent italic">geometry</span> of your body.
              </h1>
            </div>

            {/* Subheadline */}
            <p className="luxury-body text-base text-luxury-charcoal/70 leading-relaxed text-center mb-10">
              Every drop is built around your body frame, natural colouring, and the occasions you live in — not what&apos;s trending. Six complete outfit sets, all shoppable, every month, without the scroll.
            </p>

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
                    <div className="grid grid-cols-3 divide-x divide-luxury-cream bg-white">
                      {[0, 1, 2].map(i => (
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
                    <div className="grid grid-cols-3 divide-x divide-luxury-cream bg-white">
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
                      Your drop is curated to your exact body profile
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

            {/* Guarantee */}
            <div className="bg-luxury-cream/40 rounded-2xl p-5 border border-luxury-cream/80 flex items-start gap-4 mb-10 shadow-sm">
              <Shield className="w-6 h-6 text-luxury-green flex-shrink-0 mt-0.5" />
              <p className="luxury-body text-sm text-luxury-charcoal/80 leading-relaxed m-0">
                <strong className="text-luxury-charcoal font-semibold">30-day guarantee.</strong>{' '}
                If your first outfit drop doesn&apos;t feel like it was built{' '}
                <em>specifically for your body</em> — email us and we&apos;ll refund your first month. No questions, no forms.
              </p>
            </div>

            {/* Plan selector */}
            <div className="mb-6">
              <p className="luxury-heading text-lg md:text-xl text-luxury-charcoal mb-2">
                Choose how you want to start
              </p>
              <p className="luxury-body text-xs md:text-sm text-luxury-charcoal/60 mb-6">
                A single in-person styling session in Mumbai costs ₹3,000–8,000. Iconik Club gives you a full month of personalised outfit curation for less.
              </p>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {PLANS.map(plan => {
                  const active = selectedPlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative rounded-2xl p-4 md:p-5 text-center cursor-pointer transition-all duration-300 outline-none
                        ${active
                          ? 'bg-luxury-cream/30 border-2 border-luxury-accent shadow-lg shadow-luxury-accent/10 scale-[1.02]'
                          : 'bg-white border border-luxury-cream hover:border-luxury-accent/30 hover:bg-luxury-cream/10'
                        }`}
                    >
                      {plan.badge && (
                        <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap tracking-wider
                          ${active ? 'bg-luxury-accent text-white' : 'bg-luxury-charcoal text-white'}`}>
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
                      <div className={`h-px w-full mb-3 ${active ? 'bg-luxury-accent/20' : 'bg-luxury-cream'}`} />
                      <p className={`luxury-body text-[9px] md:text-[10px] font-medium leading-tight
                        ${active ? 'text-luxury-accent' : 'text-luxury-charcoal/60'}`}>
                        {plan.subtext}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-luxury-cream w-full my-8" />

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <p className="luxury-heading text-lg md:text-xl text-luxury-charcoal mb-6">
                Start your membership
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-2 text-luxury-charcoal/50 luxury-body">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Priya Sharma"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-2 text-luxury-charcoal/50 luxury-body">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className={inputCls}
                  />
                  <p className="luxury-body text-xs mt-1.5 text-luxury-charcoal/40">
                    Your portal access details will be sent here.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-2 text-luxury-charcoal/50 luxury-body">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                    placeholder="+91 98765 43210"
                    className={inputCls}
                  />
                </div>
              </div>

              {error && (
                <p className="mt-5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3 luxury-body">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-7 py-4 md:py-5 rounded-full border-none cursor-pointer flex items-center justify-center gap-2 transition-all duration-500 luxury-body text-base md:text-lg text-white font-medium
                  ${loading
                    ? 'bg-luxury-charcoal/40 opacity-80 cursor-default'
                    : 'bg-luxury-accent hover:bg-luxury-accent/90 shadow-xl shadow-luxury-accent/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-luxury-accent/30'
                  }`}
              >
                {loading
                  ? <><Loader2 size={18} className="animate-spin" /> Setting up your membership…</>
                  : <>Continue to Payment <ArrowRight size={18} /></>
                }
              </button>

              <p className="luxury-body text-[10px] md:text-xs text-center text-luxury-charcoal/40 mt-3">
                You&apos;ll be taken to Razorpay to set up your subscription securely.
              </p>
            </form>

            {/* Divider */}
            <div className="h-px bg-luxury-cream w-full my-8" />

            {/* FAQs */}
            <div className="space-y-1 mb-8">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group border-b border-luxury-cream">
                  <summary className="luxury-body flex justify-between items-center font-medium cursor-pointer list-none py-4 text-sm md:text-base text-luxury-charcoal/80 group-open:text-luxury-accent transition-colors">
                    {q}
                    <span className="transition-transform group-open:rotate-45 text-xl font-light ml-4 flex-shrink-0 text-luxury-charcoal/40 group-open:text-luxury-accent">+</span>
                  </summary>
                  <p className="luxury-body text-sm text-luxury-charcoal/60 pb-4 leading-relaxed pr-8">
                    {a}
                  </p>
                </details>
              ))}
            </div>

            {/* Support */}
            <p className="luxury-body text-center text-xs text-luxury-charcoal/40">
              Questions?{' '}
              <a
                href="mailto:support@iconik.pro"
                className="text-luxury-accent hover:text-luxury-accent/70 transition-colors"
              >
                support@iconik.pro
              </a>
            </p>

          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function IconikClubJoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-luxury-warm-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-luxury-accent animate-spin mx-auto mb-4" />
          <p className="luxury-body text-sm text-luxury-charcoal/70">Loading…</p>
        </div>
      </div>
    }>
      <JoinPageContent />
    </Suspense>
  );
}
