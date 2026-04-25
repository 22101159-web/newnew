import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MOCK_PRESETS, EVENT_TYPES } from '../constants';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, CheckCircle2, ArrowRight, ArrowLeft, Info } from 'lucide-react';


export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [takenDates, setTakenDates] = useState([]);
  const [presetFilter, setPresetFilter] = useState('All');
  
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    eventDate: '',
    eventType: 'Wedding',
    budget: 50000,
    presetId: searchParams.get('preset') || '',
    notes: ''
  });

  const variants = {
    enter: (dir) => ({
      x: dir > 0 ? 20 : -20,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      x: dir < 0 ? 20 : -20,
      opacity: 0,
    })
  };

  useEffect(() => {
    // If a preset is passed via URL, set the eventType to match that preset
    const presetId = searchParams.get('preset');
    if (presetId) {
      const preset = MOCK_PRESETS.find(p => p.id === presetId);
      if (preset) {
        setFormData(prev => ({ ...prev, eventType: preset.eventType }));
        setPresetFilter(preset.eventType);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchTakenDates = () => {
      const events = JSON.parse(localStorage.getItem('emis_events') || '[]');
      const dates = events
        .filter(e => e.status !== 'Completed' && e.status !== 'Cancelled')
        .map(e => e.eventDate);
      setTakenDates(dates);
    };
    fetchTakenDates();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'budget' ? Number(value) : value }));
    if (name === 'eventType') {
      setPresetFilter(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const events = JSON.parse(localStorage.getItem('emis_events') || '[]');
      const hasConflict = events.some(e => e.eventDate === formData.eventDate && e.status !== 'Cancelled');

      if (hasConflict) {
        alert('CONFLICT: This date has just been booked by someone else. Please select another date.');
        setLoading(false);
        return;
      }

      const sameContactEvents = events.filter(e => 
        (e.clientPhone === formData.clientPhone && e.clientEmail !== formData.clientEmail) ||
        (e.clientEmail === formData.clientEmail && e.clientPhone !== formData.clientPhone)
      );

      if (sameContactEvents.length > 0) {
        alert('The email address or phone number is already registered to a different customer.');
        setLoading(false);
        return;
      }

      const trackingNumber = `GC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const eventId = `event_${Date.now()}`;
      const eventData = {
        id: eventId,
        ...formData,
        trackingNumber,
        status: 'Booked',
        createdAt: new Date().toISOString(),
        statusPhotos: []
      };
      
      events.push(eventData);
      localStorage.setItem('emis_events', JSON.stringify(events));
      
      // Redirect to tracking page
      navigate(`/track/${eventId}?new=true`);
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPresets = MOCK_PRESETS.filter(p => 
    p.price <= formData.budget && 
    (presetFilter === 'All' || p.eventType === presetFilter)
  );

  return (
    <div className="max-w-4xl mx-auto">
      <header className="text-center mb-12">
        <span className="text-xs uppercase tracking-[0.5em] text-accent-gold font-bold">Service Availment</span>
        <h1 className="text-4xl md:text-5xl font-serif italic mt-2 text-stone-900">Book Your Event</h1>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center mt-8 space-x-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-sm ${step >= i ? 'bg-accent-gold text-white' : 'bg-white text-stone-400 border border-stone-200'}`}>
                {i}
              </div>
              {i < 3 && <div className={`w-12 h-px ${step > i ? 'bg-accent-gold' : 'bg-stone-200'}`}></div>}
            </div>
          ))}
        </div>
      </header>

      <div className="bg-white rounded-[40px] border border-stone-100 shadow-2xl overflow-hidden">
        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <Motion.div 
                key="step1"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="p-8 md:p-12 space-y-8"
              >
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Full Name</label>
                    <input 
                      required
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleInputChange}
                      type="text" 
                      placeholder="Juan Dela Cruz"
                      className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-accent-gold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Email Address</label>
                    <input 
                      required
                      name="clientEmail"
                      value={formData.clientEmail}
                      onChange={handleInputChange}
                      type="email" 
                      placeholder="juan@example.com"
                      className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-accent-gold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Phone Number</label>
                    <input 
                      required
                      name="clientPhone"
                      value={formData.clientPhone}
                      onChange={handleInputChange}
                      type="tel" 
                      placeholder="0912 345 6789"
                      className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-accent-gold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Event Type</label>
                    <select 
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:border-accent-gold transition-all appearance-none"
                    >
                      {EVENT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-between">
                  <button 
                    type="button"
                    onClick={() => navigate(-1)}
                    className="text-stone-400 px-6 py-4 rounded-full font-bold uppercase tracking-widest flex items-center gap-2 hover:text-stone-900 transition-all"
                  >
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button 
                    type="button"
                    onClick={() => { 
                      const inputs = document.querySelectorAll('input[required], select[required]');
                      let isValid = true;
                      inputs.forEach(input => {
                        if (!input.checkValidity()) {
                          input.reportValidity();
                          isValid = false;
                        }
                      });
                      if (isValid) {
                        setDirection(1); 
                        setStep(2); 
                      }
                    }}
                    className="bg-stone-900 text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-stone-800 transition-all shadow-lg"
                  >
                    Next Step <ArrowRight size={18} />
                  </button>
                </div>
              </Motion.div>
            )}

            {step === 2 && (
              <Motion.div 
                key="step2"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="p-8 md:p-12 space-y-8"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Your Budget Range</label>
                    <span className="text-2xl font-serif italic text-accent-gold">₱{formData.budget.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min="10000" 
                    max="100000" 
                    step="5000"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-accent-gold"
                  />
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                    <span>₱10,000</span>
                    <span>₱100,000+</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Select a Preset Design</label>
                    <div className="flex flex-wrap gap-2">
                      {EVENT_TYPES.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setPresetFilter(type)}
                          className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all border ${
                            presetFilter === type 
                              ? 'bg-accent-gold text-white border-accent-gold' 
                              : 'bg-white text-stone-400 border-stone-200 hover:border-accent-gold hover:text-accent-gold'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredPresets.map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, presetId: preset.id }))}
                        className={`p-6 rounded-[24px] border text-left transition-all ${formData.presetId === preset.id ? 'bg-accent-gold border-accent-gold text-white shadow-xl scale-[1.02]' : 'bg-white border-stone-200 text-stone-600 hover:border-accent-gold'}`}
                      >
                        <p className="font-serif italic text-xl">{preset.name}</p>
                        <p className={`text-[10px] uppercase tracking-widest mt-2 font-bold ${formData.presetId === preset.id ? 'text-white/80' : 'text-accent-gold'}`}>₱{preset.price.toLocaleString()}</p>
                        <p className={`text-[8px] uppercase tracking-widest mt-1 font-medium ${formData.presetId === preset.id ? 'text-white/60' : 'text-stone-400'}`}>{preset.eventType}</p>
                        {preset.specifications && (
                          <div className="mt-4 space-y-1 border-t border-current/10 pt-3">
                            {preset.specifications.slice(0, 2).map((spec, i) => (
                              <p key={i} className={`text-[8px] uppercase tracking-tight line-clamp-1 ${formData.presetId === preset.id ? 'text-white/70' : 'text-stone-400'}`}>• {spec}</p>
                            ))}
                            {preset.specifications.length > 2 && (
                              <p className={`text-[8px] italic ${formData.presetId === preset.id ? 'text-white/50' : 'text-stone-300'}`}>+ {preset.specifications.length - 2} more details</p>
                            )}
                          </div>
                        )}
                      </button>
                    ))}
                    {filteredPresets.length === 0 && (
                      <div className="col-span-full p-12 bg-stone-50 rounded-[24px] text-center border border-dashed border-stone-200">
                        <p className="text-stone-400 text-xs uppercase tracking-widest font-bold">No presets match your criteria.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <button 
                    type="button"
                    onClick={() => { setDirection(-1); setStep(1); }}
                    className="text-stone-400 px-6 py-4 rounded-full font-bold uppercase tracking-widest flex items-center gap-2 hover:text-stone-900 transition-all"
                  >
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button 
                    type="button"
                    onClick={() => { 
                      if (!formData.presetId) {
                        alert('Please select a preset design.');
                        return;
                      }
                      setDirection(1); 
                      setStep(3); 
                    }}
                    className="bg-stone-900 text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-stone-800 transition-all shadow-lg"
                  >
                    Next Step <ArrowRight size={18} />
                  </button>
                </div>
              </Motion.div>
            )}

            {step === 3 && (
              <Motion.div 
                key="step3"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="p-8 md:p-12 space-y-8"
              >
                <div className="space-y-4">
                  <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Choose Event Date</label>
                  <div className="bg-stone-50 p-8 rounded-[32px] border border-stone-200">
                    <div className="flex items-center gap-2 text-stone-400 mb-6">
                      <Info size={16} />
                      <p className="text-[10px] uppercase tracking-widest font-bold">Dates marked with * are already booked.</p>
                    </div>
                    <input 
                      required
                      type="date" 
                      name="eventDate"
                      min={format(addDays(new Date(), 7), 'yyyy-MM-dd')}
                      value={formData.eventDate}
                      onChange={(e) => {
                        if (takenDates.includes(e.target.value)) {
                          alert('This date is already taken. Please choose another one.');
                          return;
                        }
                        handleInputChange(e);
                      }}
                      className="w-full px-6 py-4 bg-white border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:border-accent-gold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Additional Notes</label>
                  <textarea 
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Any specific requests or instructions?"
                    className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-accent-gold transition-all"
                  ></textarea>
                </div>

                <div className="bg-gold-50 p-8 rounded-[32px] border border-gold-100 space-y-6 shadow-sm">
                  <h3 className="text-2xl font-serif italic text-stone-900 border-b border-gold-200 pb-4">Booking Summary</h3>
                  <div className="grid grid-cols-2 gap-8 text-xs uppercase tracking-widest font-bold">
                    <div>
                      <p className="text-[10px] text-stone-400 mb-1">Client</p>
                      <p className="text-stone-900">{formData.clientName || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 mb-1">Date</p>
                      <p className="text-stone-900">{formData.eventDate || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 mb-1">Preset</p>
                      <p className="text-stone-900">{MOCK_PRESETS.find(p => p.id === formData.presetId)?.name || 'Custom'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 mb-1">Budget</p>
                      <p className="text-accent-gold text-lg">₱{formData.budget.toLocaleString()}</p>
                    </div>
                    <div className="col-span-full border-t border-gold-200 pt-4">
                      <p className="text-[10px] text-stone-400 mb-2">Included Specifications</p>
                      <ul className="grid md:grid-cols-2 gap-x-8 gap-y-1">
                        {MOCK_PRESETS.find(p => p.id === formData.presetId)?.specifications?.map((spec, i) => (
                          <li key={i} className="text-[9px] text-stone-600 flex items-start gap-2">
                            <span className="text-accent-gold">•</span>
                            <span>{spec}</span>
                          </li>
                        )) || <li className="text-[9px] text-stone-400 italic">Custom styling based on notes</li>}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button 
                    type="button"
                    onClick={() => { setDirection(-1); setStep(2); }}
                    className="text-stone-400 px-6 py-4 rounded-full font-bold uppercase tracking-widest flex items-center gap-2 hover:text-stone-900 transition-all"
                  >
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-accent-gold text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-gold-600 transition-all disabled:opacity-50 shadow-xl"
                  >
                    {loading ? 'Processing...' : 'Confirm Booking'} <CheckCircle2 size={18} />
                  </button>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
