'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  endTime: Date;
  className?: string;
}

export default function CountdownTimer({ endTime, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const timeUnits = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.minutes, label: 'Minutes' },
    { value: timeLeft.seconds, label: 'Seconds' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 md:p-6 rounded-2xl shadow-lg ${className}`}
    >
      <div className="text-center mb-4">
        <h3 className="text-lg md:text-xl font-bold mb-2">⏰ OFFER ENDS IN</h3>
        <p className="text-sm opacity-90">Don&apos;t miss your transformation opportunity!</p>
      </div>
      
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {timeUnits.map((unit, index) => (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="text-center"
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 md:p-3 border border-white/30">
              <div className="text-xl md:text-2xl font-bold">{unit.value.toString().padStart(2, '0')}</div>
              <div className="text-xs opacity-80">{unit.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="text-center mt-4">
        <p className="text-sm opacity-90">
          🔥 Limited Time: Only 20 slots available this week
        </p>
      </div>
    </motion.div>
  );
}
