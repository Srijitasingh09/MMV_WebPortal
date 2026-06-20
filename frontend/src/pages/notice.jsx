import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CATEGORIES = ['All', 'Exam', 'Holiday', 'Admission', 'Event', 'General'];

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
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ============================================
// SHARED: CATEGORY TAG + DATE ROW
// ============================================
const MetaRow = ({ notice, isAdmin, onDelete, deleting }) => {
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

      {isAdmin && onDelete && (
        <button
          onClick={onDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-full hover:bg-red-50 hover:border-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting ? 'Deleting...' : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              Delete
            </>
          )}
        </button>
      )}
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
      className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-[#174873] hover:text-[#406BC7] hover:underline transition-colors"
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
// MODAL — full notice view
// ============================================
const NoticeModal = ({ notice, isAdmin, onClose, onDelete }) => {
  const [deleting, setDeleting] = useState(false);
  const style = getCategoryStyle(notice.category);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    // Lock body scroll while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this notice? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/admin/notice/${notice.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      onDelete(notice.id);
      onClose();
    } catch (err) {
      alert('Could not delete notice. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-modal-title"
    >
      {/* Backdrop — semi-transparent + blurred, click to close */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
      />

      {/* Modal card */}
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-[slideUp_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="p-6 sm:p-8">
          <MetaRow
            notice={notice}
            isAdmin={isAdmin}
            onDelete={handleDelete}
            deleting={deleting}
          />

          <h3
            id="notice-modal-title"
            className="text-2xl sm:text-3xl font-bold text-[#0f3358] mb-4 leading-snug pr-8"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {notice.title}
          </h3>

          <p
            className="text-gray-700 text-base sm:text-lg leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: "'EB Garamond', serif" }}
          >
            {notice.content}
          </p>

          <AttachmentLink notice={notice} />
        </div>
      </div>
    </div>
  );
};

// ============================================
// SINGLE NOTICE CARD (fixed height, fully clickable)
// ============================================
const NoticeCard = ({ notice, isAdmin, onDelete, onExpand }) => {
  const [deleting, setDeleting] = useState(false);
  const isLong = notice.content && notice.content.length > 110;

  const handleDelete = async (e) => {
    e.stopPropagation(); // don't trigger card click (modal open) when deleting
    if (!window.confirm('Delete this notice? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/admin/notice/${notice.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      onDelete(notice.id);
    } catch (err) {
      alert('Could not delete notice. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article
      onClick={() => onExpand(notice)}
      className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200 flex flex-col cursor-pointer"
    >

      <MetaRow
        notice={notice}
        isAdmin={isAdmin}
        onDelete={handleDelete}
        deleting={deleting}
      />

      {/* Title — clamped to 2 lines so height stays consistent */}
      <h3
        className="text-2xl sm:text-3xl font-bold text-[#0f3358] mb-3 leading-snug line-clamp-2 flex-shrink-0"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        {notice.title}
      </h3>

      {/* Content — clamped to 2 lines by line-clamp alone, no manual height override */}
      <p
        className="text-gray-700 text-base sm:text-lg leading-snug whitespace-pre-wrap overflow-hidden line-clamp-2 flex-shrink-0"
        style={{ fontFamily: "'EB Garamond', serif" }}
      >
        {notice.content}
      </p>

      {/* See more affordance — only shown when content is actually truncated */}
      {isLong && (
        <span className="text-sm font-medium text-[#174873] mt-1">
          See more
        </span>
      )}

      {/* Attachment chip, pinned to bottom, styled to draw attention */}
      {notice.attachment_url && (
        <div className="mt-3 pt-1">
          <a
            href={`${API_BASE}${notice.attachment_url}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-50 border border-amber-300 text-amber-800 text-sm font-semibold hover:bg-amber-100 hover:border-amber-400 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            {notice.attachment_name || 'View Attachment'}
          </a>
        </div>
      )}
    </article>
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
  const [activeNotice, setActiveNotice] = useState(null); // notice shown in modal

  const isAdmin = !!localStorage.getItem('token');

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

  const handleDelete = (deletedId) => {
    setNotices((prev) => prev.filter((n) => n.id !== deletedId));
  };

  const filteredNotices = notices.filter((n) => {
    const matchesCategory = activeCategory === 'All' || n.category === activeCategory;
    const matchesSearch =
      searchTerm.trim() === '' ||
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">

      {/* PAGE HEADER */}
      <div className="bg-[#0f3358] py-6 sm:py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className="text-4xl sm:text-5xl font-semibold text-white mb-1"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Notices &amp; Announcements
          </h1>
          <p className="text-blue-200 text-sm sm:text-base mt-2">
            Stay updated with the latest announcements from MMV
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* FILTER BAR */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors
                  ${activeCategory === cat
                    ? 'bg-[#174873] text-white border-[#174873]'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-[#174873] hover:text-[#174873]'
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
            className="px-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#174873] focus:border-transparent w-full sm:w-56"
          />
        </div>

        {/* Admin indicator */}
        {isAdmin && (
          <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
            You are viewing as admin — delete buttons are visible only to you.
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-8 h-8 border-[3px] border-gray-200 border-t-[#174873] rounded-full animate-spin mb-3" />
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

        {/* Notice grid — uniform height cards */}
        {!loading && !error && filteredNotices.length > 0 && (
          <div className="grid gap-4 sm:gap-5">
            {filteredNotices.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                onExpand={setActiveNotice}
              />
            ))}
          </div>
        )}
      </div>

      {/* Full-notice modal */}
      {activeNotice && (
        <NoticeModal
          notice={activeNotice}
          isAdmin={isAdmin}
          onClose={() => setActiveNotice(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default Notices;