import React, { useState } from 'react';
import axios from 'axios';
import { KeyRound, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { getToken } from '../utils/auth';

const ChangePasswordForm = () => {
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.new_password.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (form.new_password === form.current_password) {
      setError('New password must be different from the current password.');
      return;
    }

    setLoading(true);
    try {
      await axios.put(
        '/admin/change-password',
        {
          current_password: form.current_password,
          new_password: form.new_password,
        },
        { headers: authHeader() }
      );
      setSuccess('Password updated successfully.');
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-5 sm:p-8 md:p-10 rounded-2xl shadow-sm border border-gray-200 space-y-6 animate-in slide-in-from-bottom-4 duration-500 max-w-lg"
    >
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50/60 flex items-center justify-center shrink-0">
          <KeyRound size={20} className="text-primary" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">Change Admin Password</h3>
          <p className="text-xs text-muted mt-1">
            You'll need your current password to confirm this change.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center">
          <Lock size={14} className="mr-2" /> Current Password
        </label>
        <div className="relative">
          <input
            required
            type={showCurrent ? 'text' : 'password'}
            value={form.current_password}
            onChange={handleChange('current_password')}
            autoComplete="current-password"
            className="w-full px-4 py-3 pr-11 rounded-xl outline-none transition-all border border-gray-200 bg-white focus:border-primary text-sm"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center">
          <Lock size={14} className="mr-2" /> New Password
        </label>
        <div className="relative">
          <input
            required
            minLength={8}
            type={showNew ? 'text' : 'password'}
            value={form.new_password}
            onChange={handleChange('new_password')}
            autoComplete="new-password"
            className="w-full px-4 py-3 pr-11 rounded-xl outline-none transition-all border border-gray-200 bg-white focus:border-primary text-sm"
            placeholder="At least 8 characters"
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center">
          <ShieldCheck size={14} className="mr-2" /> Confirm New Password
        </label>
        <input
          required
          minLength={8}
          type={showNew ? 'text' : 'password'}
          value={form.confirm_password}
          onChange={handleChange('confirm_password')}
          autoComplete="new-password"
          className="w-full px-4 py-3 rounded-xl outline-none transition-all border border-gray-200 bg-white focus:border-primary text-sm"
          placeholder="Re-enter new password"
        />
      </div>

      {error && (
        <div role="alert" className="p-3 text-sm rounded-xl font-medium border bg-red-50 text-red-700 border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold">
          ✓ {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-5 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-xs transition-colors hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'UPDATING…' : 'UPDATE PASSWORD'}
      </button>
    </form>
  );
};

export default ChangePasswordForm;