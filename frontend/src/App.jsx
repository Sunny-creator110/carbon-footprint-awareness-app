import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { Leaf, LogIn, UserPlus, LogOut, Loader2 } from 'lucide-react';
import axios from 'axios';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState('landing'); // 'landing' | 'login' | 'register'
  
  // Auth Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserProfile();
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.body?.data || response.data?.data);
    } catch (err) {
      console.error('Failed to fetch user profile', err);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setLoading(true);

    try {
      if (authMode === 'register') {
        const res = await axios.post('/api/auth/register', { name, email, password });
        const data = res.data?.data || res.body?.data;
        setToken(data.token);
        setAuthSuccess('Account registered successfully!');
      } else {
        const res = await axios.post('/api/auth/login', { email, password });
        const data = res.data?.data || res.body?.data;
        setToken(data.token);
        setAuthSuccess('Logged in successfully!');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Authentication failed. Please try again.';
      setAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
    setUser(null);
    setAuthMode('landing');
  };

  return (
    <div 
      className="min-h-screen flex flex-col selection:bg-green-600 selection:text-white bg-cover bg-center bg-no-repeat relative transition-all duration-500"
      style={{ backgroundImage: user ? "url('/dashboard_bg.png')" : "url('/nature_bg.png')" }}
    >
      {/* Dynamic Background Dark Overlay to maintain 100% WCAG contrast while showing premium visuals */}
      <div className={`absolute inset-0 backdrop-blur-[2px] transition-colors duration-500 z-0 pointer-events-none ${user ? 'bg-[#080d1a]/93' : 'bg-[#080d1a]/82'}`} />

      {/* Skip to Content - Screen Reader A11y */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-green-600 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900 z-50"
      >
        Skip to main content
      </a>

      {/* Semantic Header */}
      <header className="border-b border-slate-800 bg-[#0f172a]/75 backdrop-blur-md sticky top-0 z-40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/10 rounded-lg text-green-400 border border-green-500/20">
              <Leaf className="h-6 w-6" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              EcoTrace
            </span>
          </div>

          {/* Semantic Navigation */}
          <nav className="flex items-center space-x-4" aria-label="Main Navigation">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-400 hidden sm:inline">
                  Welcome, <strong className="text-slate-200 font-semibold">{user.name}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900"
                  aria-label="Logout from account"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900 ${
                    authMode === 'login' ? 'bg-green-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900 ${
                    authMode === 'register' ? 'bg-green-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Register
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main id="main-content" className="flex-grow flex flex-col relative z-10" tabIndex="-1">
        {loading && !user && (
          <div className="flex-grow flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-green-500 animate-spin" />
            <span className="sr-only">Loading profile...</span>
          </div>
        )}

        {!loading && !user && authMode === 'landing' && (
          <div className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 text-center max-w-4xl mx-auto z-10 relative">
            <div className="p-3.5 bg-green-500/10 rounded-2xl text-green-400 border border-green-500/20 mb-6 animate-pulse">
              <Leaf className="h-12 w-12" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
              Trace Your Footprint.<br />
              <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Heal Our Planet.
              </span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
              Join a global community tracking daily carbon outputs, completing weekly sustainability challenges, unlocking green achievements, and earning rewards. One green action at a time.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 w-full sm:w-auto">
              <button
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900 shadow-xl shadow-green-950/30"
              >
                Start Your Green Journey
              </button>
              <button
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className="w-full sm:w-auto px-8 py-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-xl transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900"
              >
                Explore Dashboard
              </button>
            </div>
            
            {/* Value Props / Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
              <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md">
                <span className="text-2xl mb-3 block">📊</span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Real-Time Estimation</h2>
                <p className="text-xs text-slate-400 leading-relaxed">Log utility, travel, and eating habits using verified 2026 IPCC emission factors.</p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md">
                <span className="text-2xl mb-3 block">🏆</span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Gamified Milestones</h2>
                <p className="text-xs text-slate-400 leading-relaxed">Complete active weekly climate challenges, earn Eco Points, and collect climate badges.</p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md">
                <span className="text-2xl mb-3 block">💡</span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Tailored Insights</h2>
                <p className="text-xs text-slate-400 leading-relaxed">Receive personalized reduction advice focused on your highest carbon output categories.</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !user && (authMode === 'login' || authMode === 'register') && (
          <div className="flex-grow flex items-center justify-center p-6 z-10 relative">
            <div className="w-full max-w-md bg-[#0f172a]/80 border border-slate-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              
              {/* Back Button */}
              <button 
                onClick={() => { setAuthMode('landing'); setAuthError(''); setAuthSuccess(''); }}
                className="absolute top-4 left-4 text-xs font-semibold text-slate-400 hover:text-slate-200 transition flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900 rounded px-1 py-0.5"
                aria-label="Back to landing page"
              >
                <span>← Back</span>
              </button>

              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
              
              <div className="flex flex-col items-center mb-8 mt-4">
                <div className="p-3 bg-green-500/10 rounded-full text-green-400 border border-green-500/20 mb-3">
                  <Leaf className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  {authMode === 'login' 
                    ? 'Login to track your daily footprint carbon reductions' 
                    : 'Sign up to start your carbon-neutral journey'}
                </p>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-red-300 text-sm" role="alert">
                  {authError}
                </div>
              )}

              {authSuccess && (
                <div className="mb-4 p-3 bg-green-950/40 border border-green-500/30 rounded-lg text-green-300 text-sm" role="alert">
                  {authSuccess}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label htmlFor="auth-name" className="block text-sm font-medium text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900 transition duration-200"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="auth-email" className="block text-sm font-medium text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900 transition duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="auth-password" className="block text-sm font-medium text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900 transition duration-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-medium py-2.5 rounded-xl transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900 shadow-lg shadow-green-950/20"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : authMode === 'login' ? (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span>Log In</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-400">
                {authMode === 'login' ? (
                  <p>
                    Don't have an account?{' '}
                    <button
                      onClick={() => { setAuthMode('register'); setAuthError(''); }}
                      className="text-green-400 hover:text-green-300 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900 rounded-md px-1"
                    >
                      Sign Up
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button
                      onClick={() => { setAuthMode('login'); setAuthError(''); }}
                      className="text-green-400 hover:text-green-300 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900 rounded-md px-1"
                    >
                      Sign In
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {user && <Dashboard token={token} onLogout={handleLogout} />}
      </main>

      <footer className="bg-slate-950/95 py-6 border-t border-slate-900 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-xs">
          <p>&copy; {new Date().getFullYear()} EcoTrace Platform. Built to support absolute carbon neutrality.</p>
          <div className="flex space-x-4 mt-2 sm:mt-0">
            <a href="#" className="hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-950 rounded-md px-1">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-950 rounded-md px-1">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
