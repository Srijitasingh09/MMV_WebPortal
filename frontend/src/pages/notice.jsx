import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getToken, isAdmin as isAdminSession } from '../utils/auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TITLE_MAX_LENGTH = 100;
const CONTENT_MAX_LENGTH = 1000;

const CATEGORIES = ['All', 'Exam', 'Holiday', 'Admission', 'Event', 'General'];
const EDITABLE_CATEGORIES = CATEGORIES.filter((c) => c !== 'All');

const CATEGORY_STYLES = {
  Exam:      { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500' },
  Holiday:   { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Admission: { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  Event:     { bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-500' },
  General:   { bg: 'bg-slate-100',  text: 'text-slate-600',   dot: 'bg-slate-400' },
};

function getCategoryStyle(category) {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.General;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-IN', {
    
    month: 'long',
    year: 'numeric',
  });
}

function formatNoticeDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function getNoticeMonthYear(dateString) {
  if (!dateString) return 'General Notices';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'General Notices';
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ============================================
// SHARED: CATEGORY TAG + DATE ROW
// ============================================
const MetaRow = ({ notice }) => {
  const style = getCategoryStyle(notice.category);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          {notice.category || 'General'}
        </span>
        <time className="text-xs text-gray-500" dateTime={notice.created_at}>
          {formatDate(notice.created_at)}
        </time>
      </div>
    </div>
  );
};

// ============================================
// ATTACHMENT LINK
// ============================================
const AttachmentLink = ({ notice }) => {
  if (!notice.attachment_url) return null;
  return (
    <a
      href={`${API_BASE}${notice.attachment_url}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-secondary hover:text-[#406BC7] hover:underline transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
      {notice.attachment_name || 'View attachment'}
    </a>
  );
};

// ============================================
// NOTICE DETAILS CARD -full notice view (+ admin edit)
// Rendered on its own dedicated page (/notices/:id), the way the official
// BHU portal opens a full "Notice/Event Details" page instead of a popup.
// ============================================
const NoticeDetailsCard = ({ notice, isAdmin, onDelete, onSave, onDeleted }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: notice.title || '',
    content: notice.content || '',
    category: notice.category || 'General',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!editForm.title.trim() || !editForm.content.trim()) return;

    if (editForm.title.length > TITLE_MAX_LENGTH || editForm.content.length > CONTENT_MAX_LENGTH) {
      alert(`Title must be within ${TITLE_MAX_LENGTH} characters and content within ${CONTENT_MAX_LENGTH} characters.`);
      return;
    }

    setSaving(true);
    try {
      await onSave(notice.id, editForm);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this notice? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await onDelete(notice.id);
      if (onDeleted) onDeleted();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="relative bg-white rounded-xl shadow-md border border-slate-200 w-full max-w-5xl mx-auto">
      <div className="p-6 sm:p-8">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-secondary"
                >
                  {EDITABLE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Title</label>
                  <span className={`text-xs ${editForm.title.length >= TITLE_MAX_LENGTH ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                    {editForm.title.length}/{TITLE_MAX_LENGTH}
                  </span>
                </div>
                <input
                  value={editForm.title}
                  maxLength={TITLE_MAX_LENGTH}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg font-bold text-primary outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="Notice title"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Content</label>
                  <span className={`text-xs ${editForm.content.length >= CONTENT_MAX_LENGTH ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                    {editForm.content.length}/{CONTENT_MAX_LENGTH}
                  </span>
                </div>
                <textarea
                  value={editForm.content}
                  maxLength={CONTENT_MAX_LENGTH}
                  onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm leading-relaxed outline-none focus:ring-2 focus:ring-secondary resize-y"
                  placeholder="Notice content"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t">
                <button
                  onClick={() => {
                    setEditForm({ title: notice.title || '', content: notice.content || '', category: notice.category || 'General' });
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-secondary text-white rounded-lg text-sm font-semibold hover:bg-primary disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 mb-3">
                <MetaRow notice={notice} />
                {isAdmin && (
                  <div className="flex gap-2 shrink-0 -mt-3">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 border-2 border-secondary text-secondary rounded-lg text-xs font-semibold hover:bg-secondary hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-3 py-1.5 border-2 border-red-500 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>

              <h1
                className="text-2xl sm:text-3xl font-bold text-primary mb-4 leading-snug"
                style={{ fontFamily: "'Mirava', 'Mirava Sans', 'Plus Jakarta Sans', sans-serif" }}
              >
                {notice.title}
              </h1>

              <p
                className="text-gray-700 text-base sm:text-lg leading-relaxed whitespace-pre-wrap"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {notice.content}
              </p>

              <AttachmentLink notice={notice} />
            </>
          )}
      </div>
    </div>
  );
};

// ============================================
// NOTICE DETAILS PAGE -dedicated route (/notices/:id)
// ============================================
const NoticeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const cameFromHome = location.state?.from === 'home';
  const backTo = cameFromHome ? '/home#live-notices-news' : '/notices';
  const backLabel = cameFromHome ? 'Back to Home' : 'Back to all Notices';

  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = isAdminSession();
  const token = getToken();

  // Always open this page scrolled to the top, regardless of where the
  // user scrolled to on the page they navigated from (e.g. the Home page).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const fetchNotice = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/notices`);
        if (!res.ok) throw new Error('Failed to load notice');
        const data = await res.json();
        const found = data.find((n) => String(n.id) === String(id));
        if (!cancelled) {
          setNotice(found || null);
          setError(found ? null : 'This notice could not be found. It may have been removed.');
        }
      } catch (err) {
        if (!cancelled) setError('Could not load this notice right now. Please try again in a moment.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchNotice();
    return () => { cancelled = true; };
  }, [id]);

  const handleDeleteNotice = async (noticeId) => {
    try {
      await axios.delete(`${API_BASE}/admin/notice/${noticeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.detail || err.message));
      throw err;
    }
  };

  const handleSaveNotice = async (noticeId, updates) => {
    try {
      const res = await axios.put(`${API_BASE}/admin/notice/${noticeId}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = res.data || { ...updates };
      setNotice((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-[#EAEFF5]">
      <div className="max-w-5xl mx-auto px-4 pt-6 sm:pt-8 pb-12">
        {/* Page heading, consistent with the Notices list page */}
        <div className="border-b-2 border-[#d4af37] pb-2.5 sm:pb-4 flex flex-row items-end justify-between gap-2.5 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-1.5 sm:w-2 h-5 sm:h-8 md:h-9 bg-crimson rounded-full shrink-0" />
            <h1 className="text-primary font-cinzel font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-tight leading-snug sm:leading-none truncate sm:whitespace-normal">
              Notice Details
            </h1>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide flex items-center gap-1 sm:gap-1.5 shrink-0 text-right">
            <Link to="/home" className="text-slate-400 hover:text-secondary">Home</Link>
            <span className="text-slate-300">/</span>
            <Link to="/notices" className="text-slate-400 hover:text-secondary">Notices</Link>
            <span className="text-slate-300">/</span>
            <span className="text-crimson font-semibold">Details</span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mb-4">
          <button
            onClick={() => navigate(backTo)}
            className="inline-flex items-center gap-1.5 font-lato text-sm font-bold text-crimson hover:text-[#C4561A] transition-colors"
          >
            <span className="text-base font-bold">←</span>
            <span>{backLabel}</span>
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-8 h-8 border-[3px] border-gray-200 border-t-secondary rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading notice...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-600 font-medium mb-1">Something went wrong</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && notice && (
          <NoticeDetailsCard
            notice={notice}
            isAdmin={isAdmin}
            onDelete={handleDeleteNotice}
            onSave={handleSaveNotice}
            onDeleted={() => navigate(backTo)}
          />
        )}
      </div>
    </div>
  );
};

// ============================================
// LIGHT NOTICE ROW (reduced size, matching BHU portal figure)
// ============================================
const NoticeRow = ({ notice, isAdmin, onDelete }) => {
  // Check if notice was posted recently (e.g., within last 14 days)
  const isNew = (() => {
    if (!notice.created_at) return true;
    const diffDays = (new Date() - new Date(notice.created_at)) / (1000 * 60 * 60 * 24);
    return diffDays <= 14;
  })();

  const style = getCategoryStyle(notice.category);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDeleteClick = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this notice? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await onDelete(notice.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      onClick={() => navigate(`/notices/${notice.id}`)}
      className="bg-white border border-slate-200/80 rounded-md py-2.5 px-3.5 sm:py-3 sm:px-4 hover:border-secondary hover:shadow-xs transition-all duration-150 cursor-pointer flex flex-col gap-1 group relative"
    >
      {/* Top Row: Title + Category Tag on Right */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm md:text-[15px] font-bold text-primary group-hover:text-secondary leading-snug transition-colors flex flex-wrap items-center gap-1.5">
            <span>{notice.title}</span>
            {isNew && (
              <span className="bg-red-600 text-white text-[9px] font-extrabold uppercase px-1 py-0.2 rounded shadow-2xs animate-pulse inline-flex items-center">
                new
              </span>
            )}
          </h3>
        </div>

        {/* Section / Category badge + admin controls on top right */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${style.bg} ${style.text}`}>
            <span className={`w-1 h-1 rounded-full ${style.dot}`} />
            {notice.category || 'General'}
          </span>
          {isAdmin && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/notices/${notice.id}`); }}
                title="Edit notice"
                className="p-1 rounded text-secondary hover:bg-secondary/10 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={deleting}
                title="Delete notice"
                className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Downside: Formatted Date */}
      <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 mt-0.5">
        <time dateTime={notice.created_at} className="font-normal text-slate-500">
          {formatNoticeDate(notice.created_at)}
        </time>

        {notice.attachment_url && (
          <span className="inline-flex items-center gap-1 text-secondary font-semibold text-[11px] group-hover:underline">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            Attachment
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================
// MAIN PAGE
// ============================================
const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);

  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = isAdminSession();
  const token   = getToken();


  useEffect(() => {
    setVisibleCount(20);
  }, [activeCategory, searchTerm]);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/notices`);
        if (!res.ok) throw new Error('Failed to load notices');
        const data = await res.json();
        setNotices(data);
        setError(null);
      } catch (err) {
        setError('Could not load notices right now. Please try again in a moment.');
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  // Legacy links used ?id=... to pop open a modal -now that a notice opens
  // on its own dedicated page, send those straight to /notices/:id.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetId = params.get('id');
    if (targetId) {
      navigate(`/notices/${targetId}`, { replace: true });
    }
  }, [location.search, navigate]);

  const handleDeleteNotice = async (id) => {
    try {
      await axios.delete(`${API_BASE}/admin/notice/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotices((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  const filteredNotices = notices.filter((n) => {
    const matchesCategory = activeCategory === 'All' || n.category === activeCategory;
    const matchesSearch =
      searchTerm.trim() === '' ||
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const visibleNotices = filteredNotices.slice(0, visibleCount);

  // Group visible notices month-wise as shown in the BHU official layout
  const groupedNotices = visibleNotices.reduce((acc, notice) => {
    const key = getNoticeMonthYear(notice.created_at);
    if (!acc[key]) acc[key] = [];
    acc[key].push(notice);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#EAEFF5]">
      <div className="max-w-5xl mx-auto px-4 pt-6 sm:pt-8 pb-12">
        {/* ── BHU OFFICIAL PORTAL PAGE HEADING ── */}
        <div className="border-b-2 border-[#d4af37] pb-2.5 sm:pb-4 flex flex-row items-end justify-between gap-2.5 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-1.5 sm:w-2 h-5 sm:h-8 md:h-9 bg-crimson rounded-full shrink-0" />
            <h1 className="text-primary font-cinzel font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-tight leading-snug sm:leading-none truncate sm:whitespace-normal">
              Notices &amp; Announcements
            </h1>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide flex items-center gap-1 sm:gap-1.5 shrink-0 text-right">
            <span className="text-slate-400">Home</span>
            <span className="text-slate-300">/</span>
            <span className="text-crimson font-semibold">Notices</span>
          </div>
        </div>

        {isAdmin && (
          <div className="mb-6 px-4 py-2.5 bg-yellow-50 border border-yellow-200 rounded-xl text-xs font-bold text-yellow-700">
            ADMIN MODE -hover a notice to edit or delete it, or open it for full edit controls.
          </div>
        )}

        {/* FILTER BAR */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors
                  ${activeCategory === cat
                    ? 'bg-secondary text-white border-secondary'
                    : 'bg-[#FAF7F2] text-primary border-primary/20 hover:border-secondary hover:text-secondary'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notices..."
            className="px-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent w-full sm:w-56"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-8 h-8 border-[3px] border-gray-200 border-t-secondary rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading notices...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-600 font-medium mb-1">Something went wrong</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredNotices.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 font-medium mb-1">No notices found</p>
            <p className="text-gray-400 text-sm">
              {notices.length === 0
                ? 'There are no notices posted yet. Check back soon.'
                : 'Try a different category or search term.'}
            </p>
          </div>
        )}

        {/* Month-wise Notice Sections matching figure */}
        {!loading && !error && filteredNotices.length > 0 && (
          <div className="space-y-5">
            {Object.entries(groupedNotices).map(([monthYear, items]) => (
              <section key={monthYear} className="space-y-2">
                {/* Month Header Banner matching BHU figure */}
                <div className="border-b border-secondary/30 pb-1 flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-cinzel font-bold text-secondary tracking-wide">
                    {monthYear}
                  </h2>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {items.length} {items.length === 1 ? 'Notice' : 'Notices'}
                  </span>
                </div>

                {/* List of light notice rows */}
                <div className="grid gap-2">
                  {items.map((notice) => (
                    <NoticeRow
                      key={notice.id}
                      notice={notice}
                      isAdmin={isAdmin}
                      onDelete={handleDeleteNotice}
                    />
                  ))}
                </div>
              </section>
            ))}

            {/* Load More Button / Count Indicator */}
            <div className="pt-6 pb-2 text-center">
              {visibleCount < filteredNotices.length ? (
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 20)}
                    className="px-6 py-2.5 bg-primary hover:bg-secondary active:scale-95 text-white text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer border border-[#d4af37]/40 group"
                  >
                    <span>View More Notices</span>
                    <span className="text-xs bg-[#d4af37] text-primary font-bold px-2 py-0.5 rounded-full group-hover:bg-amber-300 transition-colors">
                      +{Math.min(20, filteredNotices.length - visibleCount)}
                    </span>
                  </button>
                  <p className="text-xs text-slate-500 font-medium">
                    Showing {visibleNotices.length} of {filteredNotices.length} notices
                  </p>
                </div>
              ) : filteredNotices.length > 20 ? (
                <p className="text-xs text-slate-500 font-medium">
                  Showing all {filteredNotices.length} notices
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notices;
export { NoticeDetails };