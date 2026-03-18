'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, Loader2, ArrowRight } from 'lucide-react';

const PLANS = [
  {
    id:          'monthly' as const,
    label:       'Monthly',
    price:       '₹899',
    period:      '/month',
    subtext:     'Cancel anytime. No lock-in.',
    badge:       null,
    highlighted: false,
  },
  {
    id:          'quarterly' as const,
    label:       'Quarterly',
    price:       '₹2,399',
    period:      '/quarter',
    subtext:     'Save ₹298 vs monthly',
    badge:       'POPULAR',
    highlighted: true,
  },
  {
    id:          'yearly' as const,
    label:       'Annual',
    price:       '₹8,399',
    period:      '/year',
    subtext:     'Save ₹2,389 vs monthly',
    badge:       'BEST VALUE',
    highlighted: false,
  },
];

const FEATURES = [
  'AI-curated outfit sets every month',
  'Personalised to your body shape & colouring',
  'Shoppable links from premium brands',
  'Dedicated client portal',
  'Custom look requests',
  'Priority WhatsApp support',
];

function JoinPageContent() {
  const searchParams = useSearchParams();

  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly' | 'yearly'>('quarterly');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Pre-populate from URL params (for WhatsApp pre-filled links)
  useEffect(() => {
    const pName  = searchParams.get('name');
    const pEmail = searchParams.get('email');
    const pPhone = searchParams.get('phone');
    if (pName)  setName(pName);
    if (pEmail) setEmail(pEmail);
    if (pPhone) setPhone(pPhone);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/subscription', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          plan_type:     selectedPlan,
          customer_name: name.trim(),
          customer_email: email.trim(),
          customer_phone: phone.trim(),
        }),
      });

      const data = await res.json();

      if (!data.success || !data.short_url) {
        throw new Error(data.error || 'Failed to create subscription. Please try again.');
      }

      window.location.href = data.short_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border text-sm outline-none transition"
    + " border-[#ffb3d1] bg-[#fff9f5] text-[#4a2c3e] placeholder:text-[#4a2c3e]/30"
    + " focus:ring-2 focus:ring-[#ff6b9d]/30 focus:border-[#ff6b9d]";

  return (
    <div className="min-h-screen" style={{ background: '#fff9f5', fontFamily: 'var(--font-inter)' }}>

      {/* Header */}
      <div className="text-center pt-10 pb-6 px-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles size={14} style={{ color: '#ff6b9d' }} />
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#ff6b9d' }}>
            Iconik Club
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: '#4a2c3e' }}>
          Your personal style edit,<br />every month.
        </h1>
        <p className="text-base max-w-md mx-auto" style={{ color: '#6b4057' }}>
          AI-curated outfits built around your body, colouring, and style — delivered to your private portal.
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16">

        {/* Features list */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 mb-8"
          style={{ background: '#ffffff', border: '1px solid #ffb3d1' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FEATURES.map(f => (
              <div key={f} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#ff6b9d' }} />
                <span className="text-sm" style={{ color: '#4a2c3e' }}>{f}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Plan selector */}
        <h2 className="text-lg font-bold mb-4" style={{ color: '#4a2c3e' }}>Choose your plan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {PLANS.map(plan => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.id)}
              className="relative rounded-2xl p-4 text-left transition-all duration-200 focus:outline-none"
              style={{
                border:     selectedPlan === plan.id ? '2px solid #ff6b9d' : '2px solid #ffb3d1',
                background: selectedPlan === plan.id ? '#fdf0f6' : '#ffffff',
              }}
            >
              {plan.badge && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-3 py-0.5 rounded-full"
                  style={{ background: '#ff6b9d' }}
                >
                  {plan.badge}
                </span>
              )}
              <p className="font-bold text-sm mb-1" style={{ color: '#4a2c3e' }}>{plan.label}</p>
              <p className="font-bold text-xl" style={{ color: '#ff6b9d' }}>
                {plan.price}
                <span className="text-sm font-normal" style={{ color: '#9b7090' }}>{plan.period}</span>
              </p>
              <p className="text-xs mt-1" style={{ color: '#9b7090' }}>{plan.subtext}</p>
              {selectedPlan === plan.id && (
                <div className="absolute top-3 right-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center"
                       style={{ background: '#ff6b9d' }}>
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl p-6 md:p-8"
              style={{ background: '#ffffff', border: '1px solid #ffb3d1' }}>
          <h2 className="text-xl font-bold mb-6" style={{ color: '#4a2c3e' }}>Your details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
                     style={{ color: 'rgba(74,44,62,0.5)' }}>
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
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
                     style={{ color: 'rgba(74,44,62,0.5)' }}>
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
              <p className="text-xs mt-1" style={{ color: '#9b7090' }}>
                Your login credentials will be sent here.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
                     style={{ color: 'rgba(74,44,62,0.5)' }}>
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
            <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-4 rounded-xl text-white font-bold text-base transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #ff6b9d, #c9457a)', boxShadow: '0 8px 24px rgba(255,107,157,0.3)' }}
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Setting up your subscription…</>
              : <>Continue to Payment <ArrowRight size={18} /></>
            }
          </button>

          <p className="mt-4 text-xs text-center" style={{ color: '#9b7090' }}>
            You&apos;ll be redirected to Razorpay to complete your autopay setup securely.
          </p>
        </form>

        {/* Trust */}
        <p className="text-center text-xs mt-6" style={{ color: '#9b7090' }}>
          Questions? WhatsApp us or email{' '}
          <a href="mailto:support@playernumberone.com" style={{ color: '#ff6b9d' }}>
            support@playernumberone.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default function IconikClubJoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fff9f5' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#ff6b9d' }} />
      </div>
    }>
      <JoinPageContent />
    </Suspense>
  );
}
