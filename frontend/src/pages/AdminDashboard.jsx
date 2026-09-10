import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Bell, Send, Paperclip, Phone, FileText, Newspaper, X } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import AdminReadme from './adminreadme';
import ChangePasswordForm from './ChangePasswordForm';
import { getToken as getSessionToken, clearSession } from '../utils/auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const NOTICE_TITLE_MAX = 100;
const NOTICE_CONTENT_MAX = 1000;
const NEWS_TEXT_MAX = 2000;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('notice');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [noticeAttachment, setNoticeAttachment] = useState(null);

  const [notice, setNotice] = useState({
    title: '',
    content: '',
    category: 'General',
    display_date: '',
    start_date: '',
    end_date: ''
  });
  const navigate = useNavigate();

  const noticeAttachmentInputRef = useRef(null);

  // ── NEWS TAB STATE ──
  const [newsText, setNewsText] = useState('');
  const [newsDates, setNewsDates] = useState({
    display_date: '',
    start_date: '',
    end_date: ''
  });
  const [newsAttachments, setNewsAttachments] = useState([]);
  const newsAttachmentInputRef = useRef(null);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const [contactInfoForm, setContactInfoForm] = useState({
    address: '',
    phone: '',
    email: '',
    office_hours: '',
    map_embed_url: ''
  });

  const getToken = () => getSessionToken();
  const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

  const fetchAdminData = async () => {
    try {
      const contactInfoRes = await axios.get(`${API_BASE}/contact-info`).catch(() => ({ data: null }));
      if (contactInfoRes?.data) {
        setContactInfoForm({
          address: contactInfoRes.data.address || '',
          phone: contactInfoRes.data.phone || '',
          email: contactInfoRes.data.email || '',
          office_hours: contactInfoRes.data.office_hours || '',
          map_embed_url: contactInfoRes.data.map_embed_url || ''
        });
      }
    } catch (err) {
      // Fallback gracefully
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSubmitNotice = async (e) => {
    e.preventDefault();
    if (notice.title.length > NOTICE_TITLE_MAX || notice.content.length > NOTICE_CONTENT_MAX) {
      alert(`Title must be within ${NOTICE_TITLE_MAX} chars and content within ${NOTICE_CONTENT_MAX} chars.`);
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', notice.title);
      formData.append('content', notice.content);
      formData.append('category', notice.category);

      // Only append dates if set, never pass empty strings
      if (notice.display_date && notice.display_date.trim()) {
        formData.append('display_date', notice.display_date.trim());
      }
      if (notice.start_date && notice.start_date.trim()) {
        formData.append('start_date', notice.start_date.trim());
      }
      if (notice.end_date && notice.end_date.trim()) {
        formData.append('end_date', notice.end_date.trim());
      }
      if (noticeAttachment) {
        formData.append('attachment', noticeAttachment);
      }

      await axios.post(`${API_BASE}/admin/notice`, formData, {
        headers: {
          ...authHeader(),
          'Content-Type': 'multipart/form-data'
        }
      });

      setNotice({
        title: '',
        content: '',
        category: 'General',
        display_date: '',
        start_date: '',
        end_date: ''
      });
      setNoticeAttachment(null);
      if (noticeAttachmentInputRef.current) noticeAttachmentInputRef.current.value = '';
      showSuccess('Notice published successfully!');
    } catch (err) {
      alert('Error creating notice: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleNewsFilesChange = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;
    setNewsAttachments((prev) => [...prev, ...picked]);
    if (newsAttachmentInputRef.current) newsAttachmentInputRef.current.value = '';
  };

  const removeNewsAttachment = (index) => {
    setNewsAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitNews = async (e) => {
    e.preventDefault();
    if (!newsText.trim()) {
      alert('News text cannot be empty — the first line becomes the heading.');
      return;
    }

    if (newsText.length > NEWS_TEXT_MAX) {
      alert(`News text exceeds the maximum allowed limit of ${NEWS_TEXT_MAX} characters.`);
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('text', newsText);
      if (newsDates.display_date && newsDates.display_date.trim()) {
        formData.append('display_date', newsDates.display_date.trim());
      }
      if (newsDates.start_date && newsDates.start_date.trim()) {
        formData.append('start_date', newsDates.start_date.trim());
      }
      if (newsDates.end_date && newsDates.end_date.trim()) {
        formData.append('end_date', newsDates.end_date.trim());
      }
      newsAttachments.forEach((file) => {
        formData.append('attachments', file);
      });

      await axios.post(`${API_BASE}/admin/news`, formData, {
        headers: {
          ...authHeader(),
          'Content-Type': 'multipart/form-data'
        }
      });

      setNewsText('');
      setNewsDates({ display_date: '', start_date: '', end_date: '' });
      setNewsAttachments([]);
      if (newsAttachmentInputRef.current) newsAttachmentInputRef.current.value = '';
      showSuccess('News published successfully!');
    } catch (err) {
      alert('Error creating news: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitContactInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API_BASE}/admin/contact-info`, contactInfoForm, { headers: authHeader() });
      showSuccess('Contact info updated successfully!');
    } catch (err) {
      alert('Error updating contact info.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 font-lato">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-gray-900">Admin Control Panel</h1>
          <p className="text-muted text-xs sm:text-sm mt-1">Manage portal notices, news, contact details, and view administrator documentation</p>
        </div>

        <button
          onClick={handleLogout}
          className="self-start sm:self-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm sm:text-base font-bold shadow-xs transition-colors"
        >
          Logout
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold animate-in fade-in">
          ✓ {success}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
        <button
          onClick={() => setActiveTab('notice')}
          className={`flex items-center px-4 py-3 text-sm font-bold transition-all rounded-xl border ${activeTab === 'notice' ? 'border-primary text-primary bg-blue-50/40' : 'border-gray-200 text-slate-600 bg-white'}`}
        >
          <Bell size={18} className="mr-2 text-[#7d311f]" /> CREATE NOTICE
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`flex items-center px-4 py-3 text-sm font-bold transition-all rounded-xl border ${activeTab === 'news' ? 'border-primary text-primary bg-blue-50/40' : 'border-gray-200 text-slate-600 bg-white'}`}
        >
          <Newspaper size={18} className="mr-2 text-[#7d311f]" /> CREATE NEWS
        </button>
        <button
          onClick={() => setActiveTab('contact-info')}
          className={`flex items-center px-4 py-3 text-sm font-bold transition-all rounded-xl border ${activeTab === 'contact-info' ? 'border-primary text-primary bg-blue-50/40' : 'border-gray-200 text-slate-600 bg-white'}`}
        >
          <Phone size={18} className="mr-2 text-[#7d311f]" /> CONTACT INFO
        </button>
        <button
          onClick={() => setActiveTab('admin-readme')}
          className={`flex items-center px-4 py-3 text-sm font-bold transition-all rounded-xl border ${activeTab === 'admin-readme' ? 'border-primary text-primary bg-blue-50/40' : 'border-gray-200 text-slate-600 bg-white'}`}
        >
          <FileText size={18} className="mr-2 text-[#7d311f]" /> ADMIN README
        </button>
        <button
          onClick={() => setActiveTab('change-password')}
          className={`flex items-center px-4 py-3 text-sm font-bold transition-all rounded-xl border ${activeTab === 'change-password' ? 'border-primary text-primary bg-blue-50/40' : 'border-gray-200 text-slate-600 bg-white'}`}
        >
          <FileText size={18} className="mr-2 text-[#7d311f]" /> CHANGE PASSWORD
        </button>
      </div>

      {/* Create Notice Tab */}
      {activeTab === 'notice' && (
        <form onSubmit={handleSubmitNotice} className="bg-white p-5 sm:p-8 md:p-10 rounded-2xl shadow-sm border border-gray-200 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Notice Title
              </label>
              <span className={`text-xs ${notice.title.length >= NOTICE_TITLE_MAX ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                {notice.title.length}/{NOTICE_TITLE_MAX}
              </span>
            </div>
            <input
              required
              maxLength={NOTICE_TITLE_MAX}
              value={notice.title}
              onChange={(e) => setNotice({ ...notice, title: e.target.value })}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="e.g., End Semester Exam Schedule"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Category</label>
              <select
                value={notice.category}
                onChange={(e) => setNotice({...notice, category: e.target.value})}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
              >
                <option>General</option>
                <option>Exam</option>
                <option>Holiday</option>
                <option>Admission</option>
                <option>Event</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center">
                <Paperclip size={14} className="mr-2 text-[#7d311f]" /> Attachment (PDF/Image)
              </label>
              <input
                ref={noticeAttachmentInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(e) => setNoticeAttachment(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none text-sm"
              />
              {noticeAttachment && (
                <p className="text-xs text-slate-500">Selected file: {noticeAttachment.name}</p>
              )}
            </div>
          </div>

          {/* Date Controls for Notice */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Display Date (Back-dating)
              </label>
              <input
                type="datetime-local"
                value={notice.display_date}
                onChange={(e) => setNotice({ ...notice, display_date: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs"
              />
              <p className="text-[11px] text-slate-400">Date shown to users (defaults to Start Date)</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Start Date (Goes Live)
              </label>
              <input
                type="datetime-local"
                value={notice.start_date}
                onChange={(e) => setNotice({ ...notice, start_date: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs"
              />
              <p className="text-[11px] text-slate-400">Hidden until this date (defaults to today)</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                End Date (Home Expiry)
              </label>
              <input
                type="datetime-local"
                value={notice.end_date}
                onChange={(e) => setNotice({ ...notice, end_date: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs"
              />
              <p className="text-[11px] text-slate-400">Expires from home after this (defaults to 1 week)</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Notice Details / Content
              </label>
              <span className={`text-xs ${notice.content.length >= NOTICE_CONTENT_MAX ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                {notice.content.length}/{NOTICE_CONTENT_MAX}
              </span>
            </div>
            <textarea
              rows={5}
              maxLength={NOTICE_CONTENT_MAX}
              value={notice.content}
              onChange={(e) => setNotice({ ...notice, content: e.target.value })}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Enter full notice announcement text..."
            />
          </div>

          <button
            disabled={loading}
            className="w-full py-4 sm:py-5 bg-primary text-white rounded-2xl font-bold tracking-widest hover:bg-[#174873] transition-colors flex items-center justify-center shadow-sm"
          >
            <Send size={18} className="mr-3" />
            {loading ? 'POSTING NOTICE...' : 'PUBLISH NOTICE'}
          </button>
        </form>
      )}

      {/* Create News Tab */}
      {activeTab === 'news' && (
        <form onSubmit={handleSubmitNews} className="bg-white p-5 sm:p-8 md:p-10 rounded-2xl shadow-sm border border-gray-200 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div>
            <h3 className="font-bold text-lg text-primary font-serif">Publish News</h3>
            <p className="text-slate-600 text-sm mt-1">
              Type the story as one block of text — the first line becomes the headline,
              everything after it becomes the body. Attach any number of photos or PDFs below.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                News Text (first line = headline)
              </label>
              <span className={`text-xs ${newsText.length >= NEWS_TEXT_MAX ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                {newsText.length}/{NEWS_TEXT_MAX}
              </span>
            </div>
            <textarea
              required
              rows={8}
              maxLength={NEWS_TEXT_MAX}
              value={newsText}
              onChange={(e) => setNewsText(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
              placeholder={'MMV Students Win National Debate Championship\nWrite the full story here. It can span as many lines as you need...'}
            />
          </div>

          {/* Date Controls for News */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Display Date (Back-dating)
              </label>
              <input
                type="datetime-local"
                value={newsDates.display_date}
                onChange={(e) => setNewsDates({ ...newsDates, display_date: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs"
              />
              <p className="text-[11px] text-slate-400">Date shown to users (defaults to Start Date)</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Start Date (Goes Live)
              </label>
              <input
                type="datetime-local"
                value={newsDates.start_date}
                onChange={(e) => setNewsDates({ ...newsDates, start_date: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs"
              />
              <p className="text-[11px] text-slate-400">Hidden until this date (defaults to today)</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                End Date (Home Expiry)
              </label>
              <input
                type="datetime-local"
                value={newsDates.end_date}
                onChange={(e) => setNewsDates({ ...newsDates, end_date: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs"
              />
              <p className="text-[11px] text-slate-400">Expires from home after this (defaults to 1 week)</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center">
              <Paperclip size={14} className="mr-2 text-[#7d311f]" /> Attachments (Images / PDFs — any number)
            </label>
            <input
              ref={newsAttachmentInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={handleNewsFilesChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none text-sm"
            />

            {newsAttachments.length > 0 && (
              <ul className="space-y-1.5 pt-1">
                {newsAttachments.map((file, idx) => (
                  <li
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between gap-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-slate-700"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeNewsAttachment(idx)}
                      className="p-1 rounded-full text-red-500 hover:bg-red-50 shrink-0"
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            disabled={loading}
            className="w-full py-4 sm:py-5 bg-primary text-white rounded-2xl font-bold tracking-widest hover:bg-[#174873] transition-colors flex items-center justify-center shadow-sm"
          >
            <Send size={18} className="mr-3" />
            {loading ? 'POSTING NEWS...' : 'PUBLISH NEWS'}
          </button>
        </form>
      )}

      {/* Contact Info Tab */}
      {activeTab === 'contact-info' && (
        <form onSubmit={handleSubmitContactInfo} className="bg-white p-5 sm:p-8 md:p-10 rounded-2xl shadow-sm border border-gray-200 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div>
            <h3 className="font-bold text-lg text-primary font-serif">Contact Page Details</h3>
            <p className="text-slate-600 text-sm mt-1">
              This information appears on the public Contact Us page, along with the interactive map.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Office Address</label>
            <textarea
              rows={3}
              value={contactInfoForm.address}
              onChange={(e) => setContactInfoForm({ ...contactInfoForm, address: e.target.value })}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="e.g., Mahila Mahavidyalaya, Banaras Hindu University, Varanasi, Uttar Pradesh 221005"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Phone Number</label>
              <input
                value={contactInfoForm.phone}
                onChange={(e) => setContactInfoForm({ ...contactInfoForm, phone: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g., +91 542 230 7220"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                value={contactInfoForm.email}
                onChange={(e) => setContactInfoForm({ ...contactInfoForm, email: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g., principal_mmv@bhu.ac.in"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Office Working Hours</label>
            <input
              value={contactInfoForm.office_hours}
              onChange={(e) => setContactInfoForm({ ...contactInfoForm, office_hours: e.target.value })}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="e.g., Mon–Sat, 10:00 AM – 5:00 PM"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Google Maps Embed URL (optional)
            </label>
            <input
              value={contactInfoForm.map_embed_url}
              onChange={(e) => setContactInfoForm({ ...contactInfoForm, map_embed_url: e.target.value })}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Paste the 'src' link from Google Maps > Share > Embed a map"
            />
            <p className="text-xs text-slate-500">
              Leave blank to auto-generate map location from address.
            </p>
          </div>

          <button
            disabled={loading}
            className="w-full py-4 sm:py-5 bg-primary text-white rounded-2xl font-bold tracking-widest hover:bg-[#174873] transition-colors flex items-center justify-center shadow-sm"
          >
            <Send size={18} className="mr-3" />
            {loading ? 'SAVING DETAILS...' : 'SAVE CONTACT INFO'}
          </button>
        </form>
      )}

      {activeTab === 'admin-readme' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <AdminReadme />
        </div>
      )}

      {activeTab === 'change-password' && <ChangePasswordForm />}
    </div>
  );
};

export default AdminDashboard;