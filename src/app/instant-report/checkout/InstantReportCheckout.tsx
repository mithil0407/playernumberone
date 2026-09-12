'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, LockKeyhole } from 'lucide-react';
import { getAttributionPayload } from '@/lib/attribution';

interface RazorpayResponse { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }
interface RazorpayOptions {
  key: string; amount: number; currency: string; name: string; description: string; order_id: string;
  prefill: { name: string; email: string; contact: string }; theme: { color: string };
  handler: (response: RazorpayResponse) => void; modal: { ondismiss: () => void };
}
type RazorpayWindow = Window & { Razorpay?: new (options: RazorpayOptions) => { open(): void } };

export default function InstantReportCheckout({ scanToken }: { scanToken: string }) {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [phone, setPhone] = useState('');
  const [ready, setReady] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    if (!scanToken) return;
    fetch(`/api/style-scan/${encodeURIComponent(scanToken)}/status`, { cache: 'no-store' }).then(response => response.json()).then(data => {
      if (data.status !== 'ready') throw new Error('Complete your Style Scan before checkout.');
      setPhone(String(data.contact?.phone || '').replace(/^\+91/, '')); setReady(true);
    }).catch(issue => setError(issue.message));
  }, [scanToken]);
  useEffect(() => {
    if ((window as RazorpayWindow).Razorpay) return;
    const script = document.createElement('script'); script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.async = true; document.body.appendChild(script);
  }, []);

  const pay = useCallback(async () => {
    if (!scanToken || !ready) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{10}$/.test(phone)) { setError('Enter a valid email and 10-digit Indian mobile number.'); return; }
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/instant-report/payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scanToken, name, email, phone, attribution: getAttributionPayload() }) });
      const order = await response.json(); if (!response.ok) throw new Error(order.error || 'Payment could not start.');
      const paymentWindow = window as RazorpayWindow; if (!paymentWindow.Razorpay) throw new Error('Secure payment window is still loading. Please try again.');
      new paymentWindow.Razorpay({
        key: order.key, amount: order.amount, currency: order.currency, name: 'ICONIK', description: '10-Outfit Instant Style Report', order_id: order.razorpayOrderId,
        prefill: { name: name || email.split('@')[0], email, contact: phone }, theme: { color: '#2C2622' }, modal: { ondismiss: () => setBusy(false) },
        handler: async (payment: RazorpayResponse) => {
          const confirm = await fetch('/api/instant-report/confirm-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payment, accessToken: order.accessToken }) });
          const data = await confirm.json(); if (!confirm.ok) { setError(data.error || 'Payment confirmation failed. Contact support with your payment ID.'); setBusy(false); return; }
          window.location.assign(data.refinementUrl);
        },
      }).open();
    } catch (issue) { setError(issue instanceof Error ? issue.message : 'Please try again.'); setBusy(false); }
  }, [email, name, phone, ready, scanToken]);

  return <div className="min-h-screen bg-[#F8F3E9] px-4 py-8 text-[#2C2622]"><div className="mx-auto max-w-xl">
    <div className="mb-8 flex items-center justify-between"><Link href={`/instant-report?scan=${encodeURIComponent(scanToken)}`} className="flex items-center gap-2 text-xs text-[#2C2622]/55"><ArrowLeft className="h-4 w-4" /> Back</Link><span className="iconik-display tracking-[.3em]">I C O N I K</span></div>
    <section className="rounded-[28px] border border-[#2C2622]/10 bg-white p-6 shadow-sm sm:p-9"><div className="iconik-micro mb-3 text-[#B68C52]">SECURE CHECKOUT</div><h1 className="iconik-display text-4xl">Your 10-Outfit Instant Report</h1><div className="mt-5 flex items-end justify-between border-y border-[#2C2622]/10 py-5"><div><div className="font-medium">One-time payment</div><div className="mt-1 text-xs text-[#2C2622]/48">No subscription · no upgrade credit</div></div><div className="iconik-display text-4xl">₹999</div></div>
      <div className="mt-6 space-y-4"><label className="block text-xs font-medium">Name<input value={name} onChange={event => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-[#2C2622]/15 px-4 py-3.5 outline-none focus:border-[#2C2622]" /></label><label className="block text-xs font-medium">Email for your report<input type="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-[#2C2622]/15 px-4 py-3.5 outline-none focus:border-[#2C2622]" /></label><label className="block text-xs font-medium">WhatsApp number<div className="mt-2 flex rounded-xl border border-[#2C2622]/15"><span className="border-r border-[#2C2622]/10 px-4 py-3.5 text-sm text-[#2C2622]/50">+91</span><input value={phone} onChange={event => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" className="min-w-0 flex-1 rounded-r-xl px-4 outline-none" /></div></label></div>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs leading-5 text-red-800">{error}</p>}
      <button onClick={() => void pay()} disabled={busy || !ready} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#2C2622] text-sm font-medium text-white disabled:opacity-40"><LockKeyhole className="h-4 w-4" />{busy ? 'Opening secure payment…' : 'Pay ₹999 Securely'}</button>
      <div className="mt-5 grid gap-2 text-xs text-[#2C2622]/55 sm:grid-cols-2">{['Razorpay secure payment', '24-hour clock starts after refinement', '10 generated outfit visuals', 'Stylist-reviewed before release'].map(item => <span key={item} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#66806B]" />{item}</span>)}</div>
    </section>
  </div></div>;
}
