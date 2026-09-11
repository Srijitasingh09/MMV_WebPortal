import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getToken, isAdmin as isAdminSession } from '../utils/auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TITLE_MAX_LENGTH = 100;
const CONTENT_MAX_LENGTH = 1000;

// ============================================
// ATTACHMENT DISPLAY (inlined — local to Notice only)
// A PDF or photo attachment card, plus a section wrapper that groups
// several of them under a shared heading.
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
      className="group flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-amber-50/70 border-2 border-[#D4AF37]/50 hover:border-[#C4561A] hover:bg-amber-100/60 shadow-xs hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-[#7D311F] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
          {isImage ? <ImageIcon /> : <DocumentIcon />}
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-bold text-[#0F3358] group-hover:text-[#7D311F] truncate transition-colors">
            {name || fallbackLabel}
          </p>
          <p className="text-[11px] text-slate-500">Click to view / download file</p>
        </div>
      </div>

      <span className="shrink-0 ml-3 inline-flex items-center gap-1 text-xs font-bold bg-white text-[#7D311F] px-3 py-1.5 rounded-lg border border-[#D4AF37]/60 group-hover:bg-[#7D311F] group-hover:text-white transition-colors shadow-2xs">
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

// User-facing display date resolver: fake/back-dated display_date takes first priority
function getDisplayDate(notice) {
  return notice.display_date || notice.start_date || notice.created_at;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatNoticeDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
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
  const displayDate = getDisplayDate(notice);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          {notice.category || 'General'}
        </span>
        <time className="text-xs text-gray-500 font-medium" dateTime={displayDate}>
          {formatDate(displayDate)}
        </time>
       
        {notice.status === 'scheduled' && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            Scheduled
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================
// HIGHLIGHTED ATTACHMENTS (PDFs & PHOTOS)
// Supports any number of attached PDFs/images. Falls back to the legacy
// single attachment_url/attachment_name fields for older notices that
// haven't been re-saved under the new multi-attachment format.
// ============================================
const isImageAttachment = (name, url) => /\.(png|jpe?g|webp|gif)$/i.test(name || url || '');

const NoticeAttachments = ({ notice }) => {
  const pdfs = notice.pdfs || [];
  const photos = notice.photos || [];
  const hasLegacyAttachment = !pdfs.length && !photos.length && Boolean(notice.attachment_url);

  if (!pdfs.length && !photos.length && !hasLegacyAttachment) return null;

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
              fallbackLabel="Official Notice Document"
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
              fallbackLabel="Notice Photo Attachment"
            />
          ))}
        </AttachmentSection>
      )}

      {hasLegacyAttachment && (
        <AttachmentSection title="Attached Document">
          <AttachmentCard
            url={`${API_BASE}${notice.attachment_url}`}
            name={notice.attachment_name}
            type={isImageAttachment(notice.attachment_name, notice.attachment_url) ? 'image' : 'document'}
            fallbackLabel="Official Notice Document"
          />
        </AttachmentSection>
      )}
    </div>
  );
};

// ============================================
// NOTICE DETAILS CARD - full notice view (+ admin edit)
// ============================================
const NoticeDetailsCard = ({ notice, isAdmin, onDelete, onSave, onDeleted }) => {
  const [isEditing, setIsEditing] = useState(false);
  const toDateOnly = (d) => {
    if (!d) return '';
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return '';
    const offset = dateObj.getTimezoneOffset() * 60000;
    return new Date(dateObj.getTime() - offset).toISOString().slice(0, 10);
  };

  const [editForm, setEditForm] = useState({
    title: notice.title || '',
    content: notice.content || '',
    category: notice.category || 'General',
    display_date: toDateOnly(notice.display_date),
    start_date: toDateOnly(notice.start_date),
    end_date: toDateOnly(notice.end_date),
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Attachment editing: any number of existing photos/pdfs can be removed
  // individually, and any number of new PDFs/images can be picked to be
  // uploaded alongside on save. The legacy single attachment_url field
  // (for notices saved before multi-attachment support) can also be
  // removed individually the same way.
  const [removedPhotoIds, setRemovedPhotoIds] = useState([]);
  const [removedPdfIds, setRemovedPdfIds] = useState([]);
  const [removeLegacyAttachment, setRemoveLegacyAttachment] = useState(false);
  const [newAttachments, setNewAttachments] = useState([]);
  const newAttachmentInputRef = React.useRef(null);

  const visiblePhotos = (notice.photos || []).filter((p) => !removedPhotoIds.includes(p.id));
  const visiblePdfs = (notice.pdfs || []).filter((p) => !removedPdfIds.includes(p.id));
  const hasLegacyAttachment = Boolean(notice.attachment_url) && !(notice.photos || []).length && !(notice.pdfs || []).length;

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

  const markLegacyAttachmentForRemoval = () => {
    setRemoveLegacyAttachment(true);
  };

  const undoRemoveLegacyAttachment = () => {
    setRemoveLegacyAttachment(false);
  };

  const resetAttachmentState = () => {
    setRemovedPhotoIds([]);
    setRemovedPdfIds([]);
    setRemoveLegacyAttachment(false);
    setNewAttachments([]);
    if (newAttachmentInputRef.current) newAttachmentInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!editForm.title.trim()) return;

    if (editForm.title.length > TITLE_MAX_LENGTH || editForm.content.length > CONTENT_MAX_LENGTH) {
      alert(`Title must be within ${TITLE_MAX_LENGTH} characters and content within ${CONTENT_MAX_LENGTH} characters.`);
      return;
    }

    setSaving(true);
    try {
      await onSave(notice.id, {
        ...editForm,
        remove_attachment: removeLegacyAttachment,
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
                    Upload Date (visible to users)
                  </label>
                  <input
                    type="date"
                    value={editForm.display_date}
                    onChange={(e) => setEditForm((f) => ({ ...f, display_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-secondary"
                  />
                  <span className="text-[10px] text-slate-400">Public fake/back date</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
                    Start Date (Goes Live)
                  </label>
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm((f) => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-secondary"
                  />
                  <span className="text-[10px] text-slate-400">Release scheduling</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
                    End Date (Home Expiry)
                  </label>
                  <input
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm((f) => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-secondary"
                  />
                  <span className="text-[10px] text-slate-400">Leaves home after date</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
                  Attachments
                </label>

                {(visiblePdfs.length > 0 || visiblePhotos.length > 0 || (hasLegacyAttachment && !removeLegacyAttachment)) && (
                  <div className="space-y-1.5 mb-2">
                    {visiblePdfs.map((pdf) => (
                      <div key={`pdf-${pdf.id}`} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-amber-50/70 border border-[#D4AF37]/50">
                        <span className="text-xs font-medium text-[#0F3358] truncate">
                          {pdf.pdf_name || 'PDF attachment'}
                        </span>
                        <button
                          type="button"
                          onClick={() => markPdfForRemoval(pdf.id)}
                          className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {visiblePhotos.map((photo) => (
                      <div key={`photo-${photo.id}`} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-amber-50/70 border border-[#D4AF37]/50">
                        <span className="text-xs font-medium text-[#0F3358] truncate">
                          {photo.photo_name || 'Photo attachment'}
                        </span>
                        <button
                          type="button"
                          onClick={() => markPhotoForRemoval(photo.id)}
                          className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {hasLegacyAttachment && !removeLegacyAttachment && (
                      <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-amber-50/70 border border-[#D4AF37]/50">
                        <span className="text-xs font-medium text-[#0F3358] truncate">
                          {notice.attachment_name || 'Current attachment'}
                        </span>
                        <button
                          type="button"
                          onClick={markLegacyAttachmentForRemoval}
                          className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {(removedPhotoIds.length > 0 || removedPdfIds.length > 0 || removeLegacyAttachment) && (
                  <p className="text-[10px] text-red-500 mb-2">
                    {removedPhotoIds.length + removedPdfIds.length + (removeLegacyAttachment ? 1 : 0)} attachment(s) will be removed when you save.
                    {removeLegacyAttachment && (
                      <button
                        type="button"
                        onClick={undoRemoveLegacyAttachment}
                        className="ml-2 font-semibold text-secondary hover:text-primary"
                      >
                        Undo
                      </button>
                    )}
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
                <span className="text-[10px] text-slate-400">Add new PDFs or images — any number.</span>

                {newAttachments.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {newAttachments.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                        <span className="text-xs font-medium text-emerald-700 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeNewAttachment(idx)}
                          className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Content <span className="normal-case font-normal text-slate-400">(optional)</span>
                  </label>
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
                  placeholder="Notice content (optional)"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t">
                <button
                  onClick={() => {
                    setEditForm({
                      title: notice.title || '',
                      content: notice.content || '',
                      category: notice.category || 'General',
                      display_date: toDateOnly(notice.display_date),
                      start_date: toDateOnly(notice.start_date),
                      end_date: toDateOnly(notice.end_date),
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

              {notice.content && (
                <p
                  className="text-gray-700 text-base sm:text-lg leading-relaxed whitespace-pre-wrap"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {notice.content}
                </p>
              )}

              <NoticeAttachments notice={notice} />
            </>
          )}
      </div>
    </div>
  );
};

// ============================================
// NOTICE DETAILS PAGE - dedicated route (/notices/:id)
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const fetchNotice = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/notices`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
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
    const {
      removedPhotoIds = [],
      removedPdfIds = [],
      newAttachments = [],
      ...fields
    } = updates;
    try {
      let latest = null;

      const res = await axios.put(`${API_BASE}/admin/notice/${noticeId}`, fields, {
        headers: { Authorization: `Bearer ${token}` },
      });
      latest = res.data;

      for (const photoId of removedPhotoIds) {
        await axios.delete(`${API_BASE}/admin/notice/photo/${photoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      for (const pdfId of removedPdfIds) {
        await axios.delete(`${API_BASE}/admin/notice/pdf/${pdfId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (newAttachments.length > 0) {
        const formData = new FormData();
        newAttachments.forEach((file) => formData.append('attachments', file));
        const uploadRes = await axios.post(`${API_BASE}/admin/notice/${noticeId}/attachments`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        latest = uploadRes.data || latest;
      }

      setNotice((prev) => {
        if (!prev) return prev;
        const base = { ...prev, ...fields };
        if (latest) return { ...base, ...latest };
        return {
          ...base,
          photos: (prev.photos || []).filter((p) => !removedPhotoIds.includes(p.id)),
          pdfs: (prev.pdfs || []).filter((p) => !removedPdfIds.includes(p.id)),
        };
      });
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
  const displayDate = getDisplayDate(notice);

  const isNew = (() => {
    if (!displayDate) return true;
    const diffDays = (new Date() - new Date(displayDate)) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 14;
  })();

  const style = getCategoryStyle(notice.category);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const hasAttachments = Boolean(notice.attachment_url) || (notice.pdfs || []).length > 0 || (notice.photos || []).length > 0;

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
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm md:text-[15px] font-bold text-primary group-hover:text-secondary leading-snug transition-colors flex flex-wrap items-center gap-1.5">
            <span>{notice.title}</span>
            {isNew && notice.status !== 'scheduled' && (
              <span className="bg-red-600 text-white text-[9px] font-extrabold uppercase px-1 py-0.2 rounded shadow-2xs animate-pulse inline-flex items-center">
                new
              </span>
            )}
            {notice.status === 'scheduled' && (
              <span className="bg-blue-100 text-blue-700 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded inline-flex items-center">
                scheduled
              </span>
            )}
           
          </h3>
        </div>

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

      <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 mt-0.5">
        <time dateTime={displayDate} className="font-normal text-slate-500">
          {formatNoticeDate(displayDate)}
        </time>

        {hasAttachments && (
          <span className="inline-flex items-center gap-1.5 bg-amber-100/80 text-[#7D311F] border border-[#D4AF37]/50 font-bold text-[11px] px-2 py-0.5 rounded-md shadow-2xs group-hover:bg-[#7D311F] group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            Attachment Available
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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);

  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = isAdminSession();
  const token   = getToken();

  useEffect(() => {
    setVisibleCount(20);
  }, [activeCategory, searchTerm, dateFrom, dateTo]);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/notices`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
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

  const rangeStart = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
  const rangeEnd = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

  const filteredNotices = notices.filter((n) => {
    const matchesCategory = activeCategory === 'All' || n.category === activeCategory;
    const matchesSearch =
      searchTerm.trim() === '' ||
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.content || '').toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (rangeStart || rangeEnd) {
      const noticeDate = new Date(getDisplayDate(n));
      if (!isNaN(noticeDate.getTime())) {
        if (rangeStart && noticeDate < rangeStart) matchesDate = false;
        if (rangeEnd && noticeDate > rangeEnd) matchesDate = false;
      }
    }

    return matchesCategory && matchesSearch && matchesDate;
  });

  const visibleNotices = filteredNotices.slice(0, visibleCount);

  const groupedNotices = visibleNotices.reduce((acc, notice) => {
    const key = getNoticeMonthYear(getDisplayDate(notice));
    if (!acc[key]) acc[key] = [];
    acc[key].push(notice);
    return acc;
  }, {});

  const hasActiveDateFilter = Boolean(dateFrom || dateTo);
  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="min-h-screen bg-[#EAEFF5]">
      <div className="max-w-5xl mx-auto px-4 pt-6 sm:pt-8 pb-12">
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
            ADMIN MODE - hover a notice to edit or delete it, or open it for full edit controls.
          </div>
        )}

        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
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

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Filter by date
            </span>
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              From
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo || undefined}
                className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              To
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || undefined}
                className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </label>
            {hasActiveDateFilter && (
              <button
                onClick={clearDateFilter}
                className="text-xs font-semibold text-crimson hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-8 h-8 border-[3px] border-gray-200 border-t-secondary rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading notices...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-600 font-medium mb-1">Something went wrong</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && filteredNotices.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 font-medium mb-1">No notices found</p>
            <p className="text-gray-400 text-sm">
              {notices.length === 0
                ? 'There are no notices posted yet. Check back soon.'
                : 'Try a different category, search term, or date range.'}
            </p>
          </div>
        )}

        {!loading && !error && filteredNotices.length > 0 && (
          <div className="space-y-5">
            {Object.entries(groupedNotices).map(([monthYear, items]) => (
              <section key={monthYear} className="space-y-2">
                <div className="border-b border-secondary/30 pb-1 flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-cinzel font-bold text-secondary tracking-wide">
                    {monthYear}
                  </h2>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {items.length} {items.length === 1 ? 'Notice' : 'Notices'}
                  </span>
                </div>

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