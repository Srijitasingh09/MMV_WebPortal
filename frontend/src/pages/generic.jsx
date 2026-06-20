import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SlideshowBlock from './SlideshowBlock';

const API = `http://${window.location.hostname}:8000`;

// Profile photos are tagged via a filename prefix so they can be told apart
// from any other photos uploaded on the same page (e.g. via the old
// standalone "photo" block). This needs no backend changes since photo_name
// is just whatever filename the browser sends.
const PROFILE_PHOTO_TAG = '__profile_photo__';

// Defined outside component so it never causes stale closure issues inside useCallback/useEffect
const blankProfile = {
  name: '', designation: '', university: '', address: '',
  phone: '', officeContact: '', email: ''
};

const GenericContentPage = ({
  section,
  subsection,
  title,
  backPath,
  backLabel,
  pageType = 'description', // 'photo-description' | 'description' | 'pdf-list' | 'table' | 'description-table' | 'photo-description-table' | add 'profile' to any combo
  tableColumns = [],  
  photoAlign = 'left',  
  photoCols = 2,        // how many photos per row (1, 2, 3)
  photoHeight = 200,
  photoWidth = 200,
  slideshowHeight = 360,
  slideshowMaxWidth = '100%',
}) => {
  const navigate  = useNavigate();
  const isAdmin   = localStorage.getItem('isAdmin') === 'true';
  const token     = localStorage.getItem('token');
  const imageRef  = useRef(null);
  const pdfRef    = useRef(null);
  const profileImageRef = useRef(null);

  const [data,       setData]       = useState({});
  const [loading,    setLoading]    = useState(true);
  const [isEditing,  setIsEditing]  = useState(false);
  const [editDesc,   setEditDesc]   = useState('');
  const [saving,     setSaving]     = useState(false);

  // table state
  const [columns,      setColumns]      = useState(tableColumns);
  const [rows,         setRows]         = useState([]);
  const [newRow,       setNewRow]       = useState({});
  const [addingCol,    setAddingCol]    = useState(false);
  const [newColName,   setNewColName]   = useState('');

  // inline row edit state
  const [editingRowIdx,  setEditingRowIdx]  = useState(null); // which row is being edited
  const [editingRowData, setEditingRowData] = useState({});   // copy of that row's data

  // profile state
  const [profile,          setProfile]          = useState(blankProfile);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfile,      setEditProfile]      = useState(blankProfile);
  const [savingProfile,    setSavingProfile]    = useState(false);

  const hasSlideshow = pageType.includes('slideshow');
  const hasPhoto     = pageType.includes('photo'); 
  const hasDesc      = pageType.includes('description');
  const hasPdf       = pageType === 'pdf-list';
  const hasTable     = pageType.includes('table');
  const hasProfile   = pageType.includes('profile');

  // The profile photo is whichever uploaded photo is tagged as such.
  // Everything else is a regular "gallery" photo for the old photo/slideshow
  // block — the two never overlap, so a page can have both independently.
  const allPhotos    = data.photos || [];
  const profilePhoto  = allPhotos.find(p => p.photo_name?.startsWith(PROFILE_PHOTO_TAG)) || null;
  const galleryPhotos = allPhotos.filter(p => !p.photo_name?.startsWith(PROFILE_PHOTO_TAG));

  // FIX 6: Wrapped in useCallback so it can be safely listed as a useEffect dependency
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API}/facility-content`,
        { params: { section, category: subsection } }
      );
      const match = (res.data || [])[0] || {};
      setData(match);
      setEditDesc(match.description || '');

      // parse table / profile from details field (shared JSON blob)
      let parsed = {};
      if (match.details) {
        try { parsed = JSON.parse(match.details); } catch { parsed = {}; }
      }

      if (hasTable) {
        setColumns(parsed.columns || tableColumns);
        setRows(parsed.rows || []);
      }

      if (hasProfile) {
        // Always reset — if this page (e.g. "dean") has no saved profile,
        // don't keep showing whatever the previously viewed page had.
        const merged = { ...blankProfile, ...(parsed.profile || {}) };
        setProfile(merged);
        setEditProfile(merged);
      }
    } catch {
      setData({});
      if (hasTable)   { setColumns(tableColumns); setRows([]); }
      if (hasProfile) { setProfile(blankProfile); setEditProfile(blankProfile); }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, subsection]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── DESCRIPTION SAVE ──
  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/facility-content`,
        { section, category: subsection, sub_category: '', description: editDesc },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchData();
      setIsEditing(false);
    } catch { alert('Save failed'); }
    finally { setSaving(false); }
  };

  // ── TABLE SAVE ──
  const saveTable = async (cols, tableRows) => {
    try {
      // merge with any existing details (e.g. profile) so we don't clobber it
      let existing = {};
      try { existing = data.details ? JSON.parse(data.details) : {}; } catch { existing = {}; }
      const merged = { ...existing, columns: cols, rows: tableRows };
      await axios.put(`${API}/admin/facility-content`,
        {
          section,
          category: subsection,
          sub_category: '',
          details: JSON.stringify(merged)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(prev => ({ ...prev, details: JSON.stringify(merged) }));
    } catch { alert('Table save failed'); }
  };

  // ── PROFILE SAVE ──
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      // merge with any existing details (e.g. table) so we don't clobber it
      let existing = {};
      try { existing = data.details ? JSON.parse(data.details) : {}; } catch { existing = {}; }
      const merged = { ...existing, profile: editProfile };
      await axios.put(`${API}/admin/facility-content`,
        {
          section,
          category: subsection,
          sub_category: '',
          details: JSON.stringify(merged)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(editProfile);
      setData(prev => ({ ...prev, details: JSON.stringify(merged) }));
      setIsEditingProfile(false);
    } catch { alert('Profile save failed'); }
    finally { setSavingProfile(false); }
  };

  // FIX 2: Updated validation to also allow rows where any column has a non-empty value,
  // including PDF URLs that were set programmatically (not typed by the user)
  const handleAddRow = () => {
    const hasAnyValue = columns.some(col => {
      const val = newRow[col] || '';
      return val.trim() !== '';
    });
    if (!hasAnyValue) return;
    const updated = [...rows, { ...newRow }];
    setRows(updated);
    setNewRow({});
    saveTable(columns, updated);
  };

  const handleDeleteRow = (idx) => {
    // Cancel any active row edit to prevent index-shift bug
    // (if a row above or equal to the edited row is deleted, editingRowIdx would point to the wrong row)
    if (editingRowIdx !== null) {
      setEditingRowIdx(null);
      setEditingRowData({});
    }
    const updated = rows.filter((_, i) => i !== idx);
    setRows(updated);
    saveTable(columns, updated);
  };

  // ── ROW EDIT ──
  const handleStartEditRow = (idx) => {
    setEditingRowIdx(idx);
    setEditingRowData({ ...rows[idx] });
  };

  const handleCancelEditRow = () => {
    setEditingRowIdx(null);
    setEditingRowData({});
  };

  const handleSaveEditRow = () => {
    const updated = rows.map((r, i) => i === editingRowIdx ? { ...editingRowData } : r);
    setRows(updated);
    saveTable(columns, updated);
    setEditingRowIdx(null);
    setEditingRowData({});
  };

  const handleAddColumn = () => {
    if (!newColName.trim()) return;
    const updatedCols = [...columns, newColName.trim()];
    const updatedRows = rows.map(r => ({ ...r, [newColName.trim()]: '' }));
    setColumns(updatedCols);
    setRows(updatedRows);
    setNewColName('');
    setAddingCol(false);
    saveTable(updatedCols, updatedRows);
  };

  const handleDeleteColumn = (col) => {
    // Cancel any active row edit — the column being edited may no longer exist
    if (editingRowIdx !== null) {
      setEditingRowIdx(null);
      setEditingRowData({});
    }
    const updatedCols = columns.filter(c => c !== col);
    const updatedRows = rows.map(r => { const c = { ...r }; delete c[col]; return c; });
    setColumns(updatedCols);
    setRows(updatedRows);
    saveTable(updatedCols, updatedRows);
  };

  // ── UPLOADS ──
  const handleImageUpload = async (e) => {
    const files = e.target.files; 
    if (!files || files.length === 0) return;
    const form = new FormData();
    form.append('section', section);
    form.append('category', subsection);
    form.append('sub_category', '');
    for (let file of files) {
      form.append("files", file);
    }
    await axios.post(`${API}/admin/facility-content/upload-photo`, form,
      { headers: { Authorization: `Bearer ${token}` } });
    await fetchData();
    if (imageRef.current) {
      imageRef.current.value = '';
    }
  };

  // ── PROFILE PHOTO UPLOAD ──
  // Tags the uploaded file so it can be reliably identified as THE profile
  // photo later, independent of any other photos on this page. If a profile
  // photo already exists, it's replaced (old one deleted first) so there's
  // always exactly one.
  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // remove any existing profile photo first so re-uploading replaces it
      const existingProfilePhoto = (data.photos || []).find(
        p => p.photo_name?.startsWith(PROFILE_PHOTO_TAG)
      );
      if (existingProfilePhoto) {
        await axios.delete(`${API}/admin/facility-content/photo/${existingProfilePhoto.id}`,
          { headers: { Authorization: `Bearer ${token}` } });
      }

      const taggedFile = new File([file], `${PROFILE_PHOTO_TAG}${file.name}`, { type: file.type });
      const form = new FormData();
      form.append('section', section);
      form.append('category', subsection);
      form.append('sub_category', '');
      form.append('files', taggedFile);

      await axios.post(`${API}/admin/facility-content/upload-photo`, form,
        { headers: { Authorization: `Bearer ${token}` } });
      await fetchData();
    } catch { alert('Profile photo upload failed'); }
    if (profileImageRef.current) {
      profileImageRef.current.value = '';
    }
  };

  // ── PROFILE PHOTO REMOVE ──
  const handleRemoveProfilePhoto = async () => {
    if (!profilePhoto) return;
    if (!window.confirm('Remove this profile photo?')) return;
    try {
      await axios.delete(`${API}/admin/facility-content/photo/${profilePhoto.id}`,
        { headers: { Authorization: `Bearer ${token}` } });
      await fetchData();
    } catch { alert('Remove failed'); }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      await axios.delete(`${API}/admin/facility-content/photo/${photoId}`,
        { headers: { Authorization: `Bearer ${token}` } });
      await fetchData();
    } catch { alert('Delete failed'); }
  };

  const handleDeletePdf = async (pdfId) => {
    if (!window.confirm('Delete this PDF?')) return;
    try {
      await axios.delete(`${API}/admin/facility-content/pdf/${pdfId}`,
        { headers: { Authorization: `Bearer ${token}` } });
      await fetchData();
    } catch { alert('Delete failed'); }
  };

  const handlePdfUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const form = new FormData();
    form.append('section', section);
    form.append('category', subsection);
    form.append('sub_category', '');
    for (let file of files) {
      form.append("files", file);
    }
    await axios.post(`${API}/admin/facility-content/upload-pdf`, form,
      { headers: { Authorization: `Bearer ${token}` } });
    await fetchData();
    // FIX 1: Added null check before accessing pdfRef.current to prevent crash
    if (pdfRef.current) {
      pdfRef.current.value = '';
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#174873]" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">

      {/* Back */}
      <button onClick={() => navigate(backPath)}
        className="text-sm font-medium text-[#174873] hover:text-[#406BC7]">
        ← Back to {backLabel}
      </button>

      <h1 className="text-3xl font-semibold text-[#174873]">{title}</h1>

      {/* ── PROFILE SECTION ── */}
      {hasProfile && (
        <div className="bg-[#eef6ff] rounded-2xl px-8 py-8 text-center relative">

          {isAdmin && !isEditingProfile && (
            <button
              onClick={() => { setEditProfile(profile); setIsEditingProfile(true); }}
              className="absolute top-4 right-4 px-3 py-1.5 border-2 border-[#174873] text-[#174873] rounded-lg text-xs font-medium bg-white/70 hover:bg-white"
            >
              Edit Profile
            </button>
          )}

          {isEditingProfile ? (
            <div className="text-left max-w-xl mx-auto space-y-3">
              <h3 className="text-lg font-bold text-[#174873] text-center mb-2">Edit Profile</h3>

              {/* PROFILE PHOTO */}
              <div className="flex flex-col items-center gap-2 mb-2">
                {profilePhoto ? (
                  <img
                    src={`${API}${profilePhoto.photo_url}`}
                    alt={profilePhoto.photo_name}
                    className="rounded-lg object-cover border border-gray-200"
                    style={{ width: '220px', height: '260px', objectPosition: 'top center' }}
                  />
                ) : (
                  <div className="w-[220px] h-[260px] flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 text-sm bg-white">
                    No photo yet
                  </div>
                )}
                <input type="file" accept="image/*" ref={profileImageRef} className="hidden" onChange={handleProfilePhotoUpload} />
                <div className="flex gap-2">
                  <button
                    onClick={() => profileImageRef.current?.click()}
                    className="px-3 py-1.5 bg-[#174873] text-white rounded-lg text-xs font-medium"
                  >
                    {profilePhoto ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {profilePhoto && (
                    <button
                      onClick={handleRemoveProfilePhoto}
                      className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>

              {/* FIX 8: Removed 'age' field from profile edit form */}
              {[
                { key: 'name',          label: 'Name' },
                { key: 'designation',   label: 'Designation' },
                { key: 'university',    label: 'University / Department' },
                { key: 'address',       label: 'Address' },
                { key: 'phone',         label: 'Contact' },
                { key: 'officeContact', label: 'Office Contact' },
                { key: 'email',         label: 'Email' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {field.label}
                  </label>
                  <input
                    value={editProfile[field.key] || ''}
                    onChange={e => setEditProfile({ ...editProfile, [field.key]: e.target.value })}
                    placeholder={field.label}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#174873]/20 bg-white"
                  />
                </div>
              ))}

              <div className="flex gap-3 justify-center pt-2">
                <button onClick={handleSaveProfile} disabled={savingProfile}
                  className="px-4 py-2 bg-[#174873] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {savingProfile ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 text-gray-500 text-sm">
                  Cancel
                </button>
              </div>
            </div>
          ) : profile.name ? (
            <>
              {profilePhoto && (
                <img
                  src={`${API}${profilePhoto.photo_url}`}
                  alt={profilePhoto.photo_name}
                  className="rounded-lg object-cover border border-gray-200 mx-auto mb-4"
                  style={{ width: '220px', height: '260px', objectPosition: 'top center' }}
                />
              )}

              <h2 className="text-3xl font-bold text-[#174873]">
                {profile.name}
              </h2>

              {profile.designation && (
                <p className="text-xl font-semibold text-[#174873] mt-1">
                  {profile.designation}
                </p>
              )}

              {profile.university && (
                <p className="text-base text-gray-800 mt-3">
                  {profile.university}
                </p>
              )}

              {profile.address && (
                <p className="text-sm text-gray-700 mt-1">
                  {profile.address}
                </p>
              )}

              <div className="mt-4 space-y-1">
                {profile.phone && (
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">Contact:</span>{" "}
                    {profile.phone}
                  </p>
                )}

                {profile.officeContact && (
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">Office Contact:</span>{" "}
                    {profile.officeContact}
                  </p>
                )}

                {profile.email && (
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">Email:</span>{" "}
                    {profile.email}
                  </p>
                )}

                {/* FIX 8: Removed age display — not appropriate for college staff profiles */}
              </div>
            </>
          ) : (
            <p className="italic text-gray-400">
              {isAdmin ? 'No profile yet. Click Edit Profile to add one.' : 'Profile coming soon.'}
            </p>
          )}
        </div>
      )}

      {/* ── ADMIN BAR ── */}
      {isAdmin && (
        <div className="flex gap-3 flex-wrap p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <span className="text-xs font-bold text-yellow-700 w-full">ADMIN CONTROLS</span>
          {(hasPhoto || hasSlideshow) && (
            <>
              <input type="file" accept="image/*" multiple ref={imageRef} className="hidden" onChange={handleImageUpload} />
              <button onClick={() => imageRef.current?.click()}
                className="px-4 py-2 bg-[#174873] text-white rounded-lg text-sm font-medium">
                Upload Photo
              </button>
            </>
          )}
          {(hasDesc || hasPdf) && (
            <>
              <input type="file" accept=".pdf" multiple ref={pdfRef} className="hidden" onChange={handlePdfUpload} />
              <button onClick={() => pdfRef.current?.click()}
                className="px-4 py-2 bg-[#174873] text-white rounded-lg text-sm font-medium">
                Upload PDF
              </button>
            </>
          )}
          {hasDesc && !isEditing && (
            <button onClick={() => setIsEditing(true)}
              className="px-4 py-2 border-2 border-[#174873] text-[#174873] rounded-lg text-sm font-medium">
              Edit Description
            </button>
          )}
        </div>
      )}

      {/* ── PHOTO + DESCRIPTION LAYOUT ── */}
      {(hasPhoto || hasDesc || hasSlideshow) && (
        <div className={`grid grid-cols-1 gap-6 ${
          (hasPhoto || hasSlideshow) && galleryPhotos.length && 
          hasDesc ? photoAlign === 'center' ? '' : 'lg:grid-cols-3': ''
        }`}>

          {/* SLIDESHOW */}
          {hasSlideshow && (
            <div className={`
              ${photoAlign === 'left'   ? 'lg:col-span-1 order-1' : ''}
              ${photoAlign === 'right'  ? 'lg:col-span-1 order-2' : ''}
              ${photoAlign === 'center' ? 'lg:col-span-3' : ''}
            `}>
              <SlideshowBlock
                photos={galleryPhotos}
                isAdmin={isAdmin}
                onDelete={handleDeletePhoto}
                height={slideshowHeight}
                maxWidth={slideshowMaxWidth}
              />
            </div>
          )}

          {/* FIX 3: Now renders ALL gallery photos in a responsive grid
              respecting the photoCols prop (1, 2, or 3 columns per row) */}
          {hasPhoto && galleryPhotos.length > 0 && (
            <div className={`
              ${!hasDesc ? 'lg:col-span-3' : ''}
              ${hasDesc && photoAlign === 'left'   ? 'lg:col-span-1 order-1' : ''}
              ${hasDesc && photoAlign === 'right'  ? 'lg:col-span-1 order-2' : ''}
              ${hasDesc && photoAlign === 'center' ? 'lg:col-span-3' : ''}
            `}>
              <div className={`grid gap-4 ${
                photoCols === 1 ? 'grid-cols-1' :
                photoCols === 3 ? 'grid-cols-3' :
                'grid-cols-2'
              }`}>
                {galleryPhotos.map((photo) => (
                  <div key={photo.id} className="relative border border-blue-100 shadow-lg bg-[#eef6ff] p-3 rounded-2xl text-center">
                    <img
                      src={`${API}${photo.photo_url}`}
                      alt={photo.photo_name}
                      className="object-cover mx-auto rounded-lg"
                      style={{
                        width: `${photoWidth}px`,
                        height: `${photoHeight}px`,
                        objectPosition: 'top center'
                      }}
                    />
                    {isAdmin && (
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute top-1 right-1 px-2 py-1 bg-red-600 text-white text-sm rounded"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasDesc && (
            <div className={`${
              (hasPhoto || hasSlideshow) && galleryPhotos.length
                ? photoAlign === 'right'  ? 'lg:col-span-2 order-1'
                : photoAlign === 'center' ? 'w-full'
                : 'lg:col-span-2 order-2'
                : 'lg:col-span-3'
            }`}>

              {/* FIX 7: Changed min-h-180px → min-h-[180px] (valid Tailwind arbitrary value) */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full min-h-[180px]">
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      rows={8}
                      className="w-full p-5 border border-gray-200 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-[#174873]/20"
                      placeholder="Enter description, contact info, about this section..."
                    />
                    <div className="flex gap-4">
                      <button onClick={handleSave} disabled={saving}
                        className="px-4 py-2 bg-[#174873] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-gray-500 text-sm">
                          Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  (() => {
                    const raw = data.description || '';
                    if (!raw.trim()) {
                      return (
                        <p className="italic text-gray-400 text-center">
                          {isAdmin ? 'No content yet. Click Edit Description.' : 'Content coming soon.'}
                        </p>
                      );
                    }

                    const lines = raw.split('\n');
                    const elements = [];
                    let bulletBuffer = [];
                    let firstLine = true;

                    // Converts plain URLs and [text](url) markdown links into
                    // clickable blue <a> elements. Returns an array of strings/nodes.
                    const renderTextWithLinks = (text) => {
                      // Regex: matches [label](url) OR bare http(s):// URLs
                      const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;
                      const parts = [];
                      let lastIndex = 0;
                      let match;
                      let keyCounter = 0;
                      while ((match = linkRegex.exec(text)) !== null) {
                        // Push any plain text before this match
                        if (match.index > lastIndex) {
                          parts.push(text.slice(lastIndex, match.index));
                        }
                        const label = match[1] || match[3]; // markdown label or raw URL
                        const href  = match[2] || match[3]; // markdown url or raw URL
                        parts.push(
                          <a
                            key={`link-${keyCounter++}`}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800 break-all"
                          >
                            {label}
                          </a>
                        );
                        lastIndex = match.index + match[0].length;
                      }
                      // Remaining plain text
                      if (lastIndex < text.length) {
                        parts.push(text.slice(lastIndex));
                      }
                      return parts.length > 0 ? parts : [text];
                    };

                    const flushBullets = () => {
                      if (bulletBuffer.length > 0) {
                        elements.push(
                          <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 text-gray-700 text-base">
                            {bulletBuffer.map((b, i) => (
                              <li key={i}>{renderTextWithLinks(b)}</li>
                            ))}
                          </ul>
                        );
                        bulletBuffer = [];
                      }
                    };

                    lines.forEach((line, idx) => {
                      const trimmed = line.trim();

                      // blank line → spacer
                      if (trimmed === '') {
                        flushBullets();
                        elements.push(<div key={`sp-${idx}`} className="h-2" />);
                        return;
                      }

                      // very first non-blank line → big centered heading
                      if (firstLine) {
                        firstLine = false;
                        flushBullets();
                        elements.push(
                          <h2 key={idx} className="text-2xl font-bold text-[#174873] text-center pb-2 border-b border-gray-200">
                            {trimmed}
                          </h2>
                        );
                        return;
                      }

                      // ## Subheading
                      if (trimmed.startsWith('## ')) {
                        flushBullets();
                        elements.push(
                          <h3 key={idx} className="text-lg font-semibold text-[#174873] mt-4">
                            {trimmed.slice(3)}
                          </h3>
                        );
                        return;
                      }

                      // ### Smaller subheading
                      if (trimmed.startsWith('### ')) {
                        flushBullets();
                        elements.push(
                          <h4 key={idx} className="text-base font-semibold text-gray-800 mt-3">
                            {trimmed.slice(4)}
                          </h4>
                        );
                        return;
                      }

                      // - Bullet point
                      if (trimmed.startsWith('- ')) {
                        bulletBuffer.push(trimmed.slice(2));
                        return;
                      }

                      // **Bold line** (entire line wrapped in **)
                      // Handle bold segments anywhere in the line using **...**
                      if (trimmed.includes('**')) {
                        flushBullets();
                        const parts = trimmed.split(/(\*\*.*?\*\*)/g).filter(Boolean);
                        elements.push(
                          <p key={idx} className="text-gray-800 text-base text-left">
                            {parts.map((part, i) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                  <span key={i} className="font-semibold">
                                    {renderTextWithLinks(part.slice(2, -2))}
                                  </span>
                                );
                              }
                              return <span key={i}>{renderTextWithLinks(part)}</span>;
                            })}
                          </p>
                        );
                        return;
                      }

                      // > Highlighted note / callout box
                      // FIX 4: Changed bg-[#174873]/8 → bg-[#174873]/[8%] (valid Tailwind opacity syntax)
                      if (trimmed.startsWith('> ')) {
                        flushBullets();
                        elements.push(
                          <div key={idx} className="bg-[#174873]/[8%] border-l-4 border-[#174873] pl-4 py-2 rounded-r-lg text-gray-700 italic text-sm">
                            {renderTextWithLinks(trimmed.slice(2))}
                          </div>
                        );
                        return;
                      }

                      // --- Divider line
                      if (trimmed === '---') {
                        flushBullets();
                        elements.push(
                          <hr key={idx} className="border-gray-200 my-2" />
                        );
                        return;
                      }

                      // Plain paragraph
                      flushBullets();
                      elements.push(
                        <p key={idx} className="text-gray-700 text-base leading-relaxed text-left">
                          {renderTextWithLinks(trimmed)}
                        </p>
                      );
                    });

                    flushBullets();
                    return <div className="space-y-2">{elements}</div>;
                  })()
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PDF VIEWER ── */}
      
      {hasPdf && data.pdfs?.length > 0 && (
        <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#174873] px-6 py-4">
            <h2 className="text-lg font-semibold text-white">📄 Documents</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {data.pdfs.map(pdf => (
              <div key={pdf.id} className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4 flex-1">
                  <svg
                    className="w-6 h-6 text-red-500 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8.5 3.5a2 2 0 0 1 4 0V4h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3.5a2 2 0 0 1 2-2zm0 2v-.5a.5.5 0 0 0-.5-.5.5.5 0 0 0-.5.5V5.5h1zm4 0v-.5a.5.5 0 0 0-.5-.5.5.5 0 0 0-.5.5V5.5h1z" />
                  </svg>

                  <div className="flex-1">
                    <a href={`${API}${pdf.pdf_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#174873] font-medium hover:text-[#406BC7] hover:underline break-all"
                    >
                      {pdf.pdf_name}
                    </a>
                    <p className="text-xs text-gray-500 mt-1">
                      Click to open in new tab
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleDeletePdf(pdf.id)}
                    className="ml-4 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium"
                    title="Delete PDF"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TABLE ── */}
      {hasTable && (
        <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#174873] text-white">
                  {columns.map(col => (
                    <th key={col} className="px-4 py-3 text-left font-semibold">
                      {col}
                      {isAdmin && (
                        <button onClick={() => handleDeleteColumn(col)}
                          className="ml-2 text-red-300 hover:text-white text-xs">×</button>
                      )}
                    </th>
                  ))}
                  {isAdmin && (
                    <th className="px-4 py-3">
                      {addingCol ? (
                        <div className="flex gap-1">
                          <input value={newColName} onChange={e => setNewColName(e.target.value)}
                            placeholder="Column name"
                            className="px-2 py-1 text-black rounded text-xs w-24" />
                          <button onClick={handleAddColumn} className="text-green-300 text-xs font-bold">✓</button>
                          <button onClick={() => setAddingCol(false)} className="text-gray-300 text-xs">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => setAddingCol(true)}
                          className="text-blue-200 hover:text-white text-xs font-bold">
                          + Col
                        </button>
                      )}
                    </th>
                  )}
                  {isAdmin && <th className="px-4 py-3 w-20">Action</th>}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + (isAdmin ? 2 : 0)}
                      className="px-4 py-8 text-center text-gray-400 italic">
                      {isAdmin ? 'No rows yet. Add columns first, then add rows.' : 'No data available.'}
                    </td>
                  </tr>
                )}
                {rows.map((row, idx) => {
                  const isEditingThisRow = isAdmin && editingRowIdx === idx;
                  return (
                    <tr key={idx} className={`border-t border-gray-100 transition-colors ${isEditingThisRow ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      {columns.map(col => (
                        <td key={col} className="px-4 py-3 text-gray-700">
                          {isEditingThisRow ? (
                            /* ── EDIT MODE: show input for each cell ── */
                            col.toLowerCase().includes('pdf') || col.toLowerCase().includes('document') || col.toLowerCase().includes('syllabus') ? (
                              <div className="space-y-1">
                                {editingRowData[col] ? (
                                  <div className="flex items-center gap-1">
                                    <a href={editingRowData[col].startsWith('http') ? editingRowData[col] : `${API}${editingRowData[col]}`}
                                      target="_blank" rel="noopener noreferrer"
                                      className="text-xs text-[#174873] hover:underline truncate max-w-[80px]">
                                      Current PDF
                                    </a>
                                    <button onClick={() => setEditingRowData(prev => ({ ...prev, [col]: '' }))}
                                      className="text-red-400 text-xs hover:text-red-600">✕</button>
                                  </div>
                                ) : (
                                  <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 bg-[#174873] text-white rounded text-xs">
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                                    </svg>
                                    Upload PDF
                                    <input type="file" accept=".pdf" className="hidden"
                                      onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        try {
                                          const form = new FormData();
                                          form.append('section', section || '');
                                          form.append('category', subsection || '');
                                          form.append('sub_category', '');
                                          form.append('files', file);
                                          const res = await axios.post(
                                            `${API}/admin/facility-content/upload-pdf`, form,
                                            { headers: { Authorization: `Bearer ${token}` } }
                                          );
                                          const pdfUrl = res.data.pdf_url || res.data.pdfs?.[0]?.pdf_url;
                                          if (pdfUrl) setEditingRowData(prev => ({ ...prev, [col]: pdfUrl }));
                                          else alert('Upload succeeded but URL not returned: ' + JSON.stringify(res.data));
                                        } catch (err) {
                                          alert('Upload failed: ' + JSON.stringify(err.response?.data));
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                                <input
                                  value={editingRowData[col] || ''}
                                  onChange={e => setEditingRowData(prev => ({ ...prev, [col]: e.target.value }))}
                                  placeholder="or paste URL"
                                  className="w-full px-2 py-1 border border-blue-300 rounded text-xs outline-none focus:ring-1 focus:ring-[#174873]"
                                />
                              </div>
                            ) : (
                              <input
                                value={editingRowData[col] || ''}
                                onChange={e => setEditingRowData(prev => ({ ...prev, [col]: e.target.value }))}
                                placeholder={col}
                                className="w-full px-2 py-1 border border-blue-300 rounded text-sm outline-none focus:ring-1 focus:ring-[#174873]"
                              />
                            )
                          ) : (
                            /* ── VIEW MODE: show value as before ── */
                            row[col]
                              ? row[col].startsWith('/uploads/') || row[col].startsWith('http')
                                ? (
                                  <a href={row[col].startsWith('http') ? row[col] : `${API}${row[col]}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[#174873] hover:underline font-medium text-sm">
                                    <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                                    </svg>
                                    View PDF
                                  </a>
                                )
                                : row[col]
                              : '—'
                          )}
                        </td>
                      ))}

                      {/* Action cell: Edit/Save/Cancel + Remove */}
                      {isAdmin && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isEditingThisRow ? (
                            <div className="flex gap-2">
                              <button onClick={handleSaveEditRow}
                                className="text-green-600 hover:text-green-800 text-xs font-bold">
                                Save
                              </button>
                              <button onClick={handleCancelEditRow}
                                className="text-gray-400 hover:text-gray-600 text-xs">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button onClick={() => handleStartEditRow(idx)}
                                className="text-[#174873] hover:text-[#406BC7] text-xs font-bold">
                                Edit
                              </button>
                              <button onClick={() => handleDeleteRow(idx)}
                                className="text-red-500 hover:text-red-700 text-xs font-bold">
                                Remove
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}

                {/* Add row */}
                {isAdmin && columns.length > 0 && (
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    {columns.map(col => (
                      <td key={col} className="px-4 py-2">
                        {col.toLowerCase().includes('pdf') || col.toLowerCase().includes('document') || col.toLowerCase().includes('syllabus') ? (
                          <div className="space-y-1">
                            {/* Show upload button if no value yet */}
                            {!newRow[col] ? (
                              <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 bg-[#174873] text-white rounded text-xs">
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                                </svg>
                                Upload PDF
                                <input
                                  type="file"
                                  accept=".pdf"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    try {
                                      const form = new FormData();
                                      form.append('section', section || '');
                                      form.append('category', subsection || '');
                                      form.append('sub_category', '');
                                      form.append('files', file);

                                      // FIX 5: Removed debug console.log that was left in by mistake

                                      const res = await axios.post(
                                        `${API}/admin/facility-content/upload-pdf`, form,
                                        { headers: { Authorization: `Bearer ${token}` } }
                                      );
                                      const pdfUrl = res.data.pdf_url || res.data.pdfs?.[0]?.pdf_url;
                                      if (pdfUrl) {
                                        setNewRow(prev => ({ ...prev, [col]: pdfUrl }));
                                      } else {
                                        alert('Upload succeeded but URL not returned: ' + JSON.stringify(res.data));
                                      }
                                    } catch (err) {
                                      alert('Upload failed: ' + JSON.stringify(err.response?.data));
                                    }
                                  }}
                                />
                              </label>
                            ) : (
                              /* Show filename + remove option if uploaded */
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-green-600 truncate max-w-[80px]">✓ Uploaded</span>
                                <button
                                  onClick={() => setNewRow({ ...newRow, [col]: '' })}
                                  className="text-red-400 text-xs hover:text-red-600">
                                  ✕
                                </button>
                              </div>
                            )}
                            {/* Also allow manual URL paste */}
                            <input
                              value={newRow[col] || ''}
                              onChange={e => setNewRow({ ...newRow, [col]: e.target.value })}
                              placeholder="or paste URL"
                              className="w-full px-2 py-1 border border-blue-200 rounded text-xs outline-none"
                            />
                          </div>
                        ) : (
                          /* Normal text input for non-PDF columns */
                          <input
                            value={newRow[col] || ''}
                            onChange={e => setNewRow({ ...newRow, [col]: e.target.value })}
                            placeholder={col}
                            className="w-full px-2 py-1 border border-blue-200 rounded text-sm outline-none"
                          />
                        )}
                      </td>
                    ))}
                    {/* FIX 9: Removed extra blank <td /> here too — only one Action cell */}
                    <td className="px-4 py-2">
                      <button onClick={handleAddRow}
                        className="px-3 py-1 bg-[#174873] text-white rounded text-xs font-bold">
                        Add
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenericContentPage;