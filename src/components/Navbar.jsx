import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut } from 'lucide-react';

export default function Navbar({ user, role }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    window.location.href = '/';
  };

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <Link to={role === 'admin' ? '/admin/dashboard' : (role === 'staff' ? '/staff/dashboard' : '/')} className="flex flex-col items-center">
            <span className="text-2xl font-serif italic text-stone-900 leading-none">Gabrielle Custodio</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-accent-gold mt-1">Event Styling</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {(!role || role === 'client') ? (
              <>
                <Link to="/" className="text-sm uppercase tracking-widest text-stone-600 hover:text-accent-gold transition-colors">Home</Link>
                <Link to="/gallery" className="text-sm uppercase tracking-widest text-stone-600 hover:text-accent-gold transition-colors">Gallery</Link>
                <Link to="/my-bookings" className="text-sm uppercase tracking-widest text-stone-600 hover:text-accent-gold transition-colors">My Bookings</Link>
                <Link to="/book" className="text-sm uppercase tracking-widest text-stone-600 hover:text-accent-gold transition-colors">Book Now</Link>
              </>
            ) : role === 'admin' ? (
              <>
                <Link to="/admin/dashboard?tab=calendar" className="text-sm uppercase tracking-widest text-stone-600 hover:text-accent-gold transition-colors">Calendar</Link>
                <Link to="/admin/dashboard?tab=bookings" className="text-sm uppercase tracking-widest text-stone-600 hover:text-accent-gold transition-colors">Bookings</Link>
                <Link to="/admin/dashboard?tab=presets" className="text-sm uppercase tracking-widest text-stone-600 hover:text-accent-gold transition-colors">Presets</Link>
                <Link to="/admin/dashboard?tab=community" className="text-sm uppercase tracking-widest text-stone-600 hover:text-accent-gold transition-colors">Community</Link>
                <Link to="/admin/dashboard?tab=users" className="text-sm uppercase tracking-widest text-stone-600 hover:text-accent-gold transition-colors">Users</Link>
              </>
            ) : (
              <Link to="/staff/dashboard" className="text-sm uppercase tracking-widest text-stone-600 hover:text-accent-gold transition-colors">Management</Link>
            )}
            
            <div className="h-4 w-px bg-stone-200"></div>

            {(user && !user.isAnonymous) ? (
              <div className="flex items-center space-x-6">
                <button onClick={handleLogout} className="flex items-center space-x-2 text-sm text-stone-400 hover:text-accent-gold transition-colors">
                  <LogOut size={16} />
                  <span className="uppercase tracking-widest">Logout</span>
                </button>
              </div>
            ) : (
              <Link 
                to="/admin/login"
                className="flex items-center space-x-2 bg-accent-gold text-white px-6 py-2 rounded-full text-sm uppercase tracking-widest font-bold hover:bg-gold-600 transition-all"
              >
                <User size={16} />
                <span>Admin Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-stone-900">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-stone-100 py-4 px-4 space-y-4 animate-in fade-in slide-in-from-top-4">
          {(!role || role === 'client') ? (
            <>
              <Link to="/" className="block text-sm uppercase tracking-widest text-stone-600" onClick={() => setIsOpen(false)}>Home</Link>
              <Link to="/gallery" className="block text-sm uppercase tracking-widest text-stone-600" onClick={() => setIsOpen(false)}>Gallery</Link>
              <Link to="/my-bookings" className="block text-sm uppercase tracking-widest text-stone-600" onClick={() => setIsOpen(false)}>My Bookings</Link>
              <Link to="/book" className="block text-sm uppercase tracking-widest text-stone-600" onClick={() => setIsOpen(false)}>Book Now</Link>
            </>
          ) : role === 'admin' ? (
            <>
              <Link to="/admin/dashboard?tab=calendar" className="block text-sm uppercase tracking-widest text-stone-600" onClick={() => setIsOpen(false)}>Calendar</Link>
              <Link to="/admin/dashboard?tab=bookings" className="block text-sm uppercase tracking-widest text-stone-600" onClick={() => setIsOpen(false)}>Bookings</Link>
              <Link to="/admin/dashboard?tab=presets" className="block text-sm uppercase tracking-widest text-stone-600" onClick={() => setIsOpen(false)}>Presets</Link>
              <Link to="/admin/dashboard?tab=community" className="block text-sm uppercase tracking-widest text-stone-600" onClick={() => setIsOpen(false)}>Community</Link>
              <Link to="/admin/dashboard?tab=users" className="block text-sm uppercase tracking-widest text-stone-600" onClick={() => setIsOpen(false)}>Users</Link>
            </>
          ) : (
            <Link to="/staff/dashboard" className="block text-sm uppercase tracking-widest text-stone-600" onClick={() => setIsOpen(false)}>Management</Link>
          )}
          <div className="border-t border-stone-100 pt-4">
            {(user && !user.isAnonymous) ? (
              <button onClick={handleLogout} className="block text-sm uppercase tracking-widest text-stone-400">Logout</button>
            ) : (
              <Link to="/admin/login" className="block text-sm uppercase tracking-widest text-accent-gold font-bold" onClick={() => setIsOpen(false)}>Admin Login</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
