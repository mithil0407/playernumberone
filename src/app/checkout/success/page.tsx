'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Calendar, Users } from 'lucide-react';
import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-2xl mx-auto px-4"
      >
        <div className="bg-green-900/30 border border-green-500/30 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center">
          <CheckCircle className="w-16 h-16 text-green-400" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-green-400">
          Payment Successful! 🎉
        </h1>
        
        <p className="text-xl mb-8 text-gray-300">
          Welcome to Alpha1! Your transformation journey begins now.
        </p>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-600">
          <h2 className="text-2xl font-bold mb-4 text-blue-400">What&apos;s Next?</h2>
          
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <Calendar className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Schedule Your Session</h3>
                <p className="text-gray-400 text-sm">Book your 1-on-1 consultation with our expert stylist</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Users className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Personalized Assessment</h3>
                <p className="text-gray-400 text-sm">Get your custom transformation roadmap</p>
              </div>
            </div>
          </div>
        </div>
        
        <Link
          href="/schedule"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 rounded-lg text-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto w-fit"
        >
          Schedule Your Session <ArrowRight className="w-6 h-6" />
        </Link>
        
        <div className="mt-8 text-sm text-gray-400">
          <p>You&apos;ll receive a confirmation email with all the details.</p>
          <p>Questions? Contact us at support@playernumberone.com</p>
        </div>
      </motion.div>
    </div>
  );
}
