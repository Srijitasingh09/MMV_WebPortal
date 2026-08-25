import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const FEEDBACK_CATEGORIES = ['General', 'Facilities', 'Academics', 'Hostel', 'Website Issue', 'Suggestion'];

const Feedback = () => {
  const location = useLocation();

  const [form, setForm] = useState({
    name: '',
    email: '',
    category: 'General',
    message: '',
  });
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setStatus('error');
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!form.email.trim()) {
      setStatus('error');
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!form.message.trim()) {
      setStatus('error');
      setErrorMsg('Please enter your feedback before submitting.');
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          category: form.category,
          message: form.message.trim(),
          page_url: location.pathname,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to submit feedback');
      }

      setStatus('success');
      setForm({ name: '', email: '', category: 'General', message: '' });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#EAEFF5]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-6 sm:pt-8 pb-16">
        {/* ── PAGE HEADING (matches Notices & other portal pages) ── */}
        <div className="border-b-2 border-[#d4af37] pb-2.5 sm:pb-4 flex flex-row items-end justify-between gap-2.5 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-1.5 sm:w-2 h-5 sm:h-8 md:h-9 bg-[#7d311f] rounded-full shrink-0" />
            <h1 className="text-[#0f3358] font-cinzel font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-tight leading-snug sm:leading-none truncate sm:whitespace-normal">
              Feedback & Suggestions
            </h1>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide flex items-center gap-1 sm:gap-1.5 shrink-0 text-right">
            <span className="text-slate-400">Home</span>
            <span className="text-slate-300">/</span>
            <span className="text-[#7d311f] font-semibold">Feedback</span>
          </div>
        </div>

        <p
          className="text-slate-600 text-sm sm:text-base mb-6 leading-relaxed max-w-4xl"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Have a suggestion, found something that isn't working, or want to tell us what we're
          doing right? Share it below -the college administration reviews every submission.
        </p>

        {/* ── SUCCESS STATE ── */}
        {status === 'success' ? (
          <div className="bg-white border border-emerald-200 rounded-xl p-6 sm:p-10 text-center shadow-sm max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#0f3358] mb-1">Thank you for your feedback</h2>
            <p className="text-sm text-slate-500 mb-5">It has been sent to the college administration.</p>
            <button
              onClick={() => setStatus('idle')}
              className="px-6 py-2.5 text-sm font-semibold rounded-full bg-[#174873] text-white hover:bg-[#0f3358] transition-colors"
            >
              Submit another response
            </button>
          </div>
        ) : (
          /* ── FORM ── */
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-sm space-y-6"
          >
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-[#0f3358] mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange('name')}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#174873] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0f3358] mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#174873] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0f3358] mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={handleChange('category')}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#174873] focus:border-transparent bg-white"
              >
                {FEEDBACK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0f3358] mb-1.5">
                Your Feedback / Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.message}
                onChange={handleChange('message')}
                required
                rows={6}
                placeholder="Tell us what's on your mind..."
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#174873] focus:border-transparent resize-none"
              />
            </div>

            {status === 'error' && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-600">
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full sm:w-auto px-8 py-3 text-sm font-bold rounded-full bg-[#174873] text-white hover:bg-[#0f3358] transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {status === 'submitting' ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Feedback;