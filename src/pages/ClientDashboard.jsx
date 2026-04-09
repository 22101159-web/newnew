import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, Calendar, Filter, ArrowRight, Clock, CheckCircle2, XCircle, AlertCircle, Phone, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function ClientDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    
    // Simulate network delay
    setTimeout(() => {
      const storedEvents = JSON.parse(localStorage.getItem('emis_events') || '[]');
      const query = searchQuery.trim().toLowerCase();
      
      const results = storedEvents.filter(event => 
        event.clientEmail.toLowerCase() === query || 
        event.clientPhone.toLowerCase() === query ||
        event.trackingNumber.toLowerCase() === query
      );

      // Sort by date descending
      results.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
      setEvents(results);
      setLoading(false);
    }, 500);
  };

  const filteredEvents = events.filter(event => 
    filterType === 'All' || event.eventType === filterType
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <header className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs uppercase tracking-[0.5em] text-accent-gold font-bold">Client Portal</span>
          <h1 className="text-5xl md:text-6xl font-serif italic text-stone-900 mt-2">My Bookings</h1>
          <p className="text-stone-500 max-w-lg mx-auto mt-4 text-sm uppercase tracking-widest">
            Access all your event styling projects in one place.
          </p>
        </motion.div>
      </header>

      {/* Search Section */}
      <section className="max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-0 bg-accent-gold/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
              <input 
                type="text" 
                placeholder="Enter your Email or Phone Number..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-white border border-stone-200 rounded-full text-stone-900 focus:outline-none focus:border-accent-gold shadow-xl transition-all"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="px-10 py-5 bg-stone-900 text-white rounded-full font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Find Bookings'}
            </button>
          </div>
        </form>
      </section>

      <AnimatePresence mode="wait">
        {hasSearched && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {events.length > 0 ? (
              <div className="bg-white rounded-[40px] border border-stone-200 shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-stone-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-stone-50/50">
                  <div>
                    <h2 className="text-2xl font-serif italic text-stone-900">Your Events</h2>
                    <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">Showing {filteredEvents.length} results for {searchQuery}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Filter size={16} className="text-stone-400" />
                    <select 
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-4 py-2 bg-white border border-stone-200 rounded-full text-xs text-stone-900 focus:outline-none focus:border-accent-gold transition-all"
                    >
                      <option value="All">All Event Types</option>
                      <option value="Wedding">Weddings</option>
                      <option value="Birthday">Birthdays</option>
                      <option value="Reunion">Reunions</option>
                      <option value="Corporate Celebration">Corporate Celebrations</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-stone-50 text-[10px] uppercase tracking-widest text-stone-500 border-b border-stone-100">
                        <th className="px-8 py-6 font-bold">Event Date</th>
                        <th className="px-8 py-6 font-bold">Event Type</th>
                        <th className="px-8 py-6 font-bold">Status</th>
                        <th className="px-8 py-6 font-bold">Tracking #</th>
                        <th className="px-8 py-6 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredEvents.map(event => (
                        <tr 
                          key={event.id} 
                          onClick={() => navigate(`/track/${event.id}`)}
                          className="hover:bg-stone-50/80 transition-colors group cursor-pointer"
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <Calendar size={16} className="text-accent-gold" />
                              <span className="text-sm font-bold text-stone-900">{format(new Date(event.eventDate), 'MMMM dd, yyyy')}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-xs uppercase tracking-widest font-bold text-stone-500">{event.eventType}</span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              {event.status === 'Completed' ? <CheckCircle2 size={14} className="text-stone-400" /> :
                               event.status === 'Cancelled' ? <XCircle size={14} className="text-red-400" /> :
                               <Clock size={14} className="text-accent-gold" />}
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                                event.status === 'Completed' ? 'bg-stone-100 text-stone-500 border-stone-200' :
                                event.status === 'Cancelled' ? 'bg-red-50 text-red-500 border-red-100' :
                                'bg-gold-50 text-accent-gold border-gold-100'
                              }`}>
                                {event.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6 font-mono text-xs font-bold text-stone-400 group-hover:text-accent-gold transition-colors">
                            {event.trackingNumber}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-stone-400 group-hover:text-accent-gold transition-all">
                              View Details <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white p-20 rounded-[40px] border border-stone-200 shadow-xl text-center space-y-6">
                <div className="w-20 h-20 bg-stone-50 rounded-3xl flex items-center justify-center text-stone-200 mx-auto border border-stone-100">
                  <AlertCircle size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif italic text-stone-900">No Bookings Found</h3>
                  <p className="text-stone-500 text-sm max-w-xs mx-auto">We couldn't find any events associated with "{searchQuery}". Please check the details and try again.</p>
                </div>
                <button 
                  onClick={() => setHasSearched(false)}
                  className="text-[10px] uppercase tracking-widest font-bold text-accent-gold hover:text-gold-600 transition-all"
                >
                  Try another search
                </button>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Help Section */}
      {!hasSearched && (
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-3 gap-8 pt-12"
        >
          <div className="p-8 bg-stone-50 rounded-[32px] border border-stone-100 space-y-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-accent-gold shadow-sm"><Mail size={18} /></div>
            <h3 className="font-serif italic text-lg">Use your Email</h3>
            <p className="text-xs text-stone-500 leading-relaxed uppercase tracking-widest">Enter the email address you used during the booking process to retrieve your records.</p>
          </div>
          <div className="p-8 bg-stone-50 rounded-[32px] border border-stone-100 space-y-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-accent-gold shadow-sm"><Phone size={18} /></div>
            <h3 className="font-serif italic text-lg">Use your Phone</h3>
            <p className="text-xs text-stone-500 leading-relaxed uppercase tracking-widest">Alternatively, you can use the mobile number provided in your booking form.</p>
          </div>
          <div className="p-8 bg-stone-50 rounded-[32px] border border-stone-100 space-y-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-accent-gold shadow-sm"><AlertCircle size={18} /></div>
            <h3 className="font-serif italic text-lg">Need Help?</h3>
            <p className="text-xs text-stone-500 leading-relaxed uppercase tracking-widest">If you're having trouble finding your booking, please contact our support team directly.</p>
          </div>
        </motion.section>
      )}
    </div>
  );
}
