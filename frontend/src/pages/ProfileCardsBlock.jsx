import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Tag prefix so a card's photo can be found among all photos on this page,
// the same trick GenericContentPage already uses for PROFILE_PHOTO_TAG /
// TABLE_PDF_TAG — no backend changes needed, it's just the filename.
const CARD_PHOTO_TAG = '__profile_card_';

const blankCard = () => ({
  id: crypto.randomUUID(),
  name: '',
  designation: '',   // e.g. "Warden", "Admin Warden"
  badge: '',         // e.g. "Sunrise Boys Hostel" — small pill under designation
  university: '',    // e.g. "Greenfield University"
  phone: '',
  email: '',
});

const IconPhone = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const IconMail = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16v16H4z" opacity="0" />
    <path d="M22 6l-10 7L2 6" />
    <rect x="2" y="4" width="20" height="16" rx="2" />
  </svg>
);
const IconBuilding = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M6 21V7l6-4 6 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1" />
  </svg>
);
const IconPerson = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.42 0-8 2.24-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.76-3.58-5-8-5z" />
  </svg>
);

const ProfileCard = ({ card, photoUrl, isAdmin, onEdit, onDelete }) => (
  <div className="relative w-full max-w-[380px] sm:w-[350px] bg-white border-2 border-slate-300 rounded-3xl shadow-md overflow-hidden flex flex-col items-center pt-8 pb-7 px-7 text-center">
    {isAdmin && (
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        <button
          onClick={() => onEdit(card)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-slate-200 text-[#174873] hover:bg-slate-100 shadow-sm cursor-pointer"
          title="Edit profile card"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
        </button>
        <button
          onClick={() => onDelete(card)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-slate-200 text-red-500 hover:bg-red-50 shadow-sm cursor-pointer"
          title="Delete profile card"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z" /></svg>
        </button>
      </div>
    )}

    {/* photo */}
    <div className="relative mb-5">
      <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full border-4 border-[#0f3358] overflow-hidden bg-slate-100 flex items-center justify-center shadow-lg">
        {photoUrl ? (
          <img src={photoUrl} alt={card.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.42 0-8 2.24-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.76-3.58-5-8-5z" />
            </svg>
          </div>
        )}
      </div>
      <div className="absolute bottom-0 right-1 w-10 h-10 rounded-full bg-[#0f3358] border-2 border-white flex items-center justify-center text-white shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.42 0-8 2.24-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.76-3.58-5-8-5z" />
        </svg>
      </div>
    </div>

    <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold font-cinzel text-[#0f3358] text-center leading-tight tracking-wide">
      {card.name || 'Unnamed'}
    </h3>
    <div className="w-12 h-[3px] bg-[#d4af37] my-2.5 rounded-full" />
    {card.designation && (
      <p className="text-[#7d311f] text-lg sm:text-xl font-bold mb-2.5 text-center leading-snug">{card.designation}</p>
    )}
    {card.badge && (
      <div className="flex items-center gap-2 bg-[#EAEFF5] text-[#0f3358] text-sm sm:text-base font-bold px-4 py-2 rounded-xl mb-2.5 shadow-xs">
        <IconBuilding />
        {card.badge}
      </div>
    )}
    {card.university && (
      <p className="text-slate-600 text-sm sm:text-base font-semibold text-center mb-4">{card.university}</p>
    )}

    {(card.phone || card.email) && (
      <div className="w-full border-t border-slate-200 pt-4 space-y-3">
        {card.phone && (
          <div className="flex items-center justify-center gap-3 text-sm sm:text-base font-semibold text-slate-800">
            <span className="w-8 h-8 rounded-full bg-[#EAEFF5] text-[#174873] flex items-center justify-center shrink-0 shadow-xs"><IconPhone /></span>
            <span>{card.phone}</span>
          </div>
        )}
        {card.email && (
          <div className="flex items-center justify-center gap-3 text-sm sm:text-base font-semibold text-slate-800 break-all">
            <span className="w-8 h-8 rounded-full bg-[#EAEFF5] text-[#174873] flex items-center justify-center shrink-0 shadow-xs"><IconMail /></span>
            <span>{card.email}</span>
          </div>
        )}
      </div>
    )}

    <div className="absolute bottom-0 left-0 right-0 h-2 bg-[#0f3358]" />
  </div>
);

/**
 * Renders a row of profile cards (warden/staff-style) that admins can add to
 * ANY page, independent of pageType. Data lives in the same `details` JSON
 * blob GenericContentPage already reads/writes (key: profileCards), and
 * photos reuse the existing facility-content photo-upload endpoint, tagged
 * per-card so they don't collide with gallery/profile photos on the page.
 *
 * Props:
 *   section, subsection  — same values passed into GenericContentPage
 *   content               — the fetched facility-content row (data state from parent); {} if none yet
 *   isAdmin, token
 *   onChanged(newRow)      — called with the refreshed row after any save/delete
 */
const ProfileCardsBlock = forwardRef(({ section, subsection, content, isAdmin, token, onChanged }, ref) => {
  const fileRef = useRef(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blankCard());
  const [isNew, setIsNew] = useState(true);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);

  let details = {};
  try { details = content?.details ? JSON.parse(content.details) : {}; } catch { details = {}; }
  const cards = Array.isArray(details.profileCards) ? details.profileCards : [];
  const photos = content?.photos || [];
  const photoFor = (cardId) =>
    photos.find(p => p.photo_name?.startsWith(`${CARD_PHOTO_TAG}${cardId}__`))?.photo_url;

  const openAdd = () => {
    setForm(blankCard());
    setIsNew(true);
    setPhotoFile(null);
    setPhotoPreview('');
    setShowForm(true);
  };

  // Lets the parent's "ADMIN CONTROLS" bar trigger this with a normal button,
  // same as Upload Photo / Edit Description — no extra tile rendered here.
  useImperativeHandle(ref, () => ({ openAddForm: openAdd }));

  const openEdit = (card) => {
    setForm({ ...card });
    setIsNew(false);
    setPhotoFile(null);
    setPhotoPreview(photoFor(card.id) ? `${API}${photoFor(card.id)}` : '');
    setShowForm(true);
  };

  const handlePhotoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const persistDetails = async (newCards) => {
    const merged = { ...details, profileCards: newCards };
    const res = await axios.put(`${API}/admin/facility-content`,
      { section, category: subsection, sub_category: '', details: JSON.stringify(merged) },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  };

  const uploadPhotoFor = async (cardId, file) => {
    const fd = new FormData();
    fd.append('section', section);
    fd.append('category', subsection || '');
    fd.append('sub_category', '');
    const tagged = new File([file], `${CARD_PHOTO_TAG}${cardId}__${file.name}`, { type: file.type });
    fd.append('files', tagged);
    await axios.post(`${API}/admin/facility-content/upload-photo`, fd, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
    });
  };

  const removePhotoFor = async (cardId) => {
    const existing = photos.find(p => p.photo_name?.startsWith(`${CARD_PHOTO_TAG}${cardId}__`));
    if (existing) {
      await axios.delete(`${API}/admin/facility-content/photo/${existing.id}`,
        { headers: { Authorization: `Bearer ${token}` } });
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Name is required.'); return; }
    setSaving(true);
    try {
      const newCards = isNew
        ? [...cards, form]
        : cards.map(c => (c.id === form.id ? form : c));

      await persistDetails(newCards);

      if (photoFile) {
        if (!isNew) await removePhotoFor(form.id); // replace: drop old tagged photo first
        await uploadPhotoFor(form.id, photoFile);
      }

      // re-fetch the row so photos[] reflects the upload
      const res = await axios.get(`${API}/facility-content`, { params: { section, category: subsection } });
      const fresh = (res.data || [])[0] || {};
      onChanged?.(fresh);
      setShowForm(false);
    } catch {
      alert('Could not save profile card.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (card) => {
    if (!window.confirm(`Remove the profile card for "${card.name}"?`)) return;
    try {
      await removePhotoFor(card.id);
      const newCards = cards.filter(c => c.id !== card.id);
      const fresh = await persistDetails(newCards);
      onChanged?.(fresh);
    } catch {
      alert('Could not delete profile card.');
    }
  };

  if (!isAdmin && cards.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-5 sm:gap-7 my-2">
      {cards.map(card => (
        <ProfileCard
          key={card.id}
          card={card}
          photoUrl={photoFor(card.id) ? `${API}${photoFor(card.id)}` : null}
          isAdmin={isAdmin}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      ))}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#0f3358] mb-4 font-cinzel">
              {isNew ? 'Add Profile Card' : 'Edit Profile Card'}
            </h3>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" alt="" /> : <IconPerson />}
              </div>
              <div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50"
                >
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
              </div>
            </div>

            <div className="space-y-3">
              <input className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                placeholder="Full Name *" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <input className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                placeholder="Designation (e.g. Warden)" value={form.designation}
                onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} />
              <input className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                placeholder="Hostel / Department (e.g. Sunrise Boys Hostel)" value={form.badge}
                onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} />
              <input className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                placeholder="University / College" value={form.university}
                onChange={e => setForm(f => ({ ...f, university: e.target.value }))} />
              <input className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                placeholder="Phone" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              <input className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                placeholder="Email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-300 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm font-bold rounded-lg bg-[#174873] text-white hover:bg-[#0f3358] disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ProfileCardsBlock;