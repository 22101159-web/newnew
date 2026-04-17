import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, ArrowLeft } from 'lucide-react';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simple local check for demo/AI Studio purposes
    const storedUsers = JSON.parse(localStorage.getItem('emis_users') || '[]');
    const normalizedInput = username.trim().toLowerCase();
    
    // Find user by email or name (case-insensitive)
    const foundUser = storedUsers.find(u => 
      (u.email?.toLowerCase() === normalizedInput || u.name?.toLowerCase() === normalizedInput) && 
      u.password === password
    );

    if (username === 'Admin123' && password === 'Admin123') {
      const sessionData = {
        uid: 'admin_123',
        name: 'System Admin',
        role: 'admin'
      };
      localStorage.setItem('admin_session', JSON.stringify(sessionData));
      window.location.href = '/admin/dashboard';
    } else if (foundUser) {
      const sessionData = {
        uid: foundUser.id,
        name: foundUser.name,
        role: foundUser.role
      };
      localStorage.setItem('admin_session', JSON.stringify(sessionData));
      
      // Redirect based on role
      if (foundUser.role === 'admin') {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/staff/dashboard';
      }
    } else {
      // Check if user exists but password is wrong to provide better feedback
      const userExists = storedUsers.some(u => 
        u.email?.toLowerCase() === normalizedInput || u.name?.toLowerCase() === normalizedInput
      );
      
      if (userExists) {
        setError('Incorrect password. Please try again.');
      } else {
        setError('User not found. Check your username/email.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-6">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors uppercase tracking-widest text-xs font-bold"
      >
        <ArrowLeft size={18} /> Back to Previous Page
      </button>
      
      <div className="bg-white p-12 rounded-[40px] border border-stone-200 shadow-2xl w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-[0.5em] text-accent-gold">System Access</span>
          <h1 className="text-4xl font-serif italic text-stone-900">Admin Login</h1>
          <p className="text-xs uppercase tracking-widest text-stone-400">
            Enter your credentials to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                required
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin123"
                className="w-full pl-12 pr-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-accent-gold transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest font-bold text-stone-500">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                required
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-accent-gold transition-all"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 uppercase tracking-widest text-center font-bold">{error}</p>
          )}

          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-stone-900 text-white py-5 rounded-full font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Login to Dashboard'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
