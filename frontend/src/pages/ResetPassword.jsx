import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This reset link is missing its token. Please use the link from your email.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/reset-password', { token, new_password: newPassword });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err?.response?.data?.detail || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#0F2E45' }}
    >
      <div
        className="max-w-md w-full rounded-2xl overflow-hidden p-10 shadow-2xl"
        style={{ backgroundColor: '#FAF6EC', border: '1px solid rgba(201,162,39,0.35)' }}
      >
        <h2
          className="text-2xl mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, color: '#174873' }}
        >
          Set a new password
        </h2>

        {done ? (
          <div className="p-4 text-sm rounded-xl font-medium border bg-emerald-50 text-emerald-800 border-emerald-200 mt-6">
            ✓ Password updated. Redirecting you to sign in…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest flex items-center" style={{ color: '#174873' }}>
                <Lock size={14} className="mr-2" /> New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-xl outline-none transition-all border bg-white"
                style={{ borderColor: '#D9CDB0', color: '#1F2937' }}
                placeholder="At least 8 characters"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest flex items-center" style={{ color: '#174873' }}>
                <Lock size={14} className="mr-2" /> Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-xl outline-none transition-all border bg-white"
                style={{ borderColor: '#D9CDB0', color: '#1F2937' }}
                placeholder="Re-enter new password"
              />
            </div>

            {error && (
              <div role="alert" className="p-4 text-sm rounded-xl font-medium border" style={{ backgroundColor: '#FBEAEA', color: '#9B2C2C', borderColor: '#F1C2C2' }}>
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-sm tracking-widest flex items-center justify-center space-x-3 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              style={{ backgroundColor: '#174873', color: '#FAF6EC' }}
            >
              <span>{loading ? 'UPDATING…' : 'UPDATE PASSWORD'}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;