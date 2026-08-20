import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

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
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatNoticeDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
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
const NoticeModal = ({ notice, onClose }) => {
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

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center p-4 sm:p-6"
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
          <MetaRow notice={notice} />

          <h3
            id="notice-modal-title"
            className="text-2xl sm:text-3xl font-bold text-[#0f3358] mb-4 leading-snug pr-8"
            style={{ fontFamily: "'Mirava', 'Mirava Sans', 'Plus Jakarta Sans', sans-serif" }}
          >
            {notice.title}
          </h3>

          <p
            className="text-gray-700 text-base sm:text-lg leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
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
// LIGHT NOTICE ROW (reduced size, matching BHU portal figure)
// ============================================
const NoticeRow = ({ notice, onExpand }) => {
  // Check if notice was posted recently (e.g., within last 14 days)
  const isNew = (() => {
    if (!notice.created_at) return true;
    const diffDays = (new Date() - new Date(notice.created_at)) / (1000 * 60 * 60 * 24);
    return diffDays <= 14;
  })();

  const style = getCategoryStyle(notice.category);

  return (
    <div
      onClick={() => onExpand(notice)}
      className="bg-white border border-slate-200/80 rounded-md py-2.5 px-3.5 sm:py-3 sm:px-4 hover:border-[#174873] hover:shadow-xs transition-all duration-150 cursor-pointer flex flex-col gap-1 group relative"
    >
      {/* Top Row: Title + Category Tag on Right */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm md:text-[15px] font-bold text-[#0f3358] group-hover:text-[#174873] leading-snug transition-colors flex flex-wrap items-center gap-1.5">
            <span>{notice.title}</span>
            {isNew && (
              <span className="bg-red-600 text-white text-[9px] font-extrabold uppercase px-1 py-0.2 rounded shadow-2xs animate-pulse inline-flex items-center">
                new
              </span>
            )}
          </h3>
        </div>

        {/* Section / Category badge on top right */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${style.bg} ${style.text}`}>
            <span className={`w-1 h-1 rounded-full ${style.dot}`} />
            {notice.category || 'General'}
          </span>
        </div>
      </div>

      {/* Downside: Formatted Date */}
      <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 mt-0.5">
        <time dateTime={notice.created_at} className="font-normal text-slate-500">
          {formatNoticeDate(notice.created_at)}
        </time>

        {notice.attachment_url && (
          <span className="inline-flex items-center gap-1 text-[#174873] font-semibold text-[11px] group-hover:underline">
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
  const [activeNotice, setActiveNotice] = useState(null);
  const [visibleCount, setVisibleCount] = useState(20);

  const location = useLocation();

  // Reset visible notices count whenever category or search filter changes
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

  // Direct notice navigation via URL parameter ?id=... (from ticker click)
  useEffect(() => {
    if (notices.length > 0) {
      const params = new URLSearchParams(location.search);
      const targetId = params.get('id');
      if (targetId) {
        const found = notices.find((n) => String(n.id) === String(targetId));
        if (found) {
          setActiveNotice(found);
        }
      }
    }
  }, [location.search, notices]);

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
            <div className="w-1.5 sm:w-2 h-5 sm:h-8 md:h-9 bg-[#7d311f] rounded-full shrink-0" />
            <h1 className="text-[#0f3358] font-cinzel font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-tight leading-snug sm:leading-none truncate sm:whitespace-normal">
              Notices &amp; Announcements
            </h1>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide flex items-center gap-1 sm:gap-1.5 shrink-0 text-right">
            <span className="text-slate-400">Home</span>
            <span className="text-slate-300">/</span>
            <span className="text-[#7d311f] font-semibold">Notices</span>
          </div>
        </div>

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
                    : 'bg-[#FAF7F2] text-[#0f3358] border-[#0f3358]/20 hover:border-[#174873] hover:text-[#174873]'
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

        {/* Month-wise Notice Sections matching figure */}
        {!loading && !error && filteredNotices.length > 0 && (
          <div className="space-y-5">
            {Object.entries(groupedNotices).map(([monthYear, items]) => (
              <section key={monthYear} className="space-y-2">
                {/* Month Header Banner matching BHU figure */}
                <div className="border-b border-[#174873]/30 pb-1 flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-cinzel font-bold text-[#174873] tracking-wide">
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
                      onExpand={setActiveNotice}
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
                    className="px-6 py-2.5 bg-[#0f3358] hover:bg-[#174873] active:scale-95 text-white text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer border border-[#d4af37]/40 group"
                  >
                    <span>View More Notices</span>
                    <span className="text-xs bg-[#d4af37] text-[#0f3358] font-bold px-2 py-0.5 rounded-full group-hover:bg-amber-300 transition-colors">
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

      {/* Full-notice modal */}
      {activeNotice && (
        <NoticeModal
          notice={activeNotice}
          onClose={() => setActiveNotice(null)}
        />
      )}
    </div>
  );
};

export default Notices;