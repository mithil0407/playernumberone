'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, ArrowRight, Users } from 'lucide-react';

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface DaySlot {
  date: string;
  day: string;
  slots: TimeSlot[];
}

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<{[key: string]: boolean}>({});
  const [loadingSlots, setLoadingSlots] = useState(true);

  // Fetch booked slots when component mounts
  useEffect(() => {
    fetchBookedSlots();
  }, []);

  // Fetch booked slots from database
  const fetchBookedSlots = async () => {
    try {
      setLoadingSlots(true);
      const response = await fetch('/api/sessions');
      if (response.ok) {
        const data = await response.json();
        const booked: {[key: string]: boolean} = {};
        
        if (data.data) {
          data.data.forEach((session: any) => {
            if (session.status === 'scheduled') {
              const slotKey = `${session.scheduled_date}-${session.scheduled_time}`;
              booked[slotKey] = true;
            }
          });
        }
        
        setBookedSlots(booked);
        console.log('Booked slots loaded:', booked);
      }
    } catch (error) {
      console.error('Error fetching booked slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Generate next 7 days with available time slots (excluding today and Sundays)
  const generateAvailableSlots = (): DaySlot[] => {
    const days: DaySlot[] = [];
    const timeSlots = [
      '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', 
      '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
      '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', 
      '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM'
    ];

    let dayOffset = 1; // Start from tomorrow
    
    for (let i = 0; i < 14; i++) { // Generate more days to account for Sundays
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      
      const dayOfWeek = date.getDay();
      
      // Skip Sundays (0) and today
      if (dayOfWeek === 0) {
        dayOffset++;
        continue;
      }
      
      // Only show 7 available days
      if (days.length >= 7) break;
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateString = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });

      // Check real-time availability against booked slots
      const slots: TimeSlot[] = timeSlots.map((time, index) => {
        const slotKey = `${dateString}-${time}`;
        const isBooked = bookedSlots[slotKey] || false;
        
        return {
          id: `${dayOffset}-${index}`,
          time,
          available: !isBooked
        };
      });

      days.push({
        date: dateString,
        day: dayName,
        slots
      });
      
      dayOffset++;
    }

    return days;
  };

  const availableDays = generateAvailableSlots();

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (time: string) => {
    const slotKey = `${selectedDate}-${time}`;
    const isBooked = bookedSlots[slotKey] || false;
    
    if (isBooked) {
      alert('This time slot is already booked. Please choose a different time.');
      return;
    }
    
    setSelectedTime(time);
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) return;
    
    setIsBooking(true);
    
    try {
      // Get customer ID from localStorage (set during checkout)
      const customerId = localStorage.getItem('customerId');
      const orderId = localStorage.getItem('orderId');
      
      console.log('localStorage data:', {
        customerId,
        orderId,
        allKeys: Object.keys(localStorage)
      });
      
      if (!customerId || !orderId) {
        alert('Please complete payment first before booking a session. Customer ID: ' + customerId + ', Order ID: ' + orderId);
        setIsBooking(false);
        return;
      }
      
      console.log('Attempting to book session with:', {
        customer_id: customerId,
        order_id: orderId,
        scheduled_date: selectedDate,
        scheduled_time: selectedTime
      });
      
      // Create session in database
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          order_id: orderId,
          scheduled_date: selectedDate,
          scheduled_time: selectedTime,
          status: 'scheduled'
        }),
      });
      
      if (response.ok) {
        setIsBooked(true);
        console.log('Session booked successfully');
        // Refresh booked slots after successful booking
        fetchBookedSlots();
      } else {
        const errorData = await response.json();
        console.error('Session booking failed:', errorData);
        alert(`Failed to book session: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error booking session:', error);
      alert('Failed to book session. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  if (isBooked) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="bg-green-900/30 border border-green-500/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          
                      <h1 className="text-3xl font-bold mb-4 text-green-400">
              You&apos;re Booked! 🎉
            </h1>
          
          <p className="text-xl mb-6 text-gray-300">
            Your Alpha1 transformation session is confirmed for
          </p>
          
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <div className="text-2xl font-bold text-blue-400 mb-2">
              {selectedDate} at {selectedTime}
            </div>
            <p className="text-gray-400">
              You&apos;ll receive a confirmation email with meeting details shortly.
            </p>
          </div>
          
          <div className="space-y-4 text-sm text-gray-400">
            <p>✅ Session details sent to your email</p>
            <p>✅ Calendar invite added</p>
            <p>✅ Reminder set for 1 hour before</p>
          </div>
        </motion.div>
      </div>
    );
  }

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
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Schedule Your Alpha1 Session
            </h1>
            <p className="text-gray-400 text-lg">
              Choose your preferred time for your 1-on-1 transformation consultation
            </p>
            <button
              onClick={fetchBookedSlots}
              disabled={loadingSlots}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingSlots ? 'Loading...' : 'Refresh Availability'}
            </button>
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
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold">Session Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Duration:</span>
                <span className="ml-2 font-semibold">60 minutes</span>
              </div>
              <div>
                <span className="text-gray-400">Format:</span>
                <span className="ml-2 font-semibold">Video Call</span>
              </div>
              <div>
                <span className="text-gray-400">Stylist:</span>
                <span className="ml-2 font-semibold">Expert Female Stylist</span>
              </div>
            </div>
          </div>

          {/* Date Selection */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Select Date
            </h3>
            
            <div className="grid grid-cols-7 gap-3">
              {availableDays.map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDateSelect(day.date)}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    selectedDate === day.date
                      ? 'border-blue-500 bg-blue-900/30 text-blue-400'
                      : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                  }`}
                >
                  <div className="text-sm text-gray-400">{day.day}</div>
                  <div className="font-semibold">{day.date}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Select Time for {selectedDate}
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableDays
                  .find(day => day.date === selectedDate)
                  ?.slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleTimeSelect(slot.time)}
                      disabled={!slot.available}
                      className={`p-4 rounded-lg border transition-all duration-200 ${
                        !slot.available
                          ? 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed'
                          : selectedTime === slot.time
                          ? 'border-blue-500 bg-blue-900/30 text-blue-400'
                          : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Booking Button */}
          {selectedDate && selectedTime && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <button
                onClick={handleBooking}
                disabled={isBooking}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white px-12 py-4 rounded-lg text-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto"
              >
                {isBooking ? 'Booking Your Session...' : 'Confirm Session'}
                {!isBooking && <ArrowRight className="w-6 h-6" />}
              </button>
              
              <p className="text-sm text-gray-400 mt-4">
                You&apos;ll receive a confirmation email with meeting details
              </p>
            </motion.div>
          )}

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 bg-gray-800 rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold mb-4">What to Expect</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
              <div className="space-y-2">
                <p>• 15 min consultation about your goals</p>
                <p>• 30 min style & grooming assessment</p>
                <p>• 15 min personalized action plan</p>
              </div>
              <div className="space-y-2">
                <p>• Receive your transformation roadmap</p>
                <p>• Get access to exclusive resources</p>
                <p>• Schedule follow-up sessions</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
