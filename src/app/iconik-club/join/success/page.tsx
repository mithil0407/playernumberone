'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Mail, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function IconikClubJoinSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
         style={{ background: 'linear-gradient(135deg, #fff9f5 0%, #fde8f2 100%)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg text-center"
      >
        {/* Icon */}
        <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
             style={{ background: 'linear-gradient(135deg, #ff6b9d, #c9457a)' }}>
          <CheckCircle className="w-14 h-14 text-white" />
        </div>

        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles size={14} style={{ color: '#ff6b9d' }} />
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#ff6b9d' }}>
            Iconik Club
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: '#4a2c3e' }}>
          You&apos;re in!
        </h1>
        <p className="text-lg mb-2" style={{ color: '#6b4057' }}>
          Your Iconik Club membership is confirmed.
        </p>

        {/* Email notice */}
        <div className="rounded-2xl p-6 mb-8 text-left"
             style={{ background: '#ffffff', border: '1px solid #ffb3d1' }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                 style={{ background: '#fdf0f6' }}>
              <Mail className="w-5 h-5" style={{ color: '#ff6b9d' }} />
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: '#4a2c3e' }}>
                Check your email
              </p>
              <p className="text-sm" style={{ color: '#6b4057' }}>
                Your login credentials are on their way. They&apos;ll arrive within a few minutes — check your spam folder if you don&apos;t see them.
              </p>
            </div>
          </div>

          <div className="mt-5 pt-5 space-y-3" style={{ borderTop: '1px solid #fde8f2' }}>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white"
                   style={{ background: '#ff6b9d', minWidth: '20px' }}>1</div>
              <p className="text-sm" style={{ color: '#6b4057' }}>
                <strong style={{ color: '#4a2c3e' }}>Sign in</strong> using the credentials emailed to you
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white"
                   style={{ background: '#ff6b9d', minWidth: '20px' }}>2</div>
              <p className="text-sm" style={{ color: '#6b4057' }}>
                <strong style={{ color: '#4a2c3e' }}>Complete your style profile</strong> — measurements, photos, preferences
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white"
                   style={{ background: '#ff6b9d', minWidth: '20px' }}>3</div>
              <p className="text-sm" style={{ color: '#6b4057' }}>
                <strong style={{ color: '#4a2c3e' }}>Your first outfit set</strong> drops in your portal once your profile is ready
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/iconik-club/client/login"
          className="inline-flex items-center gap-3 px-10 py-4 rounded-full text-white font-bold text-lg transition-all duration-300 hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #ff6b9d, #c9457a)' }}
        >
          Go to Login <ArrowRight className="w-5 h-5" />
        </Link>

        <p className="mt-6 text-sm" style={{ color: '#9b7090' }}>
          Questions? WhatsApp us or email{' '}
          <a href="mailto:help.iconikfashion@gmail.com" style={{ color: '#ff6b9d' }}>
            help.iconikfashion@gmail.com
          </a>
        </p>
      </motion.div>
    </div>
  );
}
