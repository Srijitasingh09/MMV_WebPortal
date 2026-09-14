import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getToken, isAdmin as isAdminSession } from '../utils/auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const NEWS_TEXT_MAX_LENGTH = 2000;

// ============================================
// ATTACHMENT DISPLAY (inlined — local to News only)
// ============================================
const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const AttachmentCard = ({ url, name, type = 'document', fallbackLabel = 'Attached File' }) => {
  if (!url) return null;
  const isImage = type === 'image';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="group flex items-center justify-between p-3 sm:p-4 rounded-xl bg-amber-50/70 border-2 border-[#D4AF37]/50 hover:border-[#C4561A] hover:bg-amber-100/60 shadow-xs hover:shadow-md transition-all duration-200 gap-3"
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#7D311F] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
          {isImage ? <ImageIcon /> : <DocumentIcon />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-bold text-[#0F3358] group-hover:text-[#7D311F] break-words [overflow-wrap:anywhere] transition-colors leading-tight">
            {name || fallbackLabel}
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Click to view / download file</p>
        </div>
      </div>

      <span className="shrink-0 ml-1 sm:ml-3 inline-flex items-center gap-1 text-xs font-bold bg-white text-[#7D311F] px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-[#D4AF37]/60 group-hover:bg-[#7D311F] group-hover:text-white transition-colors shadow-2xs">
        <span>Open</span>
        <span>↗</span>
      </span>
    </a>
  );
};

const AttachmentSection = ({ title, children }) => (
  <div className="space-y-2">
    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
      {title}
    </div>
    <div className="grid gap-2">
      {children}
    </div>
  </div>
);

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
    timeZone: 'Asia/Kolkata',
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
    timeZone: 'Asia/Kolkata',
  });
}

function getNewsMonthYear(dateString) {
  if (!dateString) return 'General News';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'General News';
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
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
        <time className="text-xs text-gray-500 font-medium" dateTime={displayDate}>
          {formatDate(displayDate)}
        </time>
        {news.status === 'scheduled' && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            Scheduled
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================
// HIGHLIGHTED NEWS ATTACHMENTS (PDF & PHOTOS)
// ============================================
const NewsAttachments = ({ news }) => {
  const photos = news.photos || [];
  const pdfs = news.pdfs || [];
  if (photos.length === 0 && pdfs.length === 0) return null;

  return (
    <div className="mt-6 pt-5 border-t border-slate-200/80 space-y-4">
      {pdfs.length > 0 && (
        <AttachmentSection title={`Attached Documents (${pdfs.length})`}>
          {pdfs.map((p) => (
            <AttachmentCard
              key={p.id}
              url={`${API_BASE}${p.pdf_url}`}
              name={p.pdf_name}
              type="document"
              fallbackLabel="Official Attached PDF"
            />
          ))}
        </AttachmentSection>
      )}

      {photos.length > 0 && (
        <AttachmentSection title={`Photo Gallery (${photos.length})`}>
          {photos.map((p) => (
            <AttachmentCard
              key={p.id}
              url={`${API_BASE}${p.photo_url}`}
              name={p.photo_name}
              type="image"
              fallbackLabel="News Photo Attachment"
            />
          ))}
        </AttachmentSection>
      )}
    </div>
  );
};

// ============================================
// NEWS DETAILS CARD - full news view (+ admin edit)
// ============================================
const NewsDetailsCard = ({ news, isAdmin, onDelete, onSave, onDeleted, startInEdit = false }) => {
  const [isEditing, setIsEditing] = useState(Boolean(startInEdit && isAdmin));
  const [editText, setEditText] = useState(toEditableText(news));

  const toDateOnly = (d) => {
    if (!d) return '';
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return '';
    const offset = dateObj.getTimezoneOffset() * 60000;
    return new Date(dateObj.getTime() - offset).toISOString().slice(0, 10);
  };

  const [dates, setDates] = useState({
    display_date: toDateOnly(news.display_date),
    start_date: toDateOnly(news.start_date),
    end_date: toDateOnly(news.end_date),
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [removedPhotoIds, setRemovedPhotoIds] = useState([]);
  const [removedPdfIds, setRemovedPdfIds] = useState([]);
  const [newAttachments, setNewAttachments] = useState([]);
  const newAttachmentInputRef = React.useRef(null);

  const visiblePhotos = (news.photos || []).filter((p) => !removedPhotoIds.includes(p.id));
  const visiblePdfs = (news.pdfs || []).filter((p) => !removedPdfIds.includes(p.id));

  const handleNewAttachmentsChange = (e) => {
    const picked = Array.from(e.target.files || []);
    setNewAttachments((prev) => [...prev, ...picked]);
    if (newAttachmentInputRef.current) newAttachmentInputRef.current.value = '';
  };

  const removeNewAttachment = (index) => {
    setNewAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const markPhotoForRemoval = (photoId) => {
    setRemovedPhotoIds((prev) => [...prev, photoId]);
  };

  const markPdfForRemoval = (pdfId) => {
    setRemovedPdfIds((prev) => [...prev, pdfId]);
  };

  const resetAttachmentState = () => {
    setRemovedPhotoIds([]);
    setRemovedPdfIds([]);
    setNewAttachments([]);
    if (newAttachmentInputRef.current) newAttachmentInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!editText.trim()) return;
    if (editText.length > NEWS_TEXT_MAX_LENGTH) {
      alert(`News text cannot exceed ${NEWS_TEXT_MAX_LENGTH} characters.`);
      return;
    } 
    setSaving(true);
    try {
      await onSave(news.id, {
        text: editText,
        ...dates,
        removedPhotoIds,
        removedPdfIds,
        newAttachments,
      });
      setIsEditing(false);
      resetAttachmentState();
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
      <div className="p-4 sm:p-6 md:p-8">
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
                  type="date"
                  value={dates.display_date}
                  onChange={(e) => setDates({ ...dates, display_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-secondary bg-white"
                />
                <span className="text-[10px] text-slate-400">Public fake/back date</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
                  Start Date (Goes Live)
                </label>
                <input
                  type="date"
                  value={dates.start_date}
                  onChange={(e) => setDates({ ...dates, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-secondary bg-white"
                />
                <span className="text-[10px] text-slate-400">Release scheduling</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
                  End Date (Home Expiry)
                </label>
                <input
                  type="date"
                  value={dates.end_date}
                  onChange={(e) => setDates({ ...dates, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-secondary bg-white"
                />
                <span className="text-[10px] text-slate-400">Leaves home after date</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
                Attachments
              </label>

              {(visiblePhotos.length > 0 || visiblePdfs.length > 0) && (
                <div className="space-y-1.5 mb-2">
                  {visiblePdfs.map((pdf) => (
                    <div key={`pdf-${pdf.id}`} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-amber-50/70 border border-[#D4AF37]/50 min-w-0">
                      <span className="text-xs font-medium text-[#0F3358] break-words [overflow-wrap:anywhere] min-w-0">
                        {pdf.pdf_name || 'PDF attachment'}
                      </span>
                      <button
                        type="button"
                        onClick={() => markPdfForRemoval(pdf.id)}
                        className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-700 ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {visiblePhotos.map((photo) => (
                    <div key={`photo-${photo.id}`} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-amber-50/70 border border-[#D4AF37]/50 min-w-0">
                      <span className="text-xs font-medium text-[#0F3358] break-words [overflow-wrap:anywhere] min-w-0">
                        {photo.photo_name || 'Photo attachment'}
                      </span>
                      <button
                        type="button"
                        onClick={() => markPhotoForRemoval(photo.id)}
                        className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-700 ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {(removedPhotoIds.length > 0 || removedPdfIds.length > 0) && (
                <p className="text-[10px] text-red-500 mb-2">
                  {removedPhotoIds.length + removedPdfIds.length} attachment(s) will be removed when you save.
                </p>
              )}

              <input
                ref={newAttachmentInputRef}
                type="file"
                accept=".pdf,image/*"
                multiple
                onChange={handleNewAttachmentsChange}
                className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-white hover:file:bg-primary"
              />
              <span className="text-[10px] text-slate-400">Add new photos or PDFs — any number.</span>

              {newAttachments.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {newAttachments.map((file, idx) => (
                    <div key={`${file.name}-${idx}`} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-emerald-50 border border-emerald-200 min-w-0">
                      <span className="text-xs font-medium text-emerald-700 break-words [overflow-wrap:anywhere] min-w-0">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeNewAttachment(idx)}
                        className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-700 ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t">
              <button
                onClick={() => {
                  setEditText(toEditableText(news));
                  setDates({
                    display_date: toDateOnly(news.display_date),
                    start_date: toDateOnly(news.start_date),
                    end_date: toDateOnly(news.end_date),
                  });
                  resetAttachmentState();
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
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <MetaRow news={news} />
              {isAdmin && (
                <div className="flex gap-2 shrink-0">
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
              className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-4 leading-snug break-all break-words [overflow-wrap:anywhere] whitespace-normal"
              style={{ fontFamily: "'Mirava', 'Mirava Sans', 'Plus Jakarta Sans', sans-serif" }}
            >
              {news.title}
            </h1>

            {news.content && (
              <p
                className="text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
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
  const startInEdit = Boolean(location.state?.edit);

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
    const { removedPhotoIds = [], removedPdfIds = [], newAttachments = [], ...fields } = payload;
    try {
      let latest = null;

      const res = await axios.put(`${API_BASE}/admin/news/${newsId}`, fields, {
        headers: { Authorization: `Bearer ${token}` },
      });
      latest = res.data;

      for (const photoId of removedPhotoIds) {
        await axios.delete(`${API_BASE}/admin/news/photo/${photoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      for (const pdfId of removedPdfIds) {
        await axios.delete(`${API_BASE}/admin/news/pdf/${pdfId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (newAttachments.length > 0) {
        const formData = new FormData();
        newAttachments.forEach((file) => formData.append('attachments', file));
        const uploadRes = await axios.post(`${API_BASE}/admin/news/${newsId}/attachments`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        latest = uploadRes.data;
      } else if (removedPhotoIds.length > 0 || removedPdfIds.length > 0) {
        const refreshed = await axios.get(`${API_BASE}/news`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const found = refreshed.data.find((n) => String(n.id) === String(newsId));
        if (found) latest = found;
      }

      if (latest) setNews((prev) => (prev ? { ...prev, ...latest } : prev));
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-[#EAEFF5]">
      <div className="max-w-5xl mx-auto px-4 pt-6 sm:pt-8 pb-12">
        <div className="border-b-2 border-[#d4af37] pb-2.5 sm:pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-1.5 sm:w-2 h-5 sm:h-8 md:h-9 bg-crimson rounded-full shrink-0" />
            <h1 className="text-primary font-cinzel font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-tight leading-snug sm:leading-none break-words min-w-0">
              News Details
            </h1>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide flex flex-wrap items-center gap-1 sm:gap-1.5 shrink-0">
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
            startInEdit={startInEdit}
          />
        )}
      </div>
    </div>
  );
};

// ============================================
// LIGHT NEWS ROW (List View - Gap-Free Compact Card)
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
      className="bg-white border border-slate-200/80 rounded-md py-2.5 px-3.5 sm:py-3 sm:px-4 hover:border-secondary hover:shadow-xs transition-all duration-150 cursor-pointer flex flex-col gap-1.5 group relative min-w-0"
    >
      {/* News Title with NEW/SCHEDULED Badge right beside heading end */}
      <h3 className="text-xs sm:text-sm md:text-[15px] font-bold text-primary group-hover:text-secondary leading-snug transition-colors break-all break-words [overflow-wrap:anywhere] whitespace-normal w-full m-0 p-0">
        <span>{news.title}</span>
        {isNew && news.status !== 'scheduled' && (
          <span className="inline-flex items-center ml-1.5 bg-red-600 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-2xs animate-pulse align-middle shrink-0">
            new
          </span>
        )}
        {news.status === 'scheduled' && (
          <span className="inline-flex items-center ml-1.5 bg-blue-100 text-blue-700 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded align-middle shrink-0">
            scheduled
          </span>
        )}
      </h3>

      {/* Bottom Metadata: Date, Attachment Indicator & Admin Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs text-slate-500 pt-1.5 border-t border-slate-100/80 mt-0.5">
        <time dateTime={displayDate} className="font-normal text-slate-500 shrink-0">
          {formatNewsDate(displayDate)}
        </time>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {(hasPhotos || hasPdfs) && (
            <span className="inline-flex items-center gap-1.5 bg-amber-100/80 text-[#7D311F] border border-[#D4AF37]/50 font-bold text-[11px] px-2 py-0.5 rounded-md shadow-2xs group-hover:bg-[#7D311F] group-hover:text-white transition-colors shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              Attachment Available
            </span>
          )}

          {isAdmin && (
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/news/${news.id}`, { state: { edit: true } }); }}
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
            </div>
          )}
        </div>
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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);

  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = isAdminSession();
  const token = getToken();

  useEffect(() => {
    setVisibleCount(20);
  }, [searchTerm, dateFrom, dateTo]);

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

  const rangeStart = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
  const rangeEnd = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

  const filteredNews = newsItems.filter((n) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      (n.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.content || '').toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (rangeStart || rangeEnd) {
      const newsDate = new Date(getNewsDisplayDate(n));
      if (!isNaN(newsDate.getTime())) {
        if (rangeStart && newsDate < rangeStart) matchesDate = false;
        if (rangeEnd && newsDate > rangeEnd) matchesDate = false;
      }
    }

    return matchesSearch && matchesDate;
  });

  const visibleNews = filteredNews.slice(0, visibleCount);

  const hasActiveDateFilter = Boolean(dateFrom || dateTo);
  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
  };

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
        <div className="border-b-2 border-[#d4af37] pb-2.5 sm:pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-1.5 sm:w-2 h-5 sm:h-8 md:h-9 bg-crimson rounded-full shrink-0" />
            <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-cinzel font-bold text-primary tracking-tight leading-snug sm:leading-none break-words min-w-0">
              News
            </h1>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide flex flex-wrap items-center gap-1 sm:gap-1.5 shrink-0">
            <Link to="/home" className="text-slate-400 hover:text-crimson">Home</Link>
            <span className="text-slate-300">/</span>
            <span className="text-crimson font-semibold">News</span>
          </div>
        </div>

        {isAdmin && (
          <div className="mb-6 px-4 py-2.5 bg-yellow-50 border border-yellow-200 rounded-xl text-xs font-bold text-yellow-700">
            ADMIN MODE - hover a news item to edit or delete it, or open it for full edit controls.
          </div>
        )}

        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Filter by date
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                  <span className="shrink-0">From</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    max={dateTo || undefined}
                    className="min-w-0 px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
                  />
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                  <span className="shrink-0">To</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    min={dateFrom || undefined}
                    className="min-w-0 px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
                  />
                </label>
                {hasActiveDateFilter && (
                  <button
                    onClick={clearDateFilter}
                    className="text-xs font-semibold text-crimson hover:underline shrink-0 py-1 px-2 bg-red-50 rounded-md border border-red-200"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search news..."
              className="px-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent w-full sm:w-56"
            />
          </div>
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
                : 'Try a different search term or date range.'}
            </p>
          </div>
        )}

        {/* Month-wise News Sections */}
        {!loading && !error && filteredNews.length > 0 && (
          <div className="space-y-5">
            {Object.entries(groupedNews).map(([monthYear, items]) => (
              <section key={monthYear} className="space-y-2">
                <div className="border-b border-secondary/30 pb-1 flex items-center justify-between gap-2">
                  <h2 className="text-sm sm:text-base font-cinzel font-bold text-secondary tracking-wide min-w-0 break-words">
                    {monthYear}
                  </h2>
                  <span className="text-[11px] text-slate-400 font-medium shrink-0">
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