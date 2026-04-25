import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Camera, Send, MessageSquare, CheckCircle2, Clock, Image as ImageIcon, Plus, X, ArrowRight, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_STEPS = ["Booked", "Styling Plan", "Preparation", "Live", "Completed"];

export default function StaffDashboard() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [staffName, setStaffName] = useState('Staff');

  useEffect(() => {
    const manualSession = localStorage.getItem('admin_session');
    if (manualSession) {
      try {
        const sessionData = JSON.parse(manualSession);
        setStaffName(sessionData.name || 'Staff');
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const fetchEvents = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      fetch('/api/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEvents(data);
          // Auto-select first event if none selected
          if (data.length > 0 && !selectedEvent) {
            setSelectedEvent(data[0]);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching events:', err);
        setLoading(false);
      });
    };

    fetchEvents();
    
    // Polling for updates
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, [selectedEvent?.id]);

  useEffect(() => {
    if (!selectedEvent) return;

    const loadMessages = () => {
      fetch(`/api/messages/${selectedEvent.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMessages(data);
        }
      })
      .catch(err => console.error('Error fetching messages:', err));
    };

    loadMessages();
    
    // Polling for messages
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedEvent?.id]);

  const handleStatusUpdate = (newStatus) => {
    const token = localStorage.getItem('token');
    if (!token || !selectedEvent) return;

    fetch(`/api/events/${selectedEvent.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    })
    .then(res => res.json())
    .then(updatedEvent => {
      setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
      setSelectedEvent(updatedEvent);
    })
    .catch(err => alert('Failed to update status'));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedEvent) return;

    setUploading(true);
    const token = localStorage.getItem('token');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'emis_event_styling_system');
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dvjurrrd8'}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      const data = await response.json();
      
      if (data.secure_url) {
        const updatedPhotos = [...(selectedEvent.statusPhotos || []), data.secure_url];
        
        const updateRes = await fetch(`/api/events/${selectedEvent.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ statusPhotos: updatedPhotos })
        });

        if (updateRes.ok) {
          const updatedEvent = await updateRes.json();
          setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
          setSelectedEvent(updatedEvent);
        } else {
          throw new Error('Failed to update event record');
        }
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload photo: ${error.message}. Please check your internet connection or Cloudinary configuration.`);
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedEvent) return;

    const newMsg = {
      eventId: selectedEvent.id,
      text: newMessage,
      senderName: staffName,
      senderRole: 'staff'
    };
    
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMsg)
    })
    .then(res => res.json())
    .then(data => {
      setMessages(prev => [...prev, data]);
      setNewMessage('');
    })
    .catch(err => console.error('Error sending message:', err));
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div></div>;

  return (
    <div className="grid lg:grid-cols-12 gap-8 h-[calc(100vh-160px)] pb-20">
      {/* Sidebar: Event List */}
      <aside className="lg:col-span-3 bg-white rounded-[40px] border border-stone-200 shadow-xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-stone-100 bg-stone-50/50">
          <h2 className="text-xl font-serif italic text-stone-900">Active Events</h2>
          <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">{events.length} Total Bookings</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {events.map(event => (
            <button
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className={`w-full p-4 rounded-3xl text-left transition-all ${selectedEvent?.id === event.id ? 'bg-accent-gold text-white shadow-lg' : 'hover:bg-stone-50 text-stone-900 border border-transparent hover:border-stone-200'}`}
            >
              <p className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${selectedEvent?.id === event.id ? 'text-white/80' : 'text-stone-400'}`}>{event.trackingNumber}</p>
              <p className="font-serif italic text-lg leading-tight">{event.clientName}</p>
              <div className="flex justify-between items-center mt-3">
                <span className={`text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border ${selectedEvent?.id === event.id ? 'border-white/20 bg-white/10' : 'border-stone-200 bg-stone-50 text-stone-500'}`}>
                  {event.status}
                </span>
                <span className={`text-[8px] ${selectedEvent?.id === event.id ? 'text-white/80' : 'text-stone-400'}`}>
                  {event.eventDate ? format(new Date(event.eventDate), 'MMM dd') : 'No Date'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content: Selected Event Details & Controls */}
      <main className="lg:col-span-6 space-y-8 overflow-y-auto pr-4 custom-scrollbar">
        {selectedEvent ? (
          <>
            <section className="bg-white p-10 rounded-[40px] border border-stone-200 shadow-xl space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-stone-400">Selected Event</span>
                  <h2 className="text-4xl font-serif italic text-stone-900">{selectedEvent.clientName}</h2>
                  <p className="text-xs uppercase tracking-widest text-stone-500">
                    {selectedEvent.eventType} • {selectedEvent.eventDate ? format(new Date(selectedEvent.eventDate), 'MMMM dd, yyyy') : 'No Date'}
                  </p>
                </div>
                <Link to={`/track/${selectedEvent.id}`} target="_blank" className="text-[10px] uppercase tracking-widest font-bold text-stone-400 hover:text-accent-gold flex items-center gap-1 transition-all">
                  Public Link <ArrowRight size={12} />
                </Link>
              </div>

              {/* Status Update Controls */}
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Update Event Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_STEPS.map(step => (
                    <button
                      key={step}
                      onClick={() => handleStatusUpdate(step)}
                      className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${selectedEvent.status === step ? 'bg-accent-gold text-white border-accent-gold shadow-md' : 'bg-white text-stone-600 border-stone-200 hover:border-accent-gold hover:text-accent-gold'}`}
                    >
                      {step}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Photo Management */}
            <section className="bg-white p-10 rounded-[40px] border border-stone-200 shadow-xl space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-serif italic flex items-center gap-3 text-stone-900">
                  <Camera size={20} className="text-accent-gold" /> Status Photos
                </h3>
                <label className="cursor-pointer bg-accent-gold text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gold-600 transition-all flex items-center gap-2 shadow-lg">
                  <Plus size={14} /> {uploading ? 'Uploading...' : 'Add Photo'}
                  <input type="file" className="hidden" onChange={handlePhotoUpload} disabled={uploading} accept="image/*" />
                </label>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {selectedEvent.statusPhotos?.map((photo, i) => (
                  <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-stone-100 relative group">
                    <img src={photo} alt="Status" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="text-white hover:text-red-400 transition-colors">
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ))}
                {(!selectedEvent.statusPhotos || selectedEvent.statusPhotos.length === 0) && (
                  <div className="col-span-full py-12 bg-stone-50 rounded-3xl border border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 space-y-2">
                    <ImageIcon size={32} />
                    <p className="text-[10px] uppercase tracking-widest">No photos uploaded yet</p>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4 bg-stone-50 rounded-[40px] border border-dashed border-stone-200">
            <LayoutDashboard size={64} strokeWidth={1} className="text-stone-200" />
            <p className="uppercase tracking-widest text-sm">Select an event to manage</p>
          </div>
        )}
      </main>

      {/* Right Sidebar: Chat */}
      <aside className="lg:col-span-3 bg-white rounded-[40px] border border-stone-200 shadow-xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex items-center gap-3">
          <div className="w-10 h-10 bg-gold-50 rounded-xl flex items-center justify-center text-accent-gold border border-gold-100">
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 className="text-lg font-serif italic text-stone-900">Chat Hub</h3>
            <p className="text-[8px] uppercase tracking-widest text-accent-gold font-bold">Client: {selectedEvent?.clientName || '---'}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50/30 custom-scrollbar">
          {messages.map((msg, i) => {
            const isMe = msg.senderRole === 'staff' || msg.senderRole === 'admin';
            return (
              <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] p-3 rounded-2xl text-xs ${isMe ? 'bg-accent-gold text-white rounded-tr-none font-medium shadow-sm' : 'bg-white border border-stone-200 text-stone-900 rounded-tl-none shadow-sm'}`}>
                  <p>{msg.text}</p>
                </div>
                <span className="text-[7px] uppercase tracking-widest font-bold text-stone-400 mt-1 px-1">
                  {msg.senderName} • {msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm') : '...'}
                </span>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-stone-100">
          <div className="relative">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Reply to client..." 
              className="w-full pl-4 pr-12 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-accent-gold text-stone-900 placeholder:text-stone-400 text-xs"
            />
            <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-accent-gold text-white rounded-lg flex items-center justify-center hover:bg-gold-600 transition-all">
              <Send size={14} />
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
