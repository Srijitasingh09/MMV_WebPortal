import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Lock, ArrowRight, ShieldCheck, GraduationCap } from 'lucide-react';
import { setSession, isAdmin } from '../utils/auth';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', email); // FastAPI OAuth2 expects 'username'
      formData.append('password', password);

      const response = await axios.post('/login', formData);

      // Stored per-tab (sessionStorage) instead of browser-wide
      // (localStorage), so signing in here doesn't affect any other
      // open tab. The role itself now lives inside the signed token
      // (see utils/auth.js isAdmin()) rather than a separate flag.
      setSession(response.data.access_token, email);

      if (isAdmin()) {
        navigate('/admin');
      } else {
        const profile = await axios.get('/user/me', {
          headers: { Authorization: `Bearer ${response.data.access_token}` }
        });
        const hasPrefs = (profile.data?.interests || []).length > 0 || (profile.data?.goals || []).length > 0 || (profile.data?.selected_problems || []).length > 0;
        navigate(hasPrefs ? '/home' : '/recommendations');
      }
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundColor: '#0F2E45',
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgba(201,162,39,0.10), transparent 45%), radial-gradient(circle at 80% 85%, rgba(201,162,39,0.08), transparent 50%)',
      }}
    >
      {/* fine rule texture, evokes engraved letterhead rather than a generic blurred blob */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 3px)',
        }}
      />

      <div
        className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden relative z-10 shadow-2xl"
        style={{ backgroundColor: '#FAF6EC', border: '1px solid rgba(201,162,39,0.35)' }}
      >
        {/* Left: institutional credential panel */}
        <div
          className="hidden md:flex flex-col justify-between p-12 text-white relative"
          style={{ backgroundColor: '#174873' }}
        >
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 14px)',
            }}
          />

          <div className="relative">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-8 border-2"
              style={{ borderColor: '#C9A227', backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <img
                src="https://img.icons8.com/color/96/university.png"
                alt="Banaras Hindu University"
                className="w-9 h-9"
              />
            </div>

            <p
              className="text-[11px] uppercase tracking-[0.3em] mb-3"
              style={{ color: '#C9A227' }}
            >
              Banaras Hindu University
            </p>
            <h1
              className="text-4xl leading-tight mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
            >
              Mahila Mahavidyalaya
              <br />
              Admin Portal
            </h1>
            <p className="text-sm text-white/70 leading-relaxed max-w-xs">
              Access reserved for college administrators to manage notices,
              faculty pages, and institutional content.
            </p>
          </div>

          <div className="relative space-y-4">
            <div
              className="flex items-center space-x-3 text-sm font-medium p-4 rounded-xl border"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}
            >
              <ShieldCheck size={18} style={{ color: '#C9A227' }} />
              <span>Secured with JWT authentication</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-white/40 uppercase tracking-[0.2em]">
              <span className="h-px w-6" style={{ backgroundColor: '#C9A227' }} />
              <span>Est. 1916 &middot; Varanasi</span>
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="p-10 md:p-14 flex flex-col justify-center" style={{ backgroundColor: '#FAF6EC' }}>
          <div className="mb-10 flex items-start justify-between">
            <div>
              <h2
                className="text-3xl"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, color: '#174873' }}
              >
                Admin Sign In
              </h2>
              <p className="text-sm mt-2" style={{ color: '#5B6B73' }}>
                Enter your credentials to continue
              </p>
            </div>
            <GraduationCap size={28} style={{ color: '#C9A227' }} className="shrink-0 mt-1" />
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label
                className="text-xs font-bold uppercase tracking-widest flex items-center"
                style={{ color: '#174873' }}
              >
                <User size={14} className="mr-2" /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-4 rounded-xl outline-none transition-all border bg-white"
                style={{ borderColor: '#D9CDB0', color: '#1F2937' }}
                onFocus={(e) => (e.target.style.borderColor = '#174873')}
                onBlur={(e) => (e.target.style.borderColor = '#D9CDB0')}
                placeholder="admin@mmv.bhu.ac.in"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-xs font-bold uppercase tracking-widest flex items-center"
                style={{ color: '#174873' }}
              >
                <Lock size={14} className="mr-2" /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-4 rounded-xl outline-none transition-all border bg-white"
                style={{ borderColor: '#D9CDB0', color: '#1F2937' }}
                onFocus={(e) => (e.target.style.borderColor = '#174873')}
                onBlur={(e) => (e.target.style.borderColor = '#D9CDB0')}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="p-4 text-sm rounded-xl font-medium border"
                style={{ backgroundColor: '#FBEAEA', color: '#9B2C2C', borderColor: '#F1C2C2' }}
              >
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-sm tracking-widest flex items-center justify-center space-x-3 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              style={{ backgroundColor: '#174873', color: '#FAF6EC' }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#1F5A8C';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#174873';
              }}
            >
              <span>{loading ? 'AUTHENTICATING…' : 'SIGN IN TO PORTAL'}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-10 text-[11px] text-center uppercase tracking-[0.2em]" style={{ color: '#A89B7C' }}>
            MMV Web Portal &middot; Restricted Access
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;