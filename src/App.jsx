import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import LandingPage from './pages/LandingPage';
import BookingPage from './pages/BookingPage';
import GalleryPage from './pages/GalleryPage';
import TrackingPage from './pages/TrackingPage';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import ClientDashboard from './pages/ClientDashboard';

// Components
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for local session
    const session = localStorage.getItem('admin_session');
    if (session) {
      try {
        const sessionData = JSON.parse(session);
        setUser({ uid: sessionData.uid, name: sessionData.name });
        setRole(sessionData.role);
      } catch (e) {
        localStorage.removeItem('admin_session');
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-gold"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
        <Navbar user={user} role={role} />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/track/:id" element={<TrackingPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/my-bookings" element={<ClientDashboard />} />
            
            {/* Protected Routes */}
            <Route 
              path="/admin/dashboard" 
              element={role === 'admin' ? <AdminDashboard /> : <Navigate to="/admin/login" />} 
            />
            <Route 
              path="/staff/dashboard" 
              element={(role === 'staff' || role === 'admin') ? <StaffDashboard /> : <Navigate to="/admin/login" />} 
            />
          </Routes>
        </main>
        <footer className="bg-stone-900 text-stone-400 py-12 mt-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-accent-gold font-serif italic text-2xl mb-4">Gabrielle Custodio</h2>
            <p className="text-xs uppercase tracking-widest mb-8 text-stone-500">Event Styling & Design</p>
            <div className="border-t border-stone-800 pt-8 text-[10px] uppercase tracking-widest opacity-50">
              &copy; {new Date().getFullYear()} Gabrielle Custodio Event Styling. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </Router>
    </ErrorBoundary>
  );
}
