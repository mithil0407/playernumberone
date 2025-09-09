'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar } from 'lucide-react';
import Cal, { getCalApi } from "@calcom/embed-react";

export default function SchedulePage() {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({"namespace":"30min"});
      cal("ui", {"hideEventTypeDetails":false,"layout":"month_view"});
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
              Schedule Your IconOne Style Session
            </h1>
            <p className="text-gray-400 text-base md:text-lg">
              Choose your preferred time for your 1-on-1 style consultation
            </p>
          </motion.div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Session Info */}
          <div className="bg-rose-900/30 border border-rose-500/30 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-rose-400" />
              <h2 className="text-xl font-semibold">Style Session Details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 text-sm">
              <div>
                <span className="text-gray-400">Duration:</span>
                <span className="ml-2 font-semibold">20 minutes</span>
              </div>
              <div>
                <span className="text-gray-400">Format:</span>
                <span className="ml-2 font-semibold">Video Call</span>
              </div>
              <div>
                <span className="text-gray-400">Consultant:</span>
                <span className="ml-2 font-semibold">Expert Style Consultant</span>
              </div>
            </div>
          </div>

          {/* Calendly Integration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Book Your Session</h2>
              <p className="text-gray-300 text-lg">
                Select your preferred time slot below
              </p>
            </div>

                    {/* Cal.com React Component */}
                    <div className="flex justify-center">
                      <div className="w-full max-w-4xl" style={{minWidth: '320px', height: '700px'}}>
                        <Cal 
                          namespace="30min"
                          calLink="iconone-wpnx1q/30min"
                          style={{width:"100%",height:"100%",overflow:"scroll"}}
                          config={{"layout":"month_view"}}
                        />
                      </div>
                    </div>
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 bg-gray-800 rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold mb-4">What to Expect</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-sm text-gray-300">
              <div className="space-y-2">
                <p>• 5 min style goals discussion</p>
                <p>• 10 min personalized style assessment</p>
                <p>• 5 min action plan & next steps</p>
              </div>
              <div className="space-y-2">
                <p>• Receive your style transformation roadmap</p>
                <p>• Get access to exclusive style resources</p>
                <p>• Schedule follow-up style sessions</p>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 right-4 md:right-6 z-50 md:hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
                  <button
                    onClick={() => {
                      const calElement = document.querySelector('[data-cal-namespace="30min"]');
                      if (calElement) {
                        calElement.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="group relative bg-gradient-to-r from-rose-500 to-pink-500 text-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center justify-center touch-manipulation"
                  >
            <Calendar className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform duration-300" />
            {/* Pulse animation */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-400 to-pink-400 animate-ping opacity-20"></div>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
