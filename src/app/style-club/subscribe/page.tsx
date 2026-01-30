'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CheckCircle, Lock, Star, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { trackInitiateCheckout, trackPurchase, updateUserData } from '@/lib/metaPixel';

// Razorpay types
interface RazorpaySubscriptionResponse {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
}

interface RazorpaySubscriptionOptions {
    key: string;
    subscription_id: string;
    name: string;
    description: string;
    image?: string;
    handler: (response: RazorpaySubscriptionResponse) => void;
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
    theme: {
        color: string;
    };
}

function CheckoutContent() {
    const searchParams = useSearchParams();
    const initialPlan = searchParams.get('plan') === 'annual' ? 'annual' : 'monthly';

    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>(initialPlan);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });
    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    const testimonialImages = [
        { src: '/text1.webp', alt: 'Client testimonial 1' },
        { src: '/text2.webp', alt: 'Client testimonial 2' }
    ];

    // Preload Razorpay
    useEffect(() => {
        if (document.querySelector('script[src*="razorpay.com"]')) {
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
    }, []);

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { minutes: prev.minutes - 1, seconds: 59 };
                return prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonialImages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [testimonialImages.length]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            const numericValue = value.replace(/\D/g, '');
            if (numericValue.length > 10) return;
            setFormData(prev => ({ ...prev, [name]: numericValue }));
            if (numericValue.length === 10 && formData.email.includes('@')) {
                updateUserData(formData.email, numericValue);
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
            if (name === 'email' && value.includes('@')) {
                updateUserData(value, formData.phone);
            }
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email || formData.phone.length !== 10) {
            alert('Please fill in all details correctly.');
            return;
        }

        setIsProcessing(true);
        const amount = selectedPlan === 'monthly' ? 1699 : 17299;

        // Track InitiateCheckout
        trackInitiateCheckout(amount, 1, `Style Club ${selectedPlan === 'monthly' ? 'Monthly' : 'Annual'} Membership`, 'INR', 'Style_Club');

        try {
            // Create subscription via API
            // Note: 'monthly' maps to 1699 plan in API when no customer_id sits provided
            const planTypeForApi = selectedPlan === 'monthly' ? 'monthly' : 'styleclub-annual';

            const response = await fetch('/api/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan_type: planTypeForApi,
                    customer_email: formData.email,
                    customer_phone: formData.phone,
                    customer_name: formData.name
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to initialize subscription');
            }

            const options: RazorpaySubscriptionOptions = {
                key: data.key,
                subscription_id: data.subscription_id,
                name: 'ICONIK Style Club',
                description: selectedPlan === 'monthly' ? 'Monthly Membership (₹1,699/mo)' : 'Annual Membership (₹17,299/yr)',
                image: `${window.location.origin}/logopayment.webp`,
                handler: function (response: RazorpaySubscriptionResponse) {
                    // Track Purchase
                    trackPurchase(
                        amount,
                        `Style Club ${selectedPlan}`,
                        ['style_club_sub'],
                        1,
                        'INR',
                        'Style_Club',
                        response.razorpay_payment_id
                    );

                    // Redirect to success
                    window.location.href = `/style-club/welcome?subscription_id=${response.razorpay_subscription_id}&amount=${amount}`;
                },
                prefill: {
                    name: formData.name,
                    email: formData.email,
                    contact: formData.phone
                },
                theme: {
                    color: '#E91E63'
                }
            };

            if (window.Razorpay) {
                // @ts-expect-error Razorpay is provided by checkout.js at runtime.
                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                alert('Payment gateway failed to load. Please refresh.');
            }

        } catch (error) {
            console.error('Payment error:', error);
            alert(error instanceof Error ? error.message : 'Something went wrong');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">
            {/* Header */}
            <header className="bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <Link href="/style-club" className="flex items-center gap-2 text-luxury-accent hover:text-luxury-charcoal transition-colors luxury-body font-medium">
                        <ArrowLeft className="w-5 h-5" />
                        Back to Style Club
                    </Link>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Trust Badges */}
                <div className="bg-luxury-cream/40 backdrop-blur-xl rounded-2xl p-3 md:p-4 mb-6 flex flex-wrap justify-center gap-3">
                    <div className="flex items-center gap-2 bg-luxury-pink-bg text-luxury-charcoal px-3 py-1.5 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>200+ Active Members</span>
                    </div>
                    <div className="flex items-center gap-2 bg-luxury-pink-bg text-luxury-charcoal px-3 py-1.5 rounded-full text-sm font-medium">
                        <Lock className="w-4 h-4 text-gray-600" />
                        <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-2 bg-luxury-pink-bg text-luxury-charcoal px-3 py-1.5 rounded-full text-sm font-medium">
                        <Star className="w-4 h-4 text-luxury-gold fill-current" />
                        <span>4.9/5 Rating</span>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-6 md:mb-8 max-w-[203px] mx-auto"
                >
                    <h2 className="text-lg md:text-xl luxury-heading text-center mb-3 text-luxury-charcoal">
                        Real Results from Real Women
                    </h2>

                    <div className="relative">
                        <div className="bg-luxury-cream/40 backdrop-blur-xl rounded-2xl p-2 border border-luxury-cream overflow-hidden">
                            <div className="relative" style={{ aspectRatio: '9/16' }}>
                                {testimonialImages.map((testimonial, index) => (
                                    <div
                                        key={testimonial.src}
                                        className={`absolute inset-0 transition-opacity duration-500 ${index === currentTestimonial ? 'opacity-100' : 'opacity-0'
                                            }`}
                                    >
                                        <Image
                                            src={testimonial.src}
                                            alt={testimonial.alt}
                                            width={135}
                                            height={240}
                                            className="w-full h-full object-cover rounded-xl"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-center gap-2 mt-3">
                            {testimonialImages.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentTestimonial(index)}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentTestimonial
                                        ? 'bg-luxury-accent w-6'
                                        : 'bg-luxury-charcoal/30 hover:bg-luxury-charcoal/50'
                                        }`}
                                    aria-label={`View testimonial ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Column: Plan Select + Form */}
                    <div>
                        <h1 className="text-3xl luxury-heading mb-6">Complete Your <br />Membership</h1>

                        {/* Plan Toggle */}
                        <div className="mb-8">
                            <label className="block text-sm font-bold text-luxury-charcoal/70 mb-3 uppercase tracking-wider">Select Plan</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setSelectedPlan('monthly')}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${selectedPlan === 'monthly'
                                        ? 'border-luxury-accent bg-luxury-accent/5 ring-1 ring-luxury-accent'
                                        : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div className="font-bold text-lg">Monthly</div>
                                    <div className="text-luxury-accent font-bold">₹1,699<span className="text-sm text-gray-500 font-normal">/mo</span></div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedPlan('annual')}
                                    className={`p-4 rounded-xl border-2 text-left transition-all relative ${selectedPlan === 'annual'
                                        ? 'border-luxury-green bg-luxury-green/5 ring-1 ring-luxury-green'
                                        : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div className="absolute -top-3 right-2 bg-luxury-green text-white text-xs font-bold px-2 py-1 rounded-full">SAVE 15%</div>
                                    <div className="font-bold text-lg">Annual</div>
                                    <div className="text-luxury-green font-bold">₹17,299<span className="text-sm text-gray-500 font-normal">/yr</span></div>
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handlePayment} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-transparent outline-none transition-all"
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-transparent outline-none transition-all"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Phone Number</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">+91</span>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full p-4 pl-14 border border-gray-300 rounded-xl focus:ring-2 focus:ring-luxury-accent focus:border-transparent outline-none transition-all"
                                        placeholder="Mobile number"
                                        maxLength={10}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="w-full bg-luxury-accent hover:bg-luxury-accent/90 text-luxury-warm-white py-5 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center gap-2">Processing...</span>
                                    ) : (
                                        <>
                                            Pay ₹{(selectedPlan === 'monthly' ? 1699 : 17299).toLocaleString()} <ChevronRight />
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-xs text-gray-500 mt-3 flex items-center justify-center gap-1">
                                    <Lock className="w-3 h-3" /> Secure checkout with Razorpay
                                </p>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Summary */}
                    <div className="hidden md:block">
                        <div className="bg-luxury-white rounded-3xl p-8 border border-gray-200 shadow-xl sticky top-28">
                            <h3 className="uppercase text-xs font-bold tracking-widest text-gray-400 mb-6">Order Summary</h3>

                            <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100">
                                <div>
                                    <h4 className="font-bold text-xl text-luxury-charcoal">Style Club Membership</h4>
                                    <p className="text-gray-500 text-sm mt-1">{selectedPlan === 'monthly' ? 'Billed Monthly' : 'Billed Annually'}</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-xl">₹{(selectedPlan === 'monthly' ? 1699 : 17299).toLocaleString()}</div>
                                    {selectedPlan === 'annual' && <div className="text-xs text-green-600 font-bold">Saved ₹3,000</div>}
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0" />
                                    <span>5 hand-picked outfits every month</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0" />
                                    <span>Direct purchase links (Myntra/Ajio)</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0" />
                                    <span>WhatsApp stylist support</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0" />
                                    <span>Cancel anytime</span>
                                </li>
                            </ul>

                            <div className="bg-luxury-cream/30 rounded-xl p-4 text-center">
                                <div className="text-sm font-medium text-luxury-charcoal mb-1">Offer expires in</div>
                                <div className="text-xl font-bold text-luxury-accent font-mono">
                                    {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SubscribePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <CheckoutContent />
        </Suspense>
    );
}
