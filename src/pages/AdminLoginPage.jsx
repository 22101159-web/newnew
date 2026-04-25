import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, ArrowLeft } from 'lucide-react';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any stale local login state on page load
    localStorage.removeItem('admin_session');
    localStorage.removeItem('token');
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Call Node API for login
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password })
    })
    .then(async (res) => {
      const contentType = res.headers.get('content-type');
      let errDetail = 'Login failed';
      
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok) return data;
        
        // Handle FastAPI validation error detail
        let detail = data.detail || 'Login failed';
        if (typeof detail !== 'string') {
          detail = JSON.stringify(detail);
        }
        errDetail = detail;
      } else {
        errDetail = await res.text() || errDetail;
      }
      
      throw new Error(String(errDetail));
    })
    .then(data => {
      const token = data.access_token;
      localStorage.setItem('token', token);
      
      // Fetch user profile
      return fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    })
    .then(async (res) => {
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to fetch user profile');
      }
      return res.json();
    })
    .then(user => {
      const sessionData = {
        uid: user.id,
        name: user.name,
        role: user.role
      };
      localStorage.setItem('admin_session', JSON.stringify(sessionData));
      
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/staff/dashboard');
      }
    })
    .catch(err => {
      console.error('Login flow error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Invalid username or password.');
      setLoading(false);
    });
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
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                <p className="text-[10px] text-red-600 uppercase tracking-widest text-center font-bold break-all">
                  {String(error)}
                </p>
              </div>
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <p className="text-[10px] text-stone-400 uppercase tracking-widest text-center">
                  Try: admin123 / admin123<br/>
                  (Username is NOT case-sensitive)
                </p>
              </div>
            </div>
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
