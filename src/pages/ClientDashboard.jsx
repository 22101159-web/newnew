import React, { useState, useEffect } from 'react';
import { Search, Calendar, Clock, MapPin, Tag, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ClientDashboard() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      // In this setup, we fetch all events and filter client-side for simplicity, 
      // or we can use a specific endpoint if available.
      // Since it's a guest lookup, we query the events list.
      const res = await fetch('/api/data/emis_events/');
      if (!res.ok) throw new Error('Failed to fetch events');
      
      const data = await res.json();
      const allEvents = Array.isArray(data) ? data : JSON.parse(data.value || '[]');
      
      // Filter by email and phone (case-insensitive for email)
      const filtered = allEvents.filter(event => 
        event.clientEmail?.toLowerCase() === email.toLowerCase() && 
        event.clientPhone === phone
      );
      
      setBookings(filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      setError('Could not retrieve bookings. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-serif text-stone-900 mb-4 italic">My Bookings</h1>
          <p className="text-stone-500 uppercase tracking-widest text-[10px] font-bold">
            Enter your details to view your event status
          </p>
        </header>

        {/* Search Bar */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 mb-12">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400 px-1">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-stone-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent-gold transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400 px-1">Phone Number</label>
              <input 
                type="tel" 
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09XXXXXXXXX"
                className="w-full bg-stone-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-accent-gold transition-all"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="md:col-span-2 bg-stone-900 text-white py-5 rounded-full font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg flex items-center justify-center gap-2 group"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} className="group-hover:scale-110 transition-transform" />}
              Check Bookings
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!searched ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-stone-100/50 rounded-3xl border-2 border-dashed border-stone-200"
              >
                <p className="text-stone-400 text-sm italic font-serif">Enter your email and phone to find your events.</p>
              </motion.div>
            ) : loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-20">
                <Loader2 className="animate-spin text-accent-gold" size={48} />
              </motion.div>
            ) : bookings.length > 0 ? (
              bookings.map((booking, idx) => (
                <motion.div 
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                            booking.status === 'confirmed' ? 'bg-green-50 text-green-600 border border-green-100' :
                            booking.status === 'cancelled' ? 'bg-red-50 text-red-600 border border-red-100' :
                            'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {booking.status || 'pending'}
                          </span>
                          <span className="text-stone-300 text-[10px] uppercase font-bold tracking-widest">#{booking.id?.slice(0,8)}</span>
                        </div>
                        <h3 className="text-2xl font-serif text-stone-900">{booking.eventType} Request</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                        <div className="flex items-center gap-3 text-stone-600">
                          <Calendar size={16} className="text-accent-gold" />
                          <span className="text-xs font-medium">{booking.date || 'TBD'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-stone-600">
                          <Clock size={16} className="text-accent-gold" />
                          <span className="text-xs font-medium">{booking.time || 'TBD'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-stone-600">
                          <MapPin size={16} className="text-accent-gold" />
                          <span className="text-xs font-medium">{booking.venue || 'No location set'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t md:border-t-0 md:border-l border-stone-100 pt-6 md:pt-0 md:pl-8 flex flex-col justify-center">
                      <div className="text-center md:text-right">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-1">Package Price</p>
                        <p className="text-2xl font-serif text-stone-900">₱{booking.totalPrice?.toLocaleString() || '0'}</p>
                        <div className="mt-4">
                          <a 
                            href={`/track/${booking.id}`}
                            className="inline-block px-6 py-3 bg-stone-50 border border-stone-200 text-stone-600 rounded-full text-[10px] font-bold uppercase tracking-widest hover:border-accent-gold hover:text-accent-gold transition-all"
                          >
                            Live Tracking
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-stone-100/50 rounded-3xl border-2 border-dashed border-stone-200"
              >
                <XCircle className="mx-auto text-stone-300 mb-4" size={48} />
                <p className="text-stone-900 font-serif text-lg mb-2">No bookings found</p>
                <p className="text-stone-400 text-sm max-w-xs mx-auto">We couldn't find any events associated with those details. Please check your spelling or contact support.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
