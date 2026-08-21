import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CARD_PHOTO_TAG = '__profile_card_';
const CARDS_VISIBLE = 3;
const CARD_WIDTH = 350;   // reference width for desktop calculations
const CARD_GAP = 28;      // reference gap (1.75rem)

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
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconMail = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16v16H4z" opacity="0" />
    <path d="M22 6l-10 7L2 6" />
    <rect x="2" y="4" width="20" height="16" rx="2" />
  </svg>
);

const IconBuilding = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M6 21V7l6-4 6 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1" />
  </svg>
);

const IconPerson = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.42 0-8 2.24-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.76-3.58-5-8-5z" />
  </svg>
);

const ScrollArrow = ({ direction, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={direction === 'left' ? 'Show previous profile' : 'Show next profile'}
    title={direction === 'left' ? 'Show previous' : 'Show more'}
    className={`absolute top-1/2 -translate-y-1/2 z-20 w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 backdrop-blur-xs border-2 border-[#0f3358]/20 shadow-md sm:shadow-lg flex items-center justify-center text-[#0f3358] hover:bg-[#0f3358] hover:text-white hover:border-[#0f3358] active:scale-95 transition-all cursor-pointer ${
      direction === 'left' ? 'left-1 sm:-left-3 md:-left-5' : 'right-1 sm:-right-3 md:-right-5'
    }`}
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {direction === 'left' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
    </svg>
  </button>
);

const ProfileCard = ({ card, photoUrl, isAdmin, onEdit, onDelete }) => (
  <div className="relative w-full max-w-[350px] h-full bg-white border-2 border-slate-300 rounded-2xl sm:rounded-3xl shadow-md overflow-hidden flex flex-col items-center justify-between pt-6 xs:pt-8 pb-6 xs:pb-7 px-4 xs:px-6 sm:px-7 text-center mx-auto transition-shadow hover:shadow-lg">
    {isAdmin && (
      <div className="absolute top-3 right-3 flex gap-1.5 sm:gap-2 z-10">
        <button
          onClick={() => onEdit(card)}
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white/90 border border-slate-200 text-[#174873] hover:bg-slate-100 shadow-sm cursor-pointer transition-colors"
          title="Edit profile card"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-4.5 sm:h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
        </button>
        <button
          onClick={() => onDelete(card)}
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white/90 border border-slate-200 text-red-500 hover:bg-red-50 shadow-sm cursor-pointer transition-colors"
          title="Delete profile card"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-4.5 sm:h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z" /></svg>
        </button>
      </div>
    )}

    {/* Main Top/Middle Info Section */}
    <div className="flex flex-col items-center w-full flex-1">
      {/* photo */}
      <div className="relative mb-4 xs:mb-5 shrink-0">
        <div className="w-28 h-28 xs:w-36 xs:h-36 sm:w-40 sm:h-40 rounded-full border-3 sm:border-4 border-[#0f3358] overflow-hidden bg-slate-100 flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105">
          {photoUrl ? (
            <img src={photoUrl} alt={card.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 xs:w-16 xs:h-16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.42 0-8 2.24-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.76-3.58-5-8-5z" />
              </svg>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 right-0 sm:right-1 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-full bg-[#0f3358] border-2 border-white flex items-center justify-center text-white shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.42 0-8 2.24-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.76-3.58-5-8-5z" />
          </svg>
        </div>
      </div>

      <h3 className="text-lg xs:text-xl sm:text-2xl font-extrabold font-cinzel text-[#0f3358] text-center leading-tight tracking-wide break-words [overflow-wrap:anywhere] w-full px-1">
        {card.name || 'Unnamed'}
      </h3>
      <div className="w-10 sm:w-12 h-[3px] bg-[#d4af37] my-2 xs:my-2.5 rounded-full shrink-0" />
      
      {card.designation && (
        <p className="text-[#7d311f] text-base xs:text-lg sm:text-xl font-bold mb-2 xs:mb-2.5 text-center leading-snug break-words [overflow-wrap:anywhere] w-full px-1">
          {card.designation}
        </p>
      )}
      
      {card.badge && (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 bg-[#EAEFF5] text-[#0f3358] text-xs xs:text-sm sm:text-base font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl mb-2 xs:mb-2.5 shadow-xs max-w-full text-center break-words [overflow-wrap:anywhere] leading-tight">
          <IconBuilding />
          <span>{card.badge}</span>
        </div>
      )}
      
      {card.university && (
        <p className="text-slate-600 text-xs xs:text-sm sm:text-base font-semibold text-center mb-3.5 sm:mb-4 break-words [overflow-wrap:anywhere] w-full px-1">
          {card.university}
        </p>
      )}
    </div>

    {/* Contact Details Section */}
    {(card.phone || card.email) && (
      <div className="w-full border-t border-slate-200 pt-3.5 sm:pt-4 mt-auto">
        <div className="w-full max-w-full space-y-2.5 sm:space-y-3 text-left">
          {card.phone && (
            <div className="flex items-center gap-2.5 sm:gap-3 text-xs xs:text-sm sm:text-base font-semibold text-slate-800 w-full min-w-0">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EAEFF5] text-[#174873] flex items-center justify-center shrink-0 shadow-xs"><IconPhone /></span>
              <span className="break-all [overflow-wrap:anywhere] min-w-0 flex-1">{card.phone}</span>
            </div>
          )}
          {card.email && (
            <div className="flex items-center gap-2.5 sm:gap-3 text-xs xs:text-sm sm:text-base font-semibold text-slate-800 w-full min-w-0">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EAEFF5] text-[#174873] flex items-center justify-center shrink-0 shadow-xs"><IconMail /></span>
              <span className="break-all [overflow-wrap:anywhere] min-w-0 flex-1">{card.email}</span>
            </div>
          )}
        </div>
      </div>
    )}

    <div className="absolute bottom-0 left-0 right-0 h-1.5 sm:h-2 bg-[#0f3358]" />
  </div>
);

const ProfileCardsBlock = forwardRef(({ section, subsection, content, isAdmin, token, onChanged }, ref) => {
  const fileRef = useRef(null);
  const scrollRef = useRef(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blankCard());
  const [isNew, setIsNew] = useState(true);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  let details = {};
  try { details = content?.details ? JSON.parse(content.details) : {}; } catch { details = {}; }
  const cards = Array.isArray(details.profileCards) ? details.profileCards : [];
  const photos = content?.photos || [];
  const photoFor = (cardId) =>
    photos.find(p => p.photo_name?.startsWith(`${CARD_PHOTO_TAG}${cardId}__`))?.photo_url;

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) { setCanScrollLeft(false); setCanScrollRight(false); return; }
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 2);
  };

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (!el) return;

    const onResize = () => updateScrollButtons();
    window.addEventListener('resize', onResize);

    const ro = new ResizeObserver(() => updateScrollButtons());
    ro.observe(el);

    return () => {
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [cards.length]);

  const scrollByCard = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const firstCard = el.querySelector('.profile-card-item');
    const computedGap = parseFloat(window.getComputedStyle(el).gap) || CARD_GAP;
    const step = firstCard ? firstCard.getBoundingClientRect().width + computedGap : CARD_WIDTH + CARD_GAP;
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  const openAdd = () => {
    setForm(blankCard());
    setIsNew(true);
    setPhotoFile(null);
    setPhotoPreview('');
    setRemovePhoto(false);
    setShowForm(true);
  };

  useImperativeHandle(ref, () => ({ openAddForm: openAdd }));

  const openEdit = (card) => {
    setForm({ ...card });
    setIsNew(false);
    setPhotoFile(null);
    setPhotoPreview(photoFor(card.id) ? `${API}${photoFor(card.id)}` : '');
    setRemovePhoto(false);
    setShowForm(true);
  };

  const handlePhotoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setRemovePhoto(false);
  };

  const handleRemovePhotoClick = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setRemovePhoto(true);
    if (fileRef.current) fileRef.current.value = '';
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
        if (!isNew) await removePhotoFor(form.id);
        await uploadPhotoFor(form.id, photoFile);
      } else if (removePhoto && !isNew) {
        await removePhotoFor(form.id);
      }

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

  const maxContainerWidth = CARDS_VISIBLE * CARD_WIDTH + (CARDS_VISIBLE - 1) * CARD_GAP;

  return (
    <>
      <div 
        className="relative my-4 sm:my-6 mx-auto px-4 xs:px-6 sm:px-10 md:px-12 w-full"
        style={{ maxWidth: maxContainerWidth + 96 }}
      >
        {canScrollLeft && (
          <ScrollArrow direction="left" onClick={() => scrollByCard(-1)} />
        )}
        {canScrollRight && (
          <ScrollArrow direction="right" onClick={() => scrollByCard(1)} />
        )}

        {/* Horizontal Scroll Track */}
        <div
          ref={scrollRef}
          onScroll={updateScrollButtons}
          className={`flex gap-4 xs:gap-5 sm:gap-7 py-3 sm:py-4 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar w-full ${
            cards.length < CARDS_VISIBLE ? 'justify-start md:justify-center' : 'justify-start'
          }`}
        >
          {cards.map(card => (
            <div 
              key={card.id} 
              className="profile-card-item w-[calc(100vw-3.5rem)] max-w-[320px] xs:max-w-[350px] sm:w-[350px] shrink-0 snap-center sm:snap-start flex flex-col"
            >
              <ProfileCard
                card={card}
                photoUrl={photoFor(card.id) ? `${API}${photoFor(card.id)}` : null}
                isAdmin={isAdmin}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>

        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        `}</style>
      </div>

      {/* Responsive Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 xs:p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 my-auto max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold text-[#0f3358] mb-4 font-cinzel">
              {isNew ? 'Add Profile Card' : 'Edit Profile Card'}
            </h3>

            <div className="flex items-center gap-3 xs:gap-4 mb-4">
              <div className="w-14 h-14 xs:w-16 xs:h-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" alt="" /> : <IconPerson />}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhotoClick}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                  >
                    Remove Photo
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
              </div>
            </div>

            <div className="space-y-3">
              <input className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f3358]/20 focus:border-[#0f3358]"
                placeholder="Full Name *" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <input className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f3358]/20 focus:border-[#0f3358]"
                placeholder="Designation (e.g. Warden)" value={form.designation}
                onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} />
              <input className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f3358]/20 focus:border-[#0f3358]"
                placeholder="Hostel / Department (e.g. Sunrise Boys Hostel)" value={form.badge}
                onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} />
              <input className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f3358]/20 focus:border-[#0f3358]"
                placeholder="University / College" value={form.university}
                onChange={e => setForm(f => ({ ...f, university: e.target.value }))} />
              <input className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f3358]/20 focus:border-[#0f3358]"
                placeholder="Phone" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              <input className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f3358]/20 focus:border-[#0f3358]"
                placeholder="Email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-[#174873] text-white hover:bg-[#0f3358] disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default ProfileCardsBlock;