import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getToken, isAdmin as isAdminSession } from '../utils/auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const NEWS_TEXT_MAX_LENGTH = 2000;

// User-facing display date resolver: fake/back-dated display_date takes first priority
function getNewsDisplayDate(news) {
  return news.display_date || news.start_date || news.created_at;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatNewsDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getNewsMonthYear(dateString) {
  if (!dateString) return 'General News';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'General News';
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function toEditableText(news) {
  const title = news.title || '';
  const content = news.content || '';
  return content ? `${title}\n${content}` : title;
}

// ============================================
// SHARED: DATE & STATUS BADGE ROW
// ============================================
const MetaRow = ({ news }) => {
  const displayDate = getNewsDisplayDate(news);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#eef3fa] text-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          News
        </span>
        <time className="text-xs text-gray-500 font-medium" dateTime={displayDate}>
          {formatDate(displayDate)}
        </time>
        {news.status === 'scheduled' && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            Scheduled
          </span>
        )}
        {news.status === 'archived' && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            Archived
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================
// HIGHLIGHTED NEWS ATTACHMENTS (PDF & PHOTOS)
// ============================================
const PdfLink = ({ pdf }) => (
  <a
    href={`${API_BASE}${pdf.pdf_url}`}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()}
    className="group flex items-center justify-between p-3.5 rounded-xl bg-blue-50/70 border-2 border-secondary/30 hover:border-secondary hover:bg-blue-100/60 shadow-xs transition-all duration-200"
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 rounded-lg bg-secondary text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm font-bold text-[#0F3358] truncate">
          {pdf.pdf_name || 'Official Attached PDF'}
        </p>
        <p className="text-[11px] text-slate-500">Document Attachment</p>
      </div>
    </div>

    <span className="shrink-0 ml-3 inline-flex items-center gap-1 text-xs font-bold bg-white text-secondary px-2.5 py-1 rounded-lg border border-secondary/30 group-hover:bg-secondary group-hover:text-white transition-colors shadow-2xs">
      View PDF ↗
    </span>
  </a>
);

const NewsAttachments = ({ news }) => {
  const photos = news.photos || [];
  const pdfs = news.pdfs || [];
  if (photos.length === 0 && pdfs.length === 0) return null;

  return (
    <div className="mt-6 pt-5 border-t border-slate-200/80 space-y-4">
      {/* Highlighted PDFs */}
      {pdfs.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Attached Documents ({pdfs.length})
          </div>
          <div className="grid gap-2">
            {pdfs.map((p) => (
              <PdfLink key={p.id} pdf={p} />
            ))}
          </div>
        </div>
      )}

      {/* Highlighted Photo Gallery */}
      {photos.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Photo Gallery ({photos.length})
          </div>
          <div className={`grid gap-3 ${photos.length === 1 ? 'grid-cols-1 max-w-lg' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {photos.map((p) => (
              <a
                key={p.id}
                href={`${API_BASE}${p.photo_url}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="group relative block rounded-xl overflow-hidden border-2 border-slate-200 hover:border-[#D4AF37] shadow-xs hover:shadow-lg transition-all duration-200 bg-slate-50"
              >
                <img
                  src={`${API_BASE}${p.photo_url}`}
                  alt={p.photo_name || 'News attachment'}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                  <span className="text-[11px] font-bold text-white tracking-wide truncate">
                    {p.photo_name || 'Enlarge Photo'} ↗
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// NEWS DETAILS CARD - full news view (+ admin edit)
// ============================================
const NewsDetailsCard = ({ news, isAdmin, onDelete, onSave, onDeleted }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(toEditableText(news));

  const toDateTimeLocal = (d) => {
    if (!d) return '';
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return '';
    const offset = dateObj.getTimezoneOffset() * 60000;
    return new Date(dateObj.getTime() - offset).toISOString().slice(0, 16);
  };

  const [dates, setDates] = useState({
    display_date: toDateTimeLocal(news.display_date),
    start_date: toDateTimeLocal(news.start_date),
    end_date: toDateTimeLocal(news.end_date),
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!editText.trim()) return;
    if (editText.length > NEWS_TEXT_MAX_LENGTH) {
      alert(`News text cannot exceed ${NEWS_TEXT_MAX_LENGTH} characters.`);
      return;
    } 
    setSaving(true);
    try {
      await onSave(news.id, { text: editText, ...dates });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this news item? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await onDelete(news.id);
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
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                    News Text (first line becomes the heading)
                  </label>
                  <span className={`text-xs ${editText.length >= NEWS_TEXT_MAX_LENGTH ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                    {editText.length}/{NEWS_TEXT_MAX_LENGTH}
                  </span>
                </div>
                <textarea
                  value={editText}
                  maxLength={NEWS_TEXT_MAX_LENGTH}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm leading-relaxed outline-none focus:ring-2 focus:ring-secondary resize-y"
                  placeholder={'Heading goes on the first line...\nEverything after this is the full story.'}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
                    Upload Date (visible to users)
                  </label>
                  <input
                    type="datetime-local"
                    value={dates.display_date}
                    onChange={(e) => setDates({ ...dates, display_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-secondary"
                  />
                  <span className="text-[10px] text-slate-400">Public fake/back date</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
                    Start Date (Goes Live)
                  </label>
                  <input
                    type="datetime-local"
                    value={dates.start_date}
                    onChange={(e) => setDates({ ...dates, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-secondary"
                  />
                  <span className="text-[10px] text-slate-400">Release scheduling</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
                    End Date (Home Expiry)
                  </label>
                  <input
                    type="datetime-local"
                    value={dates.end_date}
                    onChange={(e) => setDates({ ...dates, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-secondary"
                  />
                  <span className="text-[10px] text-slate-400">Leaves home after date</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t">
                <button
                  onClick={() => {
                    setEditText(toEditableText(news));
                    setDates({
                      display_date: toDateTimeLocal(news.display_date),
                      start_date: toDateTimeLocal(news.start_date),
                      end_date: toDateTimeLocal(news.end_date),
                    });
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
                <MetaRow news={news} />
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
                {news.title}
              </h1>

              {news.content && (
                <p
                  className="text-gray-700 text-base sm:text-lg leading-relaxed whitespace-pre-wrap"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {news.content}
                </p>
              )}

              <NewsAttachments news={news} />
            </>
          )}
      </div>
    </div>
  );
};

// ============================================
// NEWS DETAILS PAGE - dedicated route (/news/:id)
// ============================================
const NewsDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const cameFromHome = location.state?.from === 'home';
  const backTo = cameFromHome ? '/home#live-notices-news' : '/news';
  const backLabel = cameFromHome ? 'Back to Home' : 'Back to all News';

  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = isAdminSession();
  const token = getToken();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const fetchNews = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/news`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error('Failed to load news');
        const data = await res.json();
        const found = data.find((n) => String(n.id) === String(id));
        if (!cancelled) {
          setNews(found || null);
          setError(found ? null : 'This news item could not be found. It may have been removed.');
        }
      } catch (err) {
        if (!cancelled) setError('Could not load this news item right now. Please try again in a moment.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchNews();
    return () => { cancelled = true; };
  }, [id]);

  const handleDeleteNews = async (newsId) => {
    try {
      await axios.delete(`${API_BASE}/admin/news/${newsId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.detail || err.message));
      throw err;
    }
  };

  const handleSaveNews = async (newsId, payload) => {
    try {
      const res = await axios.put(`${API_BASE}/admin/news/${newsId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = res.data || {};
      setNews((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-[#EAEFF5]">
      <div className="max-w-5xl mx-auto px-4 pt-6 sm:pt-8 pb-12">
        <div className="border-b-2 border-[#d4af37] pb-2.5 sm:pb-4 flex flex-row items-end justify-between gap-2.5 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-1.5 sm:w-2 h-5 sm:h-8 md:h-9 bg-crimson rounded-full shrink-0" />
            <h1 className="text-primary font-cinzel font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-tight leading-snug sm:leading-none truncate sm:whitespace-normal">
              News Details
            </h1>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide flex items-center gap-1 sm:gap-1.5 shrink-0 text-right">
            <Link to="/home" className="text-slate-400 hover:text-crimson">Home</Link>
            <span className="text-slate-300">/</span>
            <Link to="/news" className="text-slate-400 hover:text-crimson">News</Link>
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
            <p className="text-sm">Loading news...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-600 font-medium mb-1">Something went wrong</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && news && (
          <NewsDetailsCard
            news={news}
            isAdmin={isAdmin}
            onDelete={handleDeleteNews}
            onSave={handleSaveNews}
            onDeleted={() => navigate(backTo)}
          />
        )}
      </div>
    </div>
  );
};

// ============================================
// LIGHT NEWS ROW (matches the Notices list styling)
// ============================================
const NewsRow = ({ news, isAdmin, onDelete }) => {
  const displayDate = getNewsDisplayDate(news);
  const isNew = (() => {
    if (!displayDate) return true;
    const diffDays = (new Date() - new Date(displayDate)) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 14;
  })();

  const [deleting, setDeleting] = useState(false);
  const hasPhotos = (news.photos || []).length > 0;
  const hasPdfs = (news.pdfs || []).length > 0;
  const navigate = useNavigate();

  const handleDeleteClick = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this news item? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await onDelete(news.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      onClick={() => navigate(`/news/${news.id}`)}
      className="bg-white border border-slate-200/80 rounded-md py-2.5 px-3.5 sm:py-3 sm:px-4 hover:border-secondary hover:shadow-xs transition-all duration-150 cursor-pointer flex flex-col gap-1 group relative"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm md:text-[15px] font-bold text-primary group-hover:text-secondary leading-snug transition-colors flex flex-wrap items-center gap-1.5">
            <span>{news.title}</span>
            {isNew && news.status !== 'scheduled' && (
              <span className="bg-red-600 text-white text-[9px] font-extrabold uppercase px-1 py-0.2 rounded shadow-2xs animate-pulse inline-flex items-center">
                new
              </span>
            )}
            {news.status === 'scheduled' && (
              <span className="bg-blue-100 text-blue-700 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded inline-flex items-center">
                scheduled
              </span>
            )}
            {news.status === 'archived' && (
              <span className="bg-slate-100 text-slate-500 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded inline-flex items-center">
                archived
              </span>
            )}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isAdmin && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/news/${news.id}`); }}
                title="Edit news"
                className="p-1 rounded text-secondary hover:bg-secondary/10 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={deleting}
                title="Delete news"
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

      <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 mt-0.5">
        <time dateTime={displayDate} className="font-normal text-slate-500">
          {formatNewsDate(displayDate)}
        </time>

        {(hasPhotos || hasPdfs) && (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-secondary border border-secondary/30 font-bold text-[11px] px-2 py-0.5 rounded-md shadow-2xs group-hover:bg-secondary group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            {hasPhotos && hasPdfs ? 'Photos & PDF' : hasPhotos ? 'Photos Attached' : 'PDF Attached'}
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================
// MAIN PAGE
// ============================================
const News = () => {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);

  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = isAdminSession();
  const token = getToken();

  useEffect(() => {
    setVisibleCount(20);
  }, [searchTerm]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/news`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error('Failed to load news');
        const data = await res.json();
        setNewsItems(data);
        setError(null);
      } catch (err) {
        setError('Could not load news right now. Please try again in a moment.');
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetId = params.get('id');
    if (targetId) {
      navigate(`/news/${targetId}`, { replace: true });
    }
  }, [location.search, navigate]);

  const handleDeleteNews = async (id) => {
    try {
      await axios.delete(`${API_BASE}/admin/news/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewsItems((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  const filteredNews = newsItems.filter((n) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      (n.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.content || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const visibleNews = filteredNews.slice(0, visibleCount);

  const groupedNews = visibleNews.reduce((acc, item) => {
    const rawDate = getNewsDisplayDate(item);
    const key = getNewsMonthYear(rawDate);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#EAEFF5]">
      <div className="max-w-5xl mx-auto px-4 pt-6 sm:pt-8 pb-12">
        <div className="border-b-2 border-[#d4af37] pb-2.5 sm:pb-4 flex flex-row items-end justify-between gap-2.5 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-1.5 sm:w-2 h-5 sm:h-8 md:h-9 bg-crimson rounded-full shrink-0" />
            <h1 className="text-primary font-cinzel font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-tight leading-snug sm:leading-none truncate sm:whitespace-normal">
              News
            </h1>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide flex items-center gap-1 sm:gap-1.5 shrink-0 text-right">
            <span className="text-slate-400">Home</span>
            <span className="text-slate-300">/</span>
            <span className="text-crimson font-semibold">News</span>
          </div>
        </div>

        {isAdmin && (
          <div className="mb-6 px-4 py-2.5 bg-yellow-50 border border-yellow-200 rounded-xl text-xs font-bold text-yellow-700">
            ADMIN MODE - hover a news item to edit or delete it, or open it for full edit controls.
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search news..."
            className="px-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent w-full sm:w-56"
          />
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-8 h-8 border-[3px] border-gray-200 border-t-secondary rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading news...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-600 font-medium mb-1">Something went wrong</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && filteredNews.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 font-medium mb-1">No news found</p>
            <p className="text-gray-400 text-sm">
              {newsItems.length === 0
                ? 'There is no news posted yet. Check back soon.'
                : 'Try a different search term.'}
            </p>
          </div>
        )}

        {/* Month-wise News Sections */}
        {!loading && !error && filteredNews.length > 0 && (
          <div className="space-y-5">
            {Object.entries(groupedNews).map(([monthYear, items]) => (
              <section key={monthYear} className="space-y-2">
                <div className="border-b border-secondary/30 pb-1 flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-cinzel font-bold text-secondary tracking-wide">
                    {monthYear}
                  </h2>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {items.length} {items.length === 1 ? 'Story' : 'Stories'}
                  </span>
                </div>

                <div className="grid gap-2">
                  {items.map((item) => (
                    <NewsRow
                      key={item.id}
                      news={item}
                      isAdmin={isAdmin}
                      onDelete={handleDeleteNews}
                    />
                  ))}
                </div>
              </section>
            ))}

            <div className="pt-6 pb-2 text-center">
              {visibleCount < filteredNews.length ? (
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 20)}
                    className="px-6 py-2.5 bg-primary hover:bg-secondary active:scale-95 text-white text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer border border-[#d4af37]/40 group"
                  >
                    <span>View More News</span>
                    <span className="text-xs bg-[#d4af37] text-primary font-bold px-2 py-0.5 rounded-full group-hover:bg-amber-300 transition-colors">
                      +{Math.min(20, filteredNews.length - visibleCount)}
                    </span>
                  </button>
                  <p className="text-xs text-slate-500 font-medium">
                    Showing {visibleNews.length} of {filteredNews.length} news items
                  </p>
                </div>
              ) : filteredNews.length > 20 ? (
                <p className="text-xs text-slate-500 font-medium">
                  Showing all {filteredNews.length} news items
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default News;
export { NewsDetails };