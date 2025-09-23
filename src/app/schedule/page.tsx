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
    <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal">
      {/* Header */}
      <header className="bg-luxury-cream/30 border-b border-luxury-cream">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl luxury-heading mb-4 text-luxury-charcoal">
              Schedule Your ICONIK Style Session
            </h1>
            <p className="luxury-body text-luxury-charcoal/70 text-lg md:text-xl max-w-2xl mx-auto">
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
          <div className="bg-luxury-cream/40 border border-luxury-cream rounded-3xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-luxury-accent" />
              <h2 className="text-xl luxury-heading text-luxury-charcoal">Style Session Details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 text-sm">
              <div>
                <span className="luxury-body text-luxury-charcoal/60">Duration:</span>
                <span className="ml-2 luxury-body text-luxury-charcoal">20 minutes</span>
              </div>
              <div>
                <span className="luxury-body text-luxury-charcoal/60">Format:</span>
                <span className="ml-2 luxury-body text-luxury-charcoal">Video Call</span>
              </div>
              <div>
                <span className="luxury-body text-luxury-charcoal/60">Consultant:</span>
                <span className="ml-2 luxury-body text-luxury-charcoal">Expert Style Consultant</span>
              </div>
            </div>
          </div>

          {/* Cal.com Integration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-luxury-warm-white/80 backdrop-blur-xl rounded-3xl p-8 border border-luxury-cream"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-luxury-charcoal rounded-full mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-luxury-warm-white" />
              </div>
              <h2 className="text-2xl md:text-3xl luxury-heading mb-2 text-luxury-charcoal">Book Your Session</h2>
              <p className="luxury-body text-luxury-charcoal/70 text-lg">
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
            className="mt-12 bg-luxury-cream/40 backdrop-blur-xl rounded-3xl p-6 border border-luxury-cream"
          >
            <h3 className="text-lg luxury-heading mb-4 text-luxury-charcoal">What to Expect</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-sm luxury-body text-luxury-charcoal/70">
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
                    className="group relative bg-luxury-charcoal hover:bg-luxury-accent text-luxury-warm-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center justify-center touch-manipulation"
                  >
            <Calendar className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform duration-300" />
            {/* Pulse animation */}
            <div className="absolute inset-0 rounded-full bg-luxury-accent animate-ping opacity-20"></div>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
