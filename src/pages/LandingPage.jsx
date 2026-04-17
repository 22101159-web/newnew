import React from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'motion/react';
import { ArrowRight, Star, Calendar, MessageSquare } from 'lucide-react';

import haciendaRustic2Img from '../assets/images/hacienda-rustic-2.jpeg';
import modernPinas2Img from '../assets/images/modern-pinas-2.jpg';

export default function LandingPage() {
  return (
    <div className="space-y-32 pb-20">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden rounded-[40px] shadow-2xl">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop" 
            alt="Event Styling" 
            className="w-full h-full object-cover brightness-75"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/40 to-stone-900/60"></div>
        </div>
        <div className="relative z-10 text-center text-white px-4 max-w-4xl">
          <Motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-8xl font-serif italic mb-6 drop-shadow-lg"
          >
            Timeless Elegance for Your Special Moments
          </Motion.h1>
          <Motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl uppercase tracking-[0.4em] mb-10 opacity-90 font-medium"
          >
            Gabrielle Custodio Event Styling
          </Motion.p>
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col md:flex-row items-center justify-center gap-4"
          >
            <Link to="/book" className="bg-accent-gold text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-gold-600 transition-all flex items-center gap-2 shadow-xl">
              Start Booking <ArrowRight size={18} />
            </Link>
            <Link to="/gallery" className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-white/20 transition-all">
              View Gallery
            </Link>
          </Motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-12">
        <div className="space-y-6 p-8 rounded-[32px] bg-white border border-stone-100 shadow-sm hover:shadow-md transition-all">
          <div className="w-16 h-16 bg-gold-50 border border-gold-100 rounded-2xl flex items-center justify-center text-accent-gold">
            <Calendar size={32} />
          </div>
          <h3 className="text-2xl font-serif italic text-stone-900">Seamless Booking</h3>
          <p className="text-stone-500 leading-relaxed">
            Our digital intake form and conflict-prevention calendar ensure your date is secured without any scheduling errors.
          </p>
        </div>
        <div className="space-y-6 p-8 rounded-[32px] bg-white border border-stone-100 shadow-sm hover:shadow-md transition-all">
          <div className="w-16 h-16 bg-gold-50 border border-gold-100 rounded-2xl flex items-center justify-center text-accent-gold">
            <Star size={32} />
          </div>
          <h3 className="text-2xl font-serif italic text-stone-900">Budget-Based Selection</h3>
          <p className="text-stone-500 leading-relaxed">
            Filter our premium preset designs based on your budget range to find the perfect styling for your event.
          </p>
        </div>
        <div className="space-y-6 p-8 rounded-[32px] bg-white border border-stone-100 shadow-sm hover:shadow-md transition-all">
          <div className="w-16 h-16 bg-gold-50 border border-gold-100 rounded-2xl flex items-center justify-center text-accent-gold">
            <MessageSquare size={32} />
          </div>
          <h3 className="text-2xl font-serif italic text-stone-900">Real-Time Tracking</h3>
          <p className="text-stone-500 leading-relaxed">
            Stay updated with our Shopee-style progress tracker and centralized communication hub for all your event needs.
          </p>
        </div>
      </section>

      {/* Tracking Search */}
      <section className="bg-white border border-gold-100 rounded-[40px] p-12 md:p-20 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-accent-gold"></div>
        <h2 className="text-4xl md:text-6xl font-serif italic mb-8 text-stone-900">Track Your Event</h2>
        <p className="text-stone-500 uppercase tracking-widest mb-12 max-w-2xl mx-auto text-sm font-medium">
          Enter your tracking number to see real-time updates, photos, and chat with our stylists.
        </p>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const id = e.target.trackingId.value;
            if (id) window.location.href = `/track/${id}`;
          }}
          className="max-w-xl mx-auto flex flex-col md:flex-row gap-4"
        >
          <input 
            name="trackingId"
            type="text" 
            placeholder="Enter Tracking Number (e.g. GC-12345)" 
            className="flex-1 bg-stone-50 border border-stone-200 rounded-full px-8 py-4 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-accent-gold transition-all"
            required
          />
          <button type="submit" className="bg-stone-900 text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg">
            Track Now
          </button>
        </form>
      </section>

      {/* Services Overview */}
      <section className="space-y-16">
        <div className="text-center">
          <span className="text-xs uppercase tracking-[0.5em] text-accent-gold font-bold">Our Services</span>
          <h2 className="text-4xl md:text-6xl font-serif italic mt-4 text-stone-900">Crafting Unforgettable Experiences</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="group relative h-[500px] overflow-hidden rounded-[40px] shadow-xl">
            <img 
              src={haciendaRustic2Img} 
              alt="Weddings" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/20 to-transparent flex flex-col justify-end p-12">
              <h3 className="text-3xl text-white font-serif italic mb-2">Weddings</h3>
              <p className="text-gold-200 uppercase tracking-widest text-sm font-bold">Elegant & Romantic Styling</p>
            </div>
          </div>
          <div className="group relative h-[500px] overflow-hidden rounded-[40px] shadow-xl">
            <img 
              src={modernPinas2Img} 
              alt="Corporate" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/20 to-transparent flex flex-col justify-end p-12">
              <h3 className="text-3xl text-white font-serif italic mb-2">Corporate Events</h3>
              <p className="text-gold-200 uppercase tracking-widest text-sm font-bold">Professional & Sophisticated</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
