import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  LayoutDashboard, Users, Calendar as CalendarIcon, TrendingUp, Search, Filter, 
  ArrowRight, CheckCircle2, Clock, AlertCircle, Plus, X, Trash2, ChevronLeft, Archive
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { MOCK_PRESETS, EVENT_TYPES } from '../constants';

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'calendar';
  const setActiveTab = (tab) => setSearchParams({ tab }, { replace: true });

  const [adminName] = useState(() => {
    const manualSession = localStorage.getItem('admin_session');
    if (manualSession) {
      try {
        const sessionData = JSON.parse(manualSession);
        return sessionData.name || 'Admin';
      } catch {
        return 'Admin';
      }
    }
    return 'Admin';
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [presets, setPresets] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deletePresetConfirmId, setDeletePresetConfirmId] = useState(null);
  const [deleteUserConfirmId, setDeleteUserConfirmId] = useState(null);
  const [filterType, setFilterType] = useState('All');
  const [selectedPresetType, setSelectedPresetType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Form state for new/edit booking
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    eventDate: '',
    eventType: 'Wedding',
    budget: 50000,
    status: 'Booked',
    notes: ''
  });

  // Form state for user
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff'
  });

  // Form state for preset
  const [presetData, setPresetData] = useState({
    name: '',
    price: 15000,
    description: '',
    imageUrl: '',
    eventType: 'Wedding',
    isArchived: false,
    specifications: []
  });

  useEffect(() => {
    const loadData = () => {
      // Load events
      const storedEvents = JSON.parse(localStorage.getItem('emis_events') || '[]');
      setEvents(storedEvents);

      // Load presets
      const communityPresets = JSON.parse(localStorage.getItem('emis_community_presets') || '[]');
      const communityIds = communityPresets.map(p => p.id);
      
      const allPresets = [
        ...MOCK_PRESETS.filter(m => !communityIds.includes(m.id)).map(m => ({ ...m, isArchived: false, isClientShared: false })),
        ...communityPresets
      ];
      setPresets(allPresets);

      // Load users from API
      const sessionData = JSON.parse(localStorage.getItem('admin_session') || '{}');
      if (sessionData.token) {
        fetch('/api/users/', {
          headers: { 'Authorization': `Bearer ${sessionData.token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            // Map the API data structure back to frontend expectations
            const mappedUsers = data.map(u => ({
              id: u.id,
              name: u.email || u.username,
              email: u.username,
              role: u.role
            }));
            setUsers(mappedUsers);
          }
        })
        .catch(console.error);
      }

      setLoading(false);
    };

    loadData();
    
    // Polling for local storage changes
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  const stats = {
    total: events.length,
    active: events.filter(e => e.status !== 'Completed' && e.status !== 'Cancelled').length,
    revenue: events.reduce((acc, e) => acc + Number(e.budget || 0), 0),
    pending: events.filter(e => e.status === 'Booked').length
  };

  const handleOpenModal = (event = null) => {
    if (event) {
      setSelectedEvent(event);
      setFormData({
        clientName: event.clientName,
        clientEmail: event.clientEmail,
        clientPhone: event.clientPhone,
        eventDate: event.eventDate,
        eventType: event.eventType,
        budget: Number(event.budget),
        status: event.status,
        notes: event.notes || ''
      });
    } else {
      setSelectedEvent(null);
      setFormData({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        eventDate: '',
        eventType: 'Wedding',
        budget: 50000,
        status: 'Booked',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveBooking = (e) => {
    e.preventDefault();
    
    // Check for conflicts (Only ONE event per day)
    const hasConflict = events.some(e => 
      e.eventDate === formData.eventDate && 
      e.id !== selectedEvent?.id &&
      e.status !== 'Cancelled'
    );

    if (hasConflict) {
      alert('CONFLICT: This date is already booked by another client. Only one event per day is allowed.');
      return;
    }

    const sameContactEvents = events.filter(e => 
      e.id !== selectedEvent?.id && (
        (e.clientPhone === formData.clientPhone && e.clientEmail !== formData.clientEmail) ||
        (e.clientEmail === formData.clientEmail && e.clientPhone !== formData.clientPhone)
      )
    );

    if (sameContactEvents.length > 0) {
      alert('The email address or phone number is already registered to a different customer.');
      return;
    }

    const storedEvents = JSON.parse(localStorage.getItem('emis_events') || '[]');
    let updatedEvents;

    if (selectedEvent) {
      updatedEvents = storedEvents.map(e => e.id === selectedEvent.id ? { ...e, ...formData } : e);
    } else {
      const trackingNumber = `GC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const newEvent = {
        ...formData,
        id: `event_${Date.now()}`,
        trackingNumber,
        createdAt: new Date().toISOString(),
        statusPhotos: []
      };
      updatedEvents = [newEvent, ...storedEvents];
    }
    
    localStorage.setItem('emis_events', JSON.stringify(updatedEvents));
    setEvents(updatedEvents);
    setIsModalOpen(false);
  };

  const handleDeleteBooking = (id) => {
    const storedEvents = JSON.parse(localStorage.getItem('emis_events') || '[]');
    const updatedEvents = storedEvents.filter(e => e.id !== id);
    localStorage.setItem('emis_events', JSON.stringify(updatedEvents));
    setEvents(updatedEvents);
    setIsModalOpen(false);
    setSelectedEvent(null);
    setDeleteConfirmId(null);
  };

  const handleCompleteBooking = (id) => {
    const storedEvents = JSON.parse(localStorage.getItem('emis_events') || '[]');
    const updatedEvents = storedEvents.map(e => e.id === id ? { ...e, status: 'Completed' } : e);
    localStorage.setItem('emis_events', JSON.stringify(updatedEvents));
    setEvents(updatedEvents);
  };

  const handleOpenPresetModal = (preset = null) => {
    if (preset) {
      setSelectedPreset(preset);
      setPresetData({
        name: preset.name,
        price: preset.price,
        description: preset.description,
        imageUrl: preset.imageUrl,
        eventType: preset.eventType,
        isArchived: preset.isArchived || false,
        specifications: preset.specifications || []
      });
    } else {
      setSelectedPreset(null);
      setPresetData({
        name: '',
        price: 15000,
        description: '',
        imageUrl: '',
        eventType: 'Wedding',
        isArchived: false,
        specifications: []
      });
    }
    setIsPresetModalOpen(true);
  };

  const handleSavePreset = (e) => {
    e.preventDefault();
    const storedPresets = JSON.parse(localStorage.getItem('emis_community_presets') || '[]');
    let updatedPresets;

    if (selectedPreset) {
      const exists = storedPresets.some(p => p.id === selectedPreset.id);
      if (exists) {
        updatedPresets = storedPresets.map(p => p.id === selectedPreset.id ? { ...p, ...presetData } : p);
      } else {
        // It's a MOCK_PRESET being edited for the first time, save it to localStorage
        const newPresetEntry = {
          ...selectedPreset,
          ...presetData,
          isClientShared: false // Keep it as a signature preset
        };
        updatedPresets = [...storedPresets, newPresetEntry];
      }
    } else {
      const newPreset = {
        ...presetData,
        id: `preset_${Date.now()}`,
        createdAt: new Date().toISOString(),
        isClientShared: false // Admin created presets are signature presets
      };
      updatedPresets = [newPreset, ...storedPresets];
    }
    
    localStorage.setItem('emis_community_presets', JSON.stringify(updatedPresets));
    setPresets(updatedPresets);
    setIsPresetModalOpen(false);
  };

  const handleArchivePreset = (preset) => {
    const storedPresets = JSON.parse(localStorage.getItem('emis_community_presets') || '[]');
    const exists = storedPresets.some(p => p.id === preset.id);
    
    let updatedPresets;
    if (exists) {
      updatedPresets = storedPresets.map(p => p.id === preset.id ? { ...p, isArchived: !p.isArchived } : p);
    } else {
      // It's a MOCK_PRESET being archived for the first time
      const newPresetEntry = {
        ...preset,
        isArchived: !preset.isArchived,
        isClientShared: false
      };
      updatedPresets = [...storedPresets, newPresetEntry];
    }
    
    localStorage.setItem('emis_community_presets', JSON.stringify(updatedPresets));
    setPresets(updatedPresets);
  };

  const handleDeletePreset = (id) => {
    const storedPresets = JSON.parse(localStorage.getItem('emis_community_presets') || '[]');
    const updatedPresets = storedPresets.filter(p => p.id !== id);
    localStorage.setItem('emis_community_presets', JSON.stringify(updatedPresets));
    setPresets(updatedPresets);
    setDeletePresetConfirmId(null);
  };

  const handleOpenUserModal = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setUserData({
        name: user.name,
        email: user.email,
        password: user.password || '',
        role: user.role
      });
    } else {
      setSelectedUser(null);
      setUserData({
        name: '',
        email: '',
        password: '',
        role: 'staff'
      });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    const sessionData = JSON.parse(localStorage.getItem('admin_session') || '{}');
    if (!sessionData.token) {
      alert("No authorization token found. Please log in again.");
      return;
    }

    const payload = {
      username: userData.email.trim(), // Trim spaces in username
      email: userData.name.trim(),     // Storing the 'Full Name' in the email field
      role: userData.role
    };

    if (userData.password) {
      payload.password = userData.password;
    }

    try {
      if (selectedUser) {
        const res = await fetch(`/api/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to update user. Please ensure the username is unique.');
      } else {
        if (!payload.password) throw new Error('Password is required for new users.');
        const res = await fetch('/api/users/', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || 'Failed to create user');
        }
      }
      setIsUserModalOpen(false);
      
      // Refresh users from API
      const refreshRes = await fetch('/api/users/', {
        headers: { 'Authorization': `Bearer ${sessionData.token}` }
      });
      const data = await refreshRes.json();
      if (Array.isArray(data)) {
        setUsers(data.map(u => ({ id: u.id, name: u.email || u.username, email: u.username, role: u.role })));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    const sessionData = JSON.parse(localStorage.getItem('admin_session') || '{}');
    if (!sessionData.token) return;

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionData.token}` }
      });
      if (!res.ok) throw new Error('Failed to delete user');

      setUsers(users.filter(u => u.id !== id));
      setDeleteUserConfirmId(null);
      setIsUserModalOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesType = filterType === 'All' || event.eventType === filterType;
    const matchesSearch = event.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          event.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const calendarEvents = events.map(event => ({
    id: event.id,
    title: `${event.clientName} (${event.eventType})`,
    start: event.eventDate,
    allDay: true,
    backgroundColor: event.status === 'Completed' ? '#a8a29e' : 
                     event.status === 'Cancelled' ? '#ef4444' : 
                     event.status === 'Booked' ? '#D4AF37' : '#713f12',
    borderColor: 'transparent',
    extendedProps: { ...event }
  }));

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div></div>;

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.5em] text-gold-600">System Control</span>
          <h1 className="text-4xl md:text-5xl font-serif italic text-stone-900">Admin Dashboard</h1>
          <p className="text-xs uppercase tracking-widest text-stone-500">Welcome back, {adminName}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'calendar' ? 'bg-accent-gold text-white shadow-lg' : 'bg-white border border-stone-200 text-stone-600 hover:border-accent-gold hover:text-accent-gold'}`}
          >
            <CalendarIcon size={14} className="inline mr-2" /> Calendar
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'bookings' ? 'bg-accent-gold text-white shadow-lg' : 'bg-white border border-stone-200 text-stone-600 hover:border-accent-gold hover:text-accent-gold'}`}
          >
            <LayoutDashboard size={14} className="inline mr-2" /> Bookings
          </button>
          <button 
            onClick={() => setActiveTab('presets')}
            className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'presets' ? 'bg-accent-gold text-white shadow-lg' : 'bg-white border border-stone-200 text-stone-600 hover:border-accent-gold hover:text-accent-gold'}`}
          >
            <Filter size={14} className="inline mr-2" /> Presets
          </button>
          <button 
            onClick={() => setActiveTab('community')}
            className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'community' ? 'bg-accent-gold text-white shadow-lg' : 'bg-white border border-stone-200 text-stone-600 hover:border-accent-gold hover:text-accent-gold'}`}
          >
            <Users size={14} className="inline mr-2" /> Community
          </button>
          <button 
            onClick={() => setActiveTab('archives')}
            className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'archives' ? 'bg-accent-gold text-white shadow-lg' : 'bg-white border border-stone-200 text-stone-600 hover:border-accent-gold hover:text-accent-gold'}`}
          >
            <Archive size={14} className="inline mr-2" /> Archives
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-accent-gold text-white shadow-lg' : 'bg-white border border-stone-200 text-stone-600 hover:border-accent-gold hover:text-accent-gold'}`}
          >
            <Users size={14} className="inline mr-2" /> Users
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest bg-stone-900 text-white shadow-lg hover:bg-stone-800 transition-all"
          >
            <Plus size={14} className="inline mr-2" /> New Booking
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-stone-200 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-gold-50 rounded-2xl flex items-center justify-center text-accent-gold border border-gold-100"><CalendarIcon size={20} /></div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-stone-500">Total Bookings</p>
            <p className="text-3xl font-serif italic text-stone-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-stone-200 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 border border-stone-100"><Clock size={20} /></div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-stone-500">Active Events</p>
            <p className="text-3xl font-serif italic text-stone-900">{stats.active}</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-stone-200 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-gold-50 rounded-2xl flex items-center justify-center text-accent-gold border border-gold-100"><TrendingUp size={20} /></div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-stone-500">Total Revenue</p>
            <p className="text-3xl font-serif italic text-stone-900">₱{stats.revenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-stone-200 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 border border-stone-100"><AlertCircle size={20} /></div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-stone-500">Pending Intake</p>
            <p className="text-3xl font-serif italic text-stone-900">{stats.pending}</p>
          </div>
        </div>
      </section>

      {activeTab === 'bookings' && (
        <section className="bg-white rounded-[40px] border border-stone-200 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-stone-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-stone-50/50">
            <h2 className="text-2xl font-serif italic text-stone-900">Client Bookings</h2>
            <div className="flex flex-wrap gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search events..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-full text-xs text-stone-900 focus:outline-none focus:border-accent-gold transition-all" 
                />
              </div>
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 bg-white border border-stone-200 rounded-full text-xs text-stone-900 focus:outline-none focus:border-accent-gold transition-all"
              >
                <option value="All">All Types</option>
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
                  <th className="px-8 py-6 font-bold">Tracking #</th>
                  <th className="px-8 py-6 font-bold">Client</th>
                  <th className="px-8 py-6 font-bold">Event Date</th>
                  <th className="px-8 py-6 font-bold">Type</th>
                  <th className="px-8 py-6 font-bold">Status</th>
                  <th className="px-8 py-6 font-bold">Budget</th>
                  <th className="px-8 py-6 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredEvents.map(event => (
                  <tr key={event.id} className="hover:bg-stone-50/80 transition-colors group cursor-pointer" onClick={() => handleOpenModal(event)}>
                    <td className="px-8 py-6 font-mono text-xs font-bold text-accent-gold">{event.trackingNumber}</td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-stone-900">{event.clientName}</p>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest">{event.clientEmail}</p>
                    </td>
                    <td className="px-8 py-6 text-sm text-stone-600">{format(new Date(event.eventDate), 'MMM dd, yyyy')}</td>
                    <td className="px-8 py-6 text-xs uppercase tracking-widest font-bold text-stone-500">{event.eventType}</td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                        event.status === 'Completed' ? 'bg-stone-100 text-stone-500 border-stone-200' :
                        event.status === 'Booked' ? 'bg-gold-50 text-accent-gold border-gold-100' :
                        event.status === 'Cancelled' ? 'bg-red-50 text-red-500 border-red-100' :
                        'bg-stone-50 text-stone-600 border-stone-200'
                      }`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm font-serif italic text-stone-900">₱{event.budget?.toLocaleString()}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        {event.status !== 'Completed' && event.status !== 'Cancelled' && (
                          <button 
                            onClick={() => handleCompleteBooking(event.id)} 
                            className="p-2 text-stone-400 hover:text-green-600 transition-colors"
                            title="Mark as Completed"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        <Link to={`/track/${event.id}`} className="p-2 text-stone-400 hover:text-accent-gold transition-colors">
                          <ArrowRight size={16} />
                        </Link>
                        <button 
                          onClick={() => setDeleteConfirmId(event.id)} 
                          className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'calendar' && (
        <section className="bg-white p-8 rounded-[40px] border border-stone-200 shadow-xl">
          <div className="mb-8 flex justify-between items-center">
            <h2 className="text-2xl font-serif italic text-stone-900">Event Calendar</h2>
            <div className="flex gap-4 text-[10px] uppercase tracking-widest font-bold">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent-gold"></div> Booked</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-stone-400"></div> Completed</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Cancelled</div>
            </div>
          </div>
          <div className="calendar-container">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={calendarEvents}
              eventClick={(info) => handleOpenModal(info.event.extendedProps)}
              dateClick={(info) => {
                const existing = events.find(e => e.eventDate === info.dateStr && e.status !== 'Cancelled');
                if (existing) {
                  alert(`Date Conflict: ${existing.clientName} has already booked this date.`);
                } else {
                  handleOpenModal();
                  setFormData(prev => ({ ...prev, eventDate: info.dateStr }));
                }
              }}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek'
              }}
              height="auto"
            />
          </div>
        </section>
      )}

      {activeTab === 'presets' && (
        <section className="bg-white rounded-[40px] border border-stone-200 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-stone-100 flex flex-col gap-6 bg-stone-50/50">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-serif italic text-stone-900">Signature Presets</h2>
              <button 
                onClick={() => handleOpenPresetModal()}
                className="px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest bg-accent-gold text-white shadow-md hover:bg-gold-600 transition-all"
              >
                <Plus size={14} className="inline mr-2" /> Add Preset
              </button>
            </div>
            
            {/* Categorization Bar */}
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedPresetType(type)}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    selectedPresetType === type 
                      ? 'bg-stone-900 text-white border-stone-900 shadow-md' 
                      : 'bg-white text-stone-600 border-stone-200 hover:border-accent-gold hover:text-accent-gold'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="p-8 grid md:grid-cols-3 gap-6">
            {presets
              .filter(p => !p.isClientShared && !p.isArchived)
              .filter(p => selectedPresetType === 'All' || p.eventType === selectedPresetType)
              .map(preset => (
              <div key={preset.id} className={`group relative bg-white rounded-3xl overflow-hidden transition-all ${preset.isArchived ? 'opacity-60 grayscale' : 'hover:shadow-xl hover:-translate-y-1'}`}>
                <div className="h-40 overflow-hidden relative">
                  <img src={preset.imageUrl} alt={preset.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                  {preset.isArchived && (
                    <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center">
                      <span className="px-4 py-1 bg-white text-stone-900 text-[10px] font-bold uppercase tracking-widest rounded-full">Archived</span>
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-serif italic text-lg text-stone-900">{preset.name}</h3>
                    <span className="text-xs font-bold text-accent-gold">₱{preset.price.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">{preset.eventType}</p>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => handleOpenPresetModal(preset)} className="flex-1 py-2 bg-stone-50 text-stone-600 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-stone-100 transition-all">Edit</button>
                    <button onClick={() => handleArchivePreset(preset)} className="flex-1 py-2 bg-stone-50 text-stone-600 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-stone-100 transition-all">
                      {preset.isArchived ? 'Unarchive' : 'Archive'}
                    </button>
                    <button 
                      onClick={() => setDeletePresetConfirmId(preset.id)} 
                      className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'community' && (
        <section className="bg-white rounded-[40px] border border-stone-200 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-stone-100 bg-stone-50/50 space-y-6">
            <div>
              <h2 className="text-2xl font-serif italic text-stone-900">Client Shared Designs</h2>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">Manage posts shared by the community</p>
            </div>

            {/* Categorization Bar */}
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedPresetType(type)}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    selectedPresetType === type 
                      ? 'bg-stone-900 text-white border-stone-900 shadow-md' 
                      : 'bg-white text-stone-600 border-stone-200 hover:border-accent-gold hover:text-accent-gold'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="p-8 grid md:grid-cols-3 gap-6">
            {presets
              .filter(p => p.isClientShared && !p.isArchived)
              .filter(p => selectedPresetType === 'All' || p.eventType === selectedPresetType)
              .map(preset => (
              <div key={preset.id} className={`group relative bg-white rounded-3xl overflow-hidden transition-all ${preset.isArchived ? 'opacity-60 grayscale' : 'hover:shadow-xl hover:-translate-y-1'}`}>
                <div className="h-40 overflow-hidden relative">
                  <img src={preset.imageUrl} alt={preset.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest text-white border border-stone-800 shadow-sm">
                    Community Shared
                  </div>
                  {preset.isArchived && (
                    <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center">
                      <span className="px-4 py-1 bg-white text-stone-900 text-[10px] font-bold uppercase tracking-widest rounded-full">Archived</span>
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-serif italic text-lg text-stone-900">{preset.name}</h3>
                    <span className="text-xs font-bold text-accent-gold">₱{preset.price.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">{preset.eventType}</p>
                  <p className="text-[8px] text-stone-400 uppercase tracking-widest">Shared by: {preset.sharedBy}</p>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => handleOpenPresetModal(preset)} className="flex-1 py-2 bg-stone-50 text-stone-600 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-stone-100 transition-all">Edit</button>
                    <button onClick={() => handleArchivePreset(preset)} className="flex-1 py-2 bg-stone-50 text-stone-600 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-stone-100 transition-all">
                      {preset.isArchived ? 'Unarchive' : 'Archive'}
                    </button>
                    <button 
                      onClick={() => setDeletePresetConfirmId(preset.id)} 
                      className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {presets.filter(p => p.isClientShared).length === 0 && (
              <div className="col-span-full py-20 text-center bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                <p className="text-stone-400 uppercase tracking-widest text-xs font-bold">No client shared designs yet.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Preset Modal */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white border border-stone-100 rounded-[40px] p-10 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start mb-8">
              <button 
                onClick={() => setIsPresetModalOpen(false)}
                className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors uppercase tracking-widest text-[10px] font-bold"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button onClick={() => setIsPresetModalOpen(false)} className="text-stone-400 hover:text-stone-900 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="mb-8">
              <span className="text-xs uppercase tracking-[0.5em] text-accent-gold font-bold">Gallery Management</span>
              <h2 className="text-3xl font-serif italic text-stone-900">{selectedPreset ? 'Edit Preset' : 'Add New Preset'}</h2>
            </div>
            <form onSubmit={handleSavePreset} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Preset Name</label>
                <input required type="text" value={presetData.name} onChange={(e) => setPresetData({...presetData, name: e.target.value})} className="w-full px-6 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Price (₱)</label>
                  <input required type="number" value={presetData.price} onChange={(e) => setPresetData({...presetData, price: Number(e.target.value)})} className="w-full px-6 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Event Type</label>
                  <select value={presetData.eventType} onChange={(e) => setPresetData({...presetData, eventType: e.target.value})} className="w-full px-6 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm">
                    <option value="Wedding">Wedding</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Reunion">Reunion</option>
                    <option value="Corporate Celebration">Corporate Celebration</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Image</label>
                <div className="flex gap-4 items-center">
                  {presetData.imageUrl && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-stone-200">
                      <img src={presetData.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <label className="flex-1 cursor-pointer bg-stone-50 border border-stone-200 border-dashed rounded-2xl p-4 text-center hover:border-accent-gold transition-all">
                    <span className="text-xs text-stone-500 uppercase tracking-widest font-bold">
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setUploading(true);
                        try {
                          const sessionData = JSON.parse(localStorage.getItem('admin_session') || '{}');
                          const formData = new FormData();
                          formData.append('file', file);
                          
                          const response = await fetch('/api/upload/', {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${sessionData.token}`
                            },
                            body: formData,
                          });
                          
                          const data = await response.json();
                          if (data.url) {
                            setPresetData({ ...presetData, imageUrl: data.url });
                          } else {
                            throw new Error('Upload failed');
                          }
                        } catch (err) {
                          console.error('Upload error:', err);
                          alert('Upload failed');
                        } finally {
                          setUploading(false);
                        }
                      }}
                    />
                  </label>
                </div>
                <input required type="text" placeholder="Or paste image path/URL" value={presetData.imageUrl} onChange={(e) => setPresetData({...presetData, imageUrl: e.target.value})} className="w-full px-6 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm mt-2" />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Description</label>
                <textarea required rows="2" value={presetData.description} onChange={(e) => setPresetData({...presetData, description: e.target.value})} className="w-full px-6 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm"></textarea>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Specifications</label>
                  <button 
                    type="button"
                    onClick={() => setPresetData({
                      ...presetData, 
                      specifications: [...(presetData.specifications || []), '']
                    })}
                    className="text-[10px] text-accent-gold font-bold uppercase tracking-widest hover:underline"
                  >
                    + Add Spec
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {(presetData.specifications || []).map((spec, index) => (
                    <div key={index} className="flex gap-2">
                      <input 
                        required
                        type="text" 
                        value={spec} 
                        onChange={(e) => {
                          const newSpecs = [...presetData.specifications];
                          newSpecs[index] = e.target.value;
                          setPresetData({ ...presetData, specifications: newSpecs });
                        }}
                        placeholder="e.g., Signature Tablescape (20-30 people)"
                        className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const newSpecs = presetData.specifications.filter((_, i) => i !== index);
                          setPresetData({ ...presetData, specifications: newSpecs });
                        }}
                        className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {(!presetData.specifications || presetData.specifications.length === 0) && (
                    <p className="text-[10px] text-stone-400 italic">No specifications added yet.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsPresetModalOpen(false)}
                  className="flex-1 py-4 border border-stone-200 text-stone-600 rounded-full font-bold uppercase tracking-widest hover:bg-stone-50 transition-all"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-[2] bg-stone-900 text-white py-4 rounded-full font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg">
                  {selectedPreset ? 'Update Preset' : 'Create Preset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {activeTab === 'archives' && (
        <section className="bg-white rounded-[40px] border border-stone-200 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-stone-100 bg-stone-50/50 space-y-6">
            <div>
              <h2 className="text-2xl font-serif italic text-stone-900">Archived Designs</h2>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">Manage designs that have been removed from the public gallery</p>
            </div>

            {/* Categorization Bar */}
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedPresetType(type)}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    selectedPresetType === type 
                      ? 'bg-stone-900 text-white border-stone-900 shadow-md' 
                      : 'bg-white text-stone-600 border-stone-200 hover:border-accent-gold hover:text-accent-gold'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="p-8 grid md:grid-cols-3 gap-6">
            {presets
              .filter(p => p.isArchived)
              .filter(p => selectedPresetType === 'All' || p.eventType === selectedPresetType)
              .map(preset => (
              <div key={preset.id} className="group relative bg-white rounded-3xl overflow-hidden transition-all opacity-80 hover:opacity-100 border border-stone-100 hover:shadow-xl hover:-translate-y-1">
                <div className="h-40 overflow-hidden relative">
                  <img src={preset.imageUrl} alt={preset.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 grayscale" referrerPolicy="no-referrer" />
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest text-white border border-stone-800 shadow-sm">
                    {preset.isClientShared ? 'Community' : 'Signature'}
                  </div>
                  <div className="absolute inset-0 bg-stone-900/20 flex items-center justify-center">
                    <span className="px-4 py-1 bg-white text-stone-900 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">Archived</span>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-serif italic text-lg text-stone-900">{preset.name}</h3>
                    <span className="text-xs font-bold text-accent-gold">₱{preset.price.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">{preset.eventType}</p>
                  {preset.isClientShared && (
                    <p className="text-[8px] text-stone-400 uppercase tracking-widest">Shared by: {preset.sharedBy}</p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => handleOpenPresetModal(preset)} className="flex-1 py-2 bg-stone-50 text-stone-600 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-stone-100 transition-all">Edit</button>
                    <button onClick={() => handleArchivePreset(preset)} className="flex-1 py-2 bg-accent-gold text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-gold-600 transition-all shadow-md">
                      Restore
                    </button>
                    <button 
                      onClick={() => setDeletePresetConfirmId(preset.id)} 
                      className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {presets.filter(p => p.isArchived).length === 0 && (
              <div className="col-span-full py-20 text-center bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                <p className="text-stone-400 uppercase tracking-widest text-xs font-bold">No archived designs found.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'users' && (
        <section className="bg-white rounded-[40px] border border-stone-200 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-serif italic text-stone-900">User Roles & Access</h2>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">Manage admin and staff accounts</p>
            </div>
            <button 
              onClick={() => handleOpenUserModal()}
              className="px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest bg-accent-gold text-white shadow-md hover:bg-gold-600 transition-all"
            >
              <Plus size={14} className="inline mr-2" /> Add User
            </button>
          </div>
          <div className="p-8 grid md:grid-cols-2 gap-8">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-6 bg-stone-50/50 rounded-3xl border border-stone-100 hover:border-accent-gold/30 transition-all hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold-50 rounded-2xl flex items-center justify-center text-accent-gold font-bold uppercase border border-gold-100">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">{user.name}</p>
                    <p className="text-[10px] text-stone-500 uppercase tracking-widest">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                    user.role === 'admin' ? 'bg-gold-50 text-accent-gold border-gold-100' : 'bg-stone-100 text-stone-600 border-stone-200'
                  }`}>
                    {user.role}
                  </span>
                  <button 
                    onClick={() => handleOpenUserModal(user)}
                    className="p-2 text-stone-400 hover:text-accent-gold transition-colors"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="col-span-full py-12 text-center bg-stone-50 rounded-3xl border border-dashed border-stone-200 text-stone-400">
                <p className="text-[10px] uppercase tracking-widest font-bold">No additional users created.</p>
                <p className="text-[10px] mt-1 italic">The main admin account (Admin123) is built-in.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* User Management Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white border border-stone-100 rounded-[40px] p-10 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setIsUserModalOpen(false)} className="absolute top-8 right-8 text-stone-400 hover:text-stone-900 transition-colors">
              <X size={24} />
            </button>
            <div className="mb-8">
              <span className="text-xs uppercase tracking-[0.5em] text-accent-gold font-bold">Access Control</span>
              <h2 className="text-3xl font-serif italic text-stone-900">{selectedUser ? 'Edit User' : 'Add User'}</h2>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Full Name</label>
                <input 
                  required 
                  type="text" 
                  value={userData.name} 
                  onChange={(e) => setUserData({...userData, name: e.target.value})} 
                  placeholder="e.g. Maria Clara"
                  className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Username/Email</label>
                <input 
                  required 
                  type="text" 
                  value={userData.email} 
                  onChange={(e) => setUserData({...userData, email: e.target.value})} 
                  placeholder="e.g. maria_clara"
                  className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Password</label>
                <input 
                  required 
                  type="password" 
                  value={userData.password} 
                  onChange={(e) => setUserData({...userData, password: e.target.value})} 
                  placeholder="••••••••"
                  className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Role</label>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setUserData({...userData, role: 'staff'})}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${userData.role === 'staff' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-200 hover:border-accent-gold'}`}
                  >
                    Staff
                  </button>
                  <button 
                    type="button"
                    onClick={() => setUserData({...userData, role: 'admin'})}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${userData.role === 'admin' ? 'bg-accent-gold text-white border-accent-gold' : 'bg-white text-stone-500 border-stone-200 hover:border-accent-gold'}`}
                  >
                    Admin
                  </button>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  className="flex-[2] bg-stone-900 text-white py-5 rounded-full font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg"
                >
                  {selectedUser ? 'Update User' : 'Create User'}
                </button>
                {selectedUser && (
                  <button 
                    type="button"
                    onClick={() => setDeleteUserConfirmId(selectedUser.id)}
                    className="flex-1 bg-red-50 text-red-500 py-5 rounded-full font-bold uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
                  >
                    <Trash2 size={20} className="mx-auto" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteUserConfirmId && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white border border-stone-100 rounded-[40px] p-10 max-w-md w-full shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif italic text-stone-900">Remove User?</h2>
              <p className="text-stone-500 text-sm">This user will no longer be able to access the dashboard.</p>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setDeleteUserConfirmId(null)}
                className="flex-1 py-4 bg-stone-100 text-stone-600 rounded-full font-bold uppercase tracking-widest hover:bg-stone-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteUser(deleteUserConfirmId)}
                className="flex-1 py-4 bg-red-500 text-white rounded-full font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-200"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-md">
          <div className="bg-white border border-stone-100 rounded-[40px] p-10 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-stone-400 hover:text-stone-900 transition-colors">
              <X size={24} />
            </button>
            
            <div className="mb-8">
              <span className="text-xs uppercase tracking-[0.5em] text-accent-gold font-bold">Management</span>
              <h2 className="text-3xl font-serif italic text-stone-900">{selectedEvent ? 'Edit Booking' : 'New Booking'}</h2>
            </div>

            <form onSubmit={handleSaveBooking} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Client Name</label>
                  <input 
                    required
                    type="text" 
                    value={formData.clientName}
                    onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                    className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:border-accent-gold transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Email</label>
                  <input 
                    required
                    type="email" 
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                    className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:border-accent-gold transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Phone</label>
                  <input 
                    required
                    type="tel" 
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                    className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:border-accent-gold transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Event Date</label>
                  <input 
                    required
                    type="date" 
                    value={formData.eventDate}
                    onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                    className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:border-accent-gold transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Event Type</label>
                  <select 
                    value={formData.eventType}
                    onChange={(e) => setFormData({...formData, eventType: e.target.value})}
                    className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:border-accent-gold transition-all"
                  >
                    <option value="Wedding">Wedding</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Reunion">Reunion</option>
                    <option value="Corporate Celebration">Corporate Celebration</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:border-accent-gold transition-all"
                  >
                    <option value="Booked">Booked</option>
                    <option value="Styling Plan">Styling Plan</option>
                    <option value="Preparation">Preparation</option>
                    <option value="Live">Live</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Budget (₱)</label>
                <input 
                  required
                  type="number" 
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: Number(e.target.value)})}
                  className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:border-accent-gold transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Notes</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:border-accent-gold transition-all"
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-stone-900 text-white py-5 rounded-full font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg"
                >
                  {selectedEvent ? 'Update Booking' : 'Create Booking'}
                </button>
                {selectedEvent && (
                  <button 
                    type="button"
                    onClick={() => setDeleteConfirmId(selectedEvent.id)}
                    className="px-8 bg-red-50 text-red-500 py-5 rounded-full font-bold uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white border border-stone-100 rounded-[40px] p-10 max-w-md w-full shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif italic text-stone-900">Delete Booking?</h2>
              <p className="text-stone-500 text-sm">This action cannot be undone. All event data and photos will be permanently removed.</p>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-4 bg-stone-100 text-stone-600 rounded-full font-bold uppercase tracking-widest hover:bg-stone-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteBooking(deleteConfirmId)}
                className="flex-1 py-4 bg-red-500 text-white rounded-full font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Preset Confirmation Modal */}
      {deletePresetConfirmId && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white border border-stone-100 rounded-[40px] p-10 max-w-md w-full shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif italic text-stone-900">Delete Preset?</h2>
              <p className="text-stone-500 text-sm">This action cannot be undone. This design will be permanently removed from the gallery.</p>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setDeletePresetConfirmId(null)}
                className="flex-1 py-4 bg-stone-100 text-stone-600 rounded-full font-bold uppercase tracking-widest hover:bg-stone-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeletePreset(deletePresetConfirmId)}
                className="flex-1 py-4 bg-red-500 text-white rounded-full font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .fc { font-family: inherit; }
        .fc .fc-toolbar-title { font-family: "Playfair Display", serif; font-style: italic; font-size: 1.5rem; }
        .fc .fc-button-primary { background-color: #1c1917; border-color: transparent; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: bold; border-radius: 9999px; padding: 0.5rem 1rem; }
        .fc .fc-button-primary:hover { background-color: #D4AF37; }
        .fc .fc-button-primary:disabled { background-color: #d6d3d1; }
        .fc .fc-daygrid-day.fc-day-today { background-color: #fffdf0; }
        .fc .fc-event { cursor: pointer; padding: 2px 4px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
        .fc .fc-daygrid-day-number { font-size: 12px; font-weight: bold; color: #444; padding: 8px; }
        .fc th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; padding: 12px 0 !important; color: #78716c; }
      `}</style>
    </div>
  );
}
