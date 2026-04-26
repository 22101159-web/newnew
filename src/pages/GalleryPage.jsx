import React, { useState, useEffect } from 'react';
import { MOCK_PRESETS, EVENT_TYPES } from '../constants';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ArrowRight, Upload, X, Camera, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';


export default function GalleryPage() {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [budgetFilter, setBudgetFilter] = useState(1000000);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [showCommunityOnly, setShowCommunityOnly] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [newPreset, setNewPreset] = useState({
    name: '',
    description: '',
    eventType: 'Wedding',
    price: 15000,
    image: null
  });

  useEffect(() => {
    const loadPresets = () => {
      const communityPresets = JSON.parse(localStorage.getItem('emis_community_presets') || '[]');
      const allPresets = [
        ...MOCK_PRESETS.map(m => ({ ...m, isArchived: false, isClientShared: false })),
        ...communityPresets.map(p => ({ ...p, isClientShared: true, status: p.status || 'approved' }))
      ];
      setPresets(allPresets);
      setLoading(false);
    };
    loadPresets();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newPreset.image) {
      alert('Please select a photo.');
      return;
    }
    if (newPreset.name.length < 10) {
      alert('Design name must be at least 10 characters long.');
      return;
    }
    const price = Number(newPreset.price);
    if (price < 15000) {
      alert('Estimated cost must be at least ₱15,000.');
      return;
    }

    setUploadLoading(true);
    setUploadError(null);
    
    try {
      const session = JSON.parse(localStorage.getItem('admin_session') || '{}');
      const token = session.token || null;

      // Helper to save to local storage
      const savePreset = (imageUrl) => {
        const communityPresets = JSON.parse(localStorage.getItem('emis_community_presets') || '[]');
        
        const newEntry = {
          id: `preset_${Date.now()}`,
          name: newPreset.name || 'Untitled Design',
          description: newPreset.description || '',
          eventType: newPreset.eventType || 'Other',
          price: Number(newPreset.price) || 0,
          imageUrl: imageUrl,
          isClientShared: true,
          status: 'pending',
          sharedBy: session.name || 'Anonymous Client',
          createdAt: new Date().toISOString(),
          isArchived: false
        };

        communityPresets.push(newEntry);
        localStorage.setItem('emis_community_presets', JSON.stringify(communityPresets));
        
        setPresets(prev => [...prev, newEntry]);
        setUploadSuccess(true);
        
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setUploadSuccess(false);
          setNewPreset({ name: '', description: '', eventType: 'Wedding', price: 15000, image: null });
        }, 2000);
      };

      const formData = new FormData();
      formData.append('file', newPreset.image);
      
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/upload/', {
        method: 'POST',
        headers: headers,
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.url) {
        savePreset(data.url);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error.message || 'Failed to share design. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  const isAdmin = !!localStorage.getItem('admin_session');
  const filteredPresets = presets.filter(p => 
    !p.isArchived &&
    Number(p.price || 0) <= budgetFilter && 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedType === 'All' || p.eventType === selectedType) &&
    (
      showCommunityOnly 
        ? p.isClientShared && (isAdmin || p.status === 'approved')
        : !p.isClientShared
    )
  );

  return (
    <div className="space-y-12">
      <header className="text-center space-y-4">
        <span className="text-xs uppercase tracking-[0.5em] text-accent-gold font-bold">Inspiration</span>
        <h1 className="text-4xl md:text-6xl font-serif italic text-stone-900">Our Signature Presets</h1>
        <p className="text-stone-500 max-w-2xl mx-auto uppercase tracking-widest text-sm font-medium">
          Browse our curated collection of event styling presets designed to fit every vision and budget.
        </p>
      </header>

      {/* Event Type Tabs */}
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-wrap justify-center gap-4">
          {EVENT_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                selectedType === type
                  ? 'bg-accent-gold text-white border-accent-gold shadow-lg' 
                  : 'bg-white text-stone-600 border-stone-200 hover:border-accent-gold hover:text-accent-gold'
              }`}
            >
              {type === 'All' ? 'All Designs' : (type === 'Others' ? 'Others' : type + 's')}
            </button>
          ))}
          <button
            onClick={() => setShowCommunityOnly(!showCommunityOnly)}
            className={`px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
              showCommunityOnly 
                ? 'bg-stone-900 text-white border-stone-900 shadow-lg' 
                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-900 hover:text-stone-900'
            }`}
          >
            {showCommunityOnly ? 'Showing Community' : 'Show Community'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-8 rounded-[32px] border border-stone-100 shadow-xl flex flex-col md:flex-row gap-8 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              type="text" 
              placeholder="Search presets..." 
              className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-full text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-accent-gold transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-stone-900 text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg"
          >
            <Upload size={14} /> Share Your Design
          </button>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="flex items-center gap-3">
            <Filter className="text-accent-gold" size={18} />
            <span className="text-xs uppercase tracking-widest text-stone-500 font-bold whitespace-nowrap">Max Budget: ₱{budgetFilter.toLocaleString()}</span>
          </div>
          <input 
            type="range" 
            min="10000" 
            max="1000000" 
            step="10000"
            className="flex-1 md:w-48 h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-accent-gold"
            value={budgetFilter}
            onChange={(e) => setBudgetFilter(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid md:grid-cols-3 gap-8">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-[400px] bg-stone-100 animate-pulse rounded-[32px] border border-stone-200"></div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {filteredPresets.map((preset, index) => (
            <Motion.div 
              key={preset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white rounded-[32px] overflow-hidden border border-stone-100 shadow-sm hover:shadow-2xl hover:border-accent-gold/50 transition-all duration-500"
            >
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={preset.imageUrl} 
                  alt={preset.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                  <div className="bg-white/90 backdrop-blur px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-accent-gold border border-gold-100 shadow-sm">
                    ₱{(Number(preset.price) || 0).toLocaleString()}
                  </div>
                  {preset.isClientShared && (
                    <div className="bg-stone-900/90 backdrop-blur px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest text-white border border-stone-800 shadow-sm">
                      Community Shared
                    </div>
                  )}
                </div>
              </div>
              <div className="p-8 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-2xl font-serif italic text-stone-900">{preset.name}</h3>
                  <span className="text-[8px] uppercase tracking-widest font-bold text-stone-400 bg-stone-50 px-2 py-1 rounded border border-stone-100">
                    {preset.eventType}
                  </span>
                </div>
                <p className="text-stone-500 text-sm leading-relaxed line-clamp-2 font-medium">
                  {preset.description}
                </p>
                {preset.specifications && (
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Specifications:</p>
                    <ul className="space-y-1">
                      {preset.specifications.map((spec, i) => (
                        <li key={i} className="text-[10px] text-stone-500 flex items-start gap-2">
                          <span className="text-accent-gold mt-1">•</span>
                          <span>{spec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {preset.isClientShared && preset.sharedBy && (
                  <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold italic">
                    Shared by: {preset.sharedBy}
                  </p>
                )}
                {!preset.isClientShared && (
                  <Link 
                    to={`/book?preset=${preset.id}`}
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold text-accent-gold hover:gap-4 transition-all"
                  >
                    Book this preset <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </Motion.div>
          ))}
        </div>
      )}

      {filteredPresets.length === 0 && !loading && (
        <div className="text-center py-20 bg-stone-50 rounded-[32px] border border-dashed border-stone-200 space-y-4">
          <p className="text-stone-400 uppercase tracking-widest text-sm font-bold">No presets found matching your criteria.</p>
          {showCommunityOnly && (
            <p className="text-stone-400 text-[10px] uppercase tracking-widest">Be the first to share a design with the community!</p>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <Motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <Motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-stone-200"
            >
              <div className="p-8 md:p-12 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.3em] text-accent-gold font-bold">Community Gallery</span>
                    <h2 className="text-3xl font-serif italic text-stone-900">Share Your Styled Event</h2>
                  </div>
                  <button 
                    onClick={() => setIsUploadModalOpen(false)}
                    className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400"
                  >
                    <X size={24} />
                  </button>
                </div>

                {uploadError && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold uppercase tracking-widest text-center">
                    {uploadError}
                  </div>
                )}

                {uploadSuccess ? (
                  <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in">
                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-100">
                      <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-2xl font-serif italic text-stone-900">Thank You for Sharing!</h3>
                    <p className="text-stone-500 uppercase tracking-widest text-[10px] font-bold">Your design has been added to the community presets.</p>
                  </div>
                ) : (
                  <form onSubmit={handleUpload} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-stone-500">Design Name</label>
                        <input 
                          required
                          type="text" 
                          placeholder="e.g., My Dream Wedding"
                          className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:border-accent-gold transition-all"
                          value={newPreset.name}
                          onChange={(e) => setNewPreset({...newPreset, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-stone-500">Event Type</label>
                        <select 
                          className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:border-accent-gold transition-all appearance-none"
                          value={newPreset.eventType}
                          onChange={(e) => setNewPreset({...newPreset, eventType: e.target.value})}
                        >
                          {EVENT_TYPES.filter(t => t !== 'All').map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-stone-500">Estimated Cost (₱)</label>
                        <input 
                          required
                          type="number" 
                          placeholder="e.g., 25000"
                          className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:border-accent-gold transition-all"
                          value={newPreset.price}
                          onChange={(e) => setNewPreset({...newPreset, price: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-stone-500">Description</label>
                      <textarea 
                        required
                        rows={3}
                        placeholder="Tell us about the styling, colors, and mood..."
                        className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:border-accent-gold transition-all resize-none"
                        value={newPreset.description}
                        onChange={(e) => setNewPreset({...newPreset, description: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-stone-500">Upload Photo</label>
                      <div className="relative group">
                        <input 
                          required
                          type="file" 
                          accept="image/*"
                          onChange={(e) => setNewPreset({...newPreset, image: e.target.files[0]})}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`w-full py-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${newPreset.image ? 'border-accent-gold bg-gold-50/30' : 'border-stone-200 bg-stone-50 group-hover:border-accent-gold/50'}`}>
                          {newPreset.image ? (
                            <>
                              <CheckCircle2 className="text-accent-gold" size={32} />
                              <p className="text-xs font-bold text-stone-900 truncate max-w-[80%]">{newPreset.image.name}</p>
                            </>
                          ) : (
                            <>
                              <Camera className="text-stone-300 group-hover:text-accent-gold transition-colors" size={32} />
                              <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Click or drag to upload your event photo</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button 
                      disabled={uploadLoading}
                      type="submit"
                      className="w-full bg-stone-900 text-white py-5 rounded-full font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {uploadLoading ? 'Sharing Design...' : 'Share with Community'}
                      {!uploadLoading && <ArrowRight size={18} />}
                    </button>
                  </form>
                )}
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
