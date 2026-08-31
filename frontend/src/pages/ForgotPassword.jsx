import React, { useState } from 'react';
import axios from 'axios';
import { Mail, ArrowRight } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/forgot-password', { email });
      // Backend intentionally returns the same generic message whether or
      // not the email exists - we just show that message either way.
      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again in a moment.');
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
          Reset your password
        </h2>
        <p className="text-sm mb-8" style={{ color: '#5B6B73' }}>
          Enter the email associated with your admin account and we'll send you a reset link.
        </p>

        {submitted ? (
          <div className="p-4 text-sm rounded-xl font-medium border bg-emerald-50 text-emerald-800 border-emerald-200">
            If that email is registered, a reset link has been sent. Check your inbox
            (and spam folder) - the link expires in 30 minutes.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                className="text-xs font-bold uppercase tracking-widest flex items-center"
                style={{ color: '#174873' }}
              >
                <Mail size={14} className="mr-2" /> Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-xl outline-none transition-all border bg-white"
                style={{ borderColor: '#D9CDB0', color: '#1F2937' }}
                placeholder="admin@mmv.bhu.ac.in"
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
              <span>{loading ? 'SENDING…' : 'SEND RESET LINK'}</span>
              {!loading && <ArrowRight size={18} />}
            </button>

            <p className="text-center">
              <a href="/login" className="text-xs font-semibold" style={{ color: '#174873' }}>
                Back to sign in
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;