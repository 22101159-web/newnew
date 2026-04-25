import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { MOCK_PRESETS } from '../constants';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Send, Camera, CheckCircle2, Clock, Calendar, MapPin, MessageSquare, Image as ImageIcon, X } from 'lucide-react';

const STATUS_STEPS = ["Booked", "Styling Plan", "Preparation", "Live", "Completed"];

export default function TrackingPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [event, setEvent] = useState(null);
  const [preset, setPreset] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewBookingModal, setShowNewBookingModal] = useState(searchParams.get('new') === 'true');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareData, setShareData] = useState({
    name: '',
    description: '',
    imageUrl: ''
  });
  const chatEndRef = useRef(null);

  const handleOpenShareModal = () => {
    if (event && !shareData.name) {
      setShareData({
        name: `${event.eventType} by ${event.clientName}`,
        description: `A beautiful ${event.eventType.toLowerCase()} styled with a budget of ₱${event.budget.toLocaleString()}.`,
        imageUrl: event.statusPhotos?.[0] || ''
      });
    }
    setIsShareModalOpen(true);
  };

  const handleShareToCommunity = async (e) => {
    e.preventDefault();
    if (!shareData.imageUrl) {
      alert('Please select a photo to share.');
      return;
    }

    setShareLoading(true);
    try {
      const communityPresets = JSON.parse(localStorage.getItem('emis_community_presets') || '[]');
      const newEntry = {
        id: `preset_${Date.now()}`,
        name: shareData.name,
        description: shareData.description,
        eventType: event.eventType,
        price: Number(event.budget),
        imageUrl: shareData.imageUrl,
        isClientShared: true,
        sharedBy: event.clientName,
        createdAt: new Date().toISOString(),
        isArchived: false,
        originalEventId: event.id
      };
      
      communityPresets.push(newEntry);
      localStorage.setItem('emis_community_presets', JSON.stringify(communityPresets));
      
      setShareSuccess(true);
      setTimeout(() => {
        setIsShareModalOpen(false);
        setShareSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Share failed:', error);
      alert('Failed to share design.');
    } finally {
      setShareLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    const loadEvent = () => {
      const events = JSON.parse(localStorage.getItem('emis_events') || '[]');
      // Search by ID or tracking number
      const foundEvent = events.find(e => e.id === id || e.trackingNumber === id);
      
      if (foundEvent) {
        setEvent(foundEvent);
        
        // Load messages
        const allMessages = JSON.parse(localStorage.getItem('emis_messages') || '{}');
        setMessages(allMessages[foundEvent.id] || []);
        
        // Load preset
        if (foundEvent.presetId) {
          const mockPreset = MOCK_PRESETS.find(p => p.id === foundEvent.presetId);
          if (mockPreset) {
            setPreset(mockPreset);
          } else {
            const communityPresets = JSON.parse(localStorage.getItem('emis_community_presets') || '[]');
            const communityPreset = communityPresets.find(p => p.id === foundEvent.presetId);
            setPreset(communityPreset || null);
          }
        }
      } else {
        setEvent(null);
      }
      setLoading(false);
    };

    loadEvent();
    
    // Polling for local storage changes (simulating real-time)
    const interval = setInterval(loadEvent, 2000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      const parent = chatEndRef.current.parentElement;
      if (parent) {
        // Only scroll the chat container, avoiding window scroll
        parent.scrollTo({
          top: parent.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages.length]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !event) return;

    const allMessages = JSON.parse(localStorage.getItem('emis_messages') || '{}');
    const eventMessages = allMessages[event.id] || [];
    
    const newMsg = {
      id: `msg_${Date.now()}`,
      text: newMessage,
      senderName: event.clientName,
      senderRole: 'client',
      timestamp: new Date().toISOString()
    };
    
    eventMessages.push(newMsg);
    allMessages[event.id] = eventMessages;
    localStorage.setItem('emis_messages', JSON.stringify(allMessages));
    
    setMessages(eventMessages);
    setNewMessage('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
          <X size={40} />
        </div>
        <h1 className="text-3xl font-serif italic">Tracking ID Not Found</h1>
        <p className="text-stone-500 uppercase tracking-widest text-sm">Please check your tracking number and try again.</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-stone-900 text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-stone-800 transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const currentStatusIndex = STATUS_STEPS.indexOf(event.status);

  return (
    <div className="space-y-12 pb-20">
      {/* New Booking Modal */}
      <AnimatePresence>
        {showNewBookingModal && (
          <Motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-md"
          >
            <Motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white border border-stone-100 rounded-[40px] p-12 max-w-lg w-full text-center space-y-8 shadow-2xl"
            >
              <div className="w-24 h-24 bg-gold-50 text-accent-gold border border-gold-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-serif italic text-stone-900">Booking Confirmed!</h2>
                <p className="text-stone-400 uppercase tracking-widest text-[10px] font-bold">Your event is now in our system.</p>
              </div>
              <div className="bg-stone-50 p-8 rounded-[32px] border border-stone-100 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Your Tracking Number</p>
                <p className="text-3xl font-mono font-bold tracking-tighter text-accent-gold">{event.trackingNumber}</p>
                <p className="text-[10px] text-stone-400 italic">Save this number to track your event later.</p>
              </div>
              <button 
                onClick={() => setShowNewBookingModal(false)}
                className="w-full bg-stone-900 text-white py-5 rounded-full font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg"
              >
                View Tracking Page
              </button>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.5em] text-accent-gold font-bold">Event Tracker</span>
          <h1 className="text-4xl md:text-5xl font-serif italic text-stone-900">{event.eventType} for {event.clientName}</h1>
          <div className="flex items-center gap-4 text-xs uppercase tracking-widest text-stone-400 font-bold">
            <span className="flex items-center gap-1"><Clock size={14} /> {format(new Date(event.createdAt), 'MMM dd, yyyy')}</span>
            <span className="h-3 w-px bg-stone-200"></span>
            <span className="flex items-center gap-1 font-mono font-bold text-accent-gold">{event.trackingNumber}</span>
          </div>
        </div>
        <div className="bg-gold-50 text-accent-gold px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gold-100 flex items-center gap-2 shadow-sm">
          <div className="w-2 h-2 bg-accent-gold rounded-full animate-pulse"></div>
          Current Status: {event.status}
        </div>
      </header>

      {/* Shopee-Style Progress Bar */}
      <section className="bg-white p-8 md:p-12 rounded-[40px] border border-stone-100 shadow-xl overflow-x-auto">
        <div className="min-w-[800px] relative flex justify-between">
          {/* Background Line */}
          <div className="absolute top-5 left-0 w-full h-1 bg-stone-100 z-0"></div>
          {/* Active Line */}
          <div 
            className="absolute top-5 left-0 h-1 bg-accent-gold z-0 transition-all duration-1000"
            style={{ width: `${(currentStatusIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
          ></div>

          {STATUS_STEPS.map((step, index) => {
            const isCompleted = index < currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            return (
              <div key={step} className="relative z-10 flex flex-col items-center space-y-4 w-32">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm ${isCompleted ? 'bg-accent-gold text-white' : isCurrent ? 'bg-white border-4 border-accent-gold text-accent-gold' : 'bg-white border-4 border-stone-100 text-stone-300'}`}>
                  {isCompleted ? <CheckCircle2 size={20} /> : <div className="text-xs font-bold">{index + 1}</div>}
                </div>
                <div className="text-center">
                  <p className={`text-[10px] uppercase tracking-widest font-bold ${isCurrent ? 'text-accent-gold' : 'text-stone-400'}`}>{step}</p>
                  {isCurrent && <p className="text-[8px] uppercase tracking-widest text-accent-gold mt-1 animate-pulse font-bold">In Progress</p>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Left Column: Details & Photos */}
        <div className="lg:col-span-2 space-y-12">
          {/* Photos Section */}
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-serif italic flex items-center gap-3 text-stone-900">
                <Camera size={24} className="text-accent-gold" /> Status Photos
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{event.statusPhotos?.length || 0} Photos Shared</span>
                {event.statusPhotos?.length > 0 && event.status === 'Completed' && (
                  <button 
                    onClick={handleOpenShareModal}
                    className="bg-stone-900 text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg flex items-center gap-2"
                  >
                    <Send size={12} /> Share to Community
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {event.statusPhotos?.map((photo, i) => (
                <div key={i} className="aspect-square rounded-[32px] overflow-hidden border border-stone-100 group cursor-pointer relative shadow-sm hover:shadow-xl transition-all">
                  <img 
                    src={photo} 
                    alt={`Status ${i}`} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImageIcon className="text-white" size={24} />
                  </div>
                </div>
              ))}
              {(!event.statusPhotos || event.statusPhotos.length === 0) && (
                <div className="col-span-full py-20 bg-stone-50 rounded-[32px] border border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-300 space-y-4">
                  <ImageIcon size={40} />
                  <p className="text-xs uppercase tracking-widest font-bold">No status photos shared yet.</p>
                </div>
              )}
            </div>
          </section>

          {/* Event Details */}
          <section className="bg-white p-10 rounded-[40px] border border-stone-100 grid md:grid-cols-2 gap-12 shadow-xl">
            <div className="space-y-8">
              <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-accent-gold border-b border-stone-100 pb-3">Event Information</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-accent-gold">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Date</p>
                    <p className="font-serif italic text-xl text-stone-900">{format(new Date(event.eventDate), 'MMMM dd, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-accent-gold">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Type</p>
                    <p className="font-serif italic text-xl text-stone-900">{event.eventType}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-8">
              <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-accent-gold border-b border-stone-100 pb-3">Styling Details</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Preset Design</p>
                  <p className="font-serif italic text-xl text-stone-900">{preset ? preset.name : (event.presetId ? 'Loading Preset...' : 'Custom Design')}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Budget Allocation</p>
                  <p className="font-serif italic text-xl text-accent-gold">₱{event.budget.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Communication Hub */}
        <div className="lg:col-span-1">
          <section className="bg-white rounded-[40px] border border-stone-100 shadow-2xl flex flex-col h-[700px] overflow-hidden sticky top-32">
            <div className="p-8 border-b border-stone-50 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent-gold rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-serif italic text-stone-900">Coordination</h2>
                  <p className="text-[8px] uppercase tracking-widest text-accent-gold font-bold">Real-time Hub</p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-stone-50/30 custom-scrollbar">
              {messages.map((msg, i) => {
                const isMe = msg.senderRole === 'client';
                return (
                  <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-5 rounded-[24px] text-sm shadow-sm ${isMe ? 'bg-accent-gold text-white rounded-tr-none font-medium' : 'bg-white border border-stone-100 text-stone-700 rounded-tl-none'}`}>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2 px-2">
                      <span className="text-[8px] uppercase tracking-widest font-bold text-stone-400">{msg.senderName}</span>
                      <span className="text-[8px] text-stone-200">•</span>
                      <span className="text-[8px] text-stone-400 font-medium">{msg.timestamp ? format(msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp), 'HH:mm') : 'Just now'}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-stone-50">
              <div className="relative">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..." 
                  className="w-full pl-6 pr-16 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-accent-gold transition-all text-sm"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-stone-900 text-white rounded-xl flex items-center justify-center hover:bg-stone-800 transition-all shadow-lg"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[8px] text-center text-stone-300 mt-4 uppercase tracking-widest font-bold">
                Messages are recorded for coordination compliance
              </p>
            </form>
          </section>
        </div>
      </div>
      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <Motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-md"
          >
            <Motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white border border-stone-100 rounded-[40px] p-10 max-w-xl w-full shadow-2xl relative"
            >
              <button onClick={() => setIsShareModalOpen(false)} className="absolute top-8 right-8 text-stone-400 hover:text-stone-900 transition-colors">
                <X size={24} />
              </button>
              
              <div className="mb-8">
                <span className="text-xs uppercase tracking-[0.5em] text-accent-gold font-bold">Community Gallery</span>
                <h2 className="text-3xl font-serif italic text-stone-900">Share Your Styled Event</h2>
                <p className="text-stone-500 text-xs uppercase tracking-widest mt-2">Let others be inspired by your event design</p>
              </div>

              {shareSuccess ? (
                <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-100">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-serif italic text-stone-900">Thank You for Sharing!</h3>
                  <p className="text-stone-500 uppercase tracking-widest text-[10px] font-bold">Your design has been added to the community presets.</p>
                </div>
              ) : (
                <form onSubmit={handleShareToCommunity} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-stone-500">Design Name</label>
                    <input 
                      required
                      type="text" 
                      value={shareData.name}
                      onChange={(e) => setShareData({...shareData, name: e.target.value})}
                      className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:border-accent-gold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-stone-500">Description</label>
                    <textarea 
                      required
                      rows={3}
                      value={shareData.description}
                      onChange={(e) => setShareData({...shareData, description: e.target.value})}
                      className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:border-accent-gold transition-all resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-stone-500">Select Featured Photo</label>
                    <div className="grid grid-cols-4 gap-3">
                      {event.statusPhotos?.map((photo, i) => (
                        <button 
                          key={i}
                          type="button"
                          onClick={() => setShareData({...shareData, imageUrl: photo})}
                          className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${shareData.imageUrl === photo ? 'border-accent-gold scale-95 shadow-inner' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                          <img src={photo} alt={`Option ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    disabled={shareLoading}
                    type="submit"
                    className="w-full bg-stone-900 text-white py-5 rounded-full font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {shareLoading ? 'Sharing Design...' : 'Post to Community'}
                    {!shareLoading && <Send size={18} />}
                  </button>
                </form>
              )}
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
