import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LogIn, User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

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
      
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('isAdmin', response.data.is_admin);
      localStorage.setItem('userEmail', email);

      if (response.data.is_admin) {
        navigate('/admin');
      } else {
        const profile = await axios.get('/user/me', {
          headers: { Authorization: `Bearer ${response.data.access_token}` }
        });
        const hasPrefs = (profile.data?.interests || []).length > 0 || (profile.data?.goals || []).length > 0 || (profile.data?.selected_problems || []).length > 0;
        navigate(hasPrefs ? '/' : '/recommendations');
      }
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1E3A8A] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]"></div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10">
        {/* Left Side: Brand */}
        <div className="hidden md:flex bhu-gradient p-12 flex-col justify-between text-white">
          <div>
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-xl">
                 <img src="https://img.icons8.com/color/96/university.png" alt="BHU" className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-bold leading-tight">MMV Student & Admin Portal</h1>
            <p className="mt-4 text-white/70">Access your academic records, personalized recommendations, and university notices.</p>
          </div>
          
          <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm font-medium bg-white/10 p-4 rounded-2xl border border-white/10">
                  <ShieldCheck className="text-secondary" />
                  <span>Secure JWT Authentication</span>
              </div>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.2em]">Banaras Hindu University, Varanasi</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-12 md:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
            <p className="text-muted mt-2">Enter your credentials to continue</p>
            <p className="text-xs text-muted mt-3">
              New student? <Link to="/signup" className="font-bold text-primary hover:underline">Create Account First</Link>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                <User size={14} className="mr-2" /> Email Address
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="student@bhu.ac.in"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                <Lock size={14} className="mr-2" /> Password
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl font-medium animate-pulse">
                {error}
              </div>
            )}

            <button 
              disabled={loading}
              className={`w-full py-5 bg-[#1E3A8A] text-white rounded-2xl font-bold text-sm tracking-widest flex items-center justify-center space-x-3 hover:bg-[#2563EB] transition-all shadow-xl shadow-blue-200 active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <span>{loading ? 'AUTHENTICATING...' : 'LOG IN TO PORTAL'}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-10 text-center text-xs text-muted">
            Problems logging in? <a href="#" className="font-bold text-primary hover:underline">Contact Dean's Office</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
