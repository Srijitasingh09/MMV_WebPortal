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

// Same idea, but for PDFs uploaded into a table cell (e.g. a "syllabus PDF"
// column). They're stored in the same backend `pdfs` table as the standalone
// pdf-list block, so they need a tag to be told apart — otherwise they'd also
// show up in the generic "Documents" viewer below the description.
const TABLE_PDF_TAG = '__table_pdf__';

// ─── Shared heading / subheading styles ─────────────────────────────────────
const HEADING_STYLES = {
  heading:        'text-3xl font-semibold text-[#7D311F]',   // main page-level heading (first line of description)
  subheading:     'text-2xl font-bold text-[#7D311F]',       // '## ' — description body, description notes, accordion notes
  subSubheading:  'text-lg font-bold text-[#174873]',    // '### ' — description body, description notes, accordion notes
  accordionTitle: 'text-[16px] font-semibold text-[#174873]',    // accordion bar title ('+++ Title')
};

// ─── Body text size per description section ────────────────────────────────
const BODY_STYLES = {
  default:       'text-md',   // text before any '## '/'### ' has appeared yet
  subheading:    'text-md', // text under the most recent '## ' subheading
  subSubheading: 'text-md',   // text under the most recent '### ' sub-subheading
};

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
  photoHeight = 500,
  photoWidth = '100%',
  slideshowHeight = 500,
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

  // description: '+++ Title ... +++' collapsible blocks (see flushAccordion
  // in the render below). openSections tracks which block indices are open;
  // every block starts closed until clicked.
  const [openSections, setOpenSections] = useState({});

  // table state
  const [columns,      setColumns]      = useState(tableColumns);
  const [rows,         setRows]         = useState([]);
  const [newRow,       setNewRow]       = useState({});
  const [addingCol,    setAddingCol]    = useState(false);
  const [newColName,   setNewColName]   = useState('');
  const [tableHeading,     setTableHeading]     = useState('');
  const [isEditingHeading, setIsEditingHeading] = useState(false);
  const [editTableHeading, setEditTableHeading] = useState('');
  const [savingHeading,    setSavingHeading]    = useState(false);

  // inline row edit state
  const [editingRowIdx,  setEditingRowIdx]  = useState(null); // which row is being edited
  const [editingRowData, setEditingRowData] = useState({});   // copy of that row's data

  // profile state
  const [profile,          setProfile]          = useState(blankProfile);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfile,      setEditProfile]      = useState(blankProfile);
  const [savingProfile,    setSavingProfile]    = useState(false);

  // Photo size settings — admin-editable, saved per-page in `details` JSON.
  // Falls back to the router-config props above until/unless a page has its
  // own saved override (see fetchData -> parsed.photoSettings below).
  const blankPhotoSettings = {
    cols: photoCols,
    height: photoHeight,
    width: photoWidth,
    align: photoAlign === 'center' ? 'top' : photoAlign, // 'left' | 'right' | 'top'
    slideshowHeight: slideshowHeight,
    slideshowMaxWidth: slideshowMaxWidth,
  };
  const [photoSettings,        setPhotoSettings]        = useState(blankPhotoSettings);
  const [isEditingPhotoSize,   setIsEditingPhotoSize]   = useState(false);
  const [editPhotoSettings,    setEditPhotoSettings]    = useState(blankPhotoSettings);
  const [isEditingSlideSize,   setIsEditingSlideSize]   = useState(false);
  const [editSlideSettings,    setEditSlideSettings]    = useState(blankPhotoSettings);
  const [savingPhotoSettings,  setSavingPhotoSettings]  = useState(false);

  const hasSlideshow = pageType.includes('slideshow');
  const hasPhoto     = pageType.includes('photo'); 
  const hasDesc      = pageType.includes('description');
  const hasPdf       = pageType.includes('pdf-list');
  const hasTable     = pageType.includes('table');
  const hasProfile   = pageType.includes('profile');

  // The profile photo is whichever uploaded photo is tagged as such.
  // Everything else is a regular "gallery" photo for the old photo/slideshow
  // block — the two never overlap, so a page can have both independently.
  const allPhotos    = data.photos || [];
  const profilePhoto  = allPhotos.find(p => p.photo_name?.startsWith(PROFILE_PHOTO_TAG)) || null;
  const galleryPhotos = allPhotos.filter(p => !p.photo_name?.startsWith(PROFILE_PHOTO_TAG));

  // Same split for PDFs: a PDF uploaded into a table cell is tagged so it
  // only shows up inside that table cell, never in the standalone "Documents"
  // viewer used by the pdf-list block.
  const allPdfs    = data.pdfs || [];
  const galleryPdfs = allPdfs.filter(p => !p.pdf_name?.startsWith(TABLE_PDF_TAG));

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

      // parse table / profile / photoSettings from details field (shared JSON blob)
      let parsed = {};
      if (match.details) {
        try { parsed = JSON.parse(match.details); } catch { parsed = {}; }
      }

      setOpenSections({}); // reset accordion open/closed state when navigating to a different page

      if (hasTable) {
        setColumns(parsed.columns || tableColumns);
        setRows(parsed.rows || []);
        const heading = parsed.tableHeading || '';
        setTableHeading(heading);
        setEditTableHeading(heading);
      }

      if (hasProfile) {
        // Always reset — if this page (e.g. "dean") has no saved profile,
        // don't keep showing whatever the previously viewed page had.
        const merged = { ...blankProfile, ...(parsed.profile || {}) };
        setProfile(merged);
        setEditProfile(merged);
      }

      // Photo size settings: start from router-config defaults, then layer
      // any saved per-page override on top. Always reset on page change so
      // switching pages doesn't carry over a previous page's saved sizes.
      const mergedPhotoSettings = { ...blankPhotoSettings, ...(parsed.photoSettings || {}) };
      setPhotoSettings(mergedPhotoSettings);
      setEditPhotoSettings(mergedPhotoSettings);
      setEditSlideSettings(mergedPhotoSettings);
    } catch {
      setData({});
      if (hasTable)   { setColumns(tableColumns); setRows([]); setTableHeading(''); setEditTableHeading(''); }
      if (hasProfile) { setProfile(blankProfile); setEditProfile(blankProfile); }
      setOpenSections({});
      setPhotoSettings(blankPhotoSettings);
      setEditPhotoSettings(blankPhotoSettings);
      setEditSlideSettings(blankPhotoSettings);
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

  // ── TABLE ROW ORDER ── rows are displayed in the exact order they're
  // stored in; admins reorder them manually with the ▲/▼ buttons below
  // (see handleMoveRow), which swaps rows and persists the new order.
  const displayRows = rows.map((row, origIdx) => ({ row, origIdx }));

  // ── ROW REORDER (admin only) ── swap a row with its neighbor and persist
  const handleMoveRow = (idx, direction) => {
    if (editingRowIdx !== null) return; // avoid index confusion mid-edit
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= rows.length) return;
    const updated = [...rows];
    [updated[idx], updated[targetIdx]] = [updated[targetIdx], updated[idx]];
    setRows(updated);
    saveTable(columns, updated);
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

  // ── TABLE HEADING SAVE ──
  const handleSaveTableHeading = async () => {
    setSavingHeading(true);
    try {
      let existing = {};
      try { existing = data.details ? JSON.parse(data.details) : {}; } catch { existing = {}; }
      const merged = { ...existing, tableHeading: editTableHeading };
      await axios.put(`${API}/admin/facility-content`,
        {
          section,
          category: subsection,
          sub_category: '',
          details: JSON.stringify(merged)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTableHeading(editTableHeading);
      setData(prev => ({ ...prev, details: JSON.stringify(merged) }));
      setIsEditingHeading(false);
    } catch { alert('Table heading save failed'); }
    finally { setSavingHeading(false); }
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

  // ── PHOTO SETTINGS SAVE ──
  // Same merge-into-`details` pattern as saveTable/handleSaveProfile so this
  // never clobbers table/profile data already saved on this page.
  const savePhotoSettings = async (newSettings) => {
    setSavingPhotoSettings(true);
    try {
      let existing = {};
      try { existing = data.details ? JSON.parse(data.details) : {}; } catch { existing = {}; }
      const merged = { ...existing, photoSettings: newSettings };
      await axios.put(`${API}/admin/facility-content`,
        {
          section,
          category: subsection,
          sub_category: '',
          details: JSON.stringify(merged)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPhotoSettings(newSettings);
      setData(prev => ({ ...prev, details: JSON.stringify(merged) }));
    } catch { alert('Photo size save failed'); }
    finally { setSavingPhotoSettings(false); }
  };

  const handleSavePhotoGridSettings = () => {
    const clampedCols = Math.min(3, Math.max(1, Number(editPhotoSettings.cols) || 1));
    const validAligns = ['left', 'right', 'top'];
    const nextAlign = validAligns.includes(editPhotoSettings.align) ? editPhotoSettings.align : photoSettings.align;
    const next = {
      ...photoSettings,
      cols: clampedCols,
      height: Number(editPhotoSettings.height) || photoSettings.height,
      width: Number(editPhotoSettings.width) || photoSettings.width,
      align: nextAlign,
    };
    savePhotoSettings(next);
    setIsEditingPhotoSize(false);
  };

  const handleSaveSlideshowSettings = () => {
    const next = { ...photoSettings, slideshowHeight: Number(editSlideSettings.slideshowHeight) || photoSettings.slideshowHeight, slideshowMaxWidth: editSlideSettings.slideshowMaxWidth || photoSettings.slideshowMaxWidth };
    savePhotoSettings(next);
    setIsEditingSlideSize(false);
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-4">
      {/*---PILL HEADING---*/}
       <div className="relative left-1/2 -translate-x-1/2 w-screen mb-10">
        <div className="w-[50%] bg-[#585858] rounded-r-full shadow-sm">
          <div className="max-w-5xl mx-auto h-16 flex items-center justify-center px-4 sm:px-6">
            <h1 className="text-white font-semibold text-3xl sm:text-xl md:text-3xl text-center">
              {title}
            </h1>
          </div>
        </div>
      </div>
      {/* ── PROFILE SECTION ── */}
      {hasProfile && (
        <div className="bg-[#0D1F3C] rounded-2xl px-4 sm:px-8 py-6 sm:py-8 text-center relative">
          {/*--admin profile edit --*/}
          {isAdmin && !isEditingProfile && (
            <button
              onClick={() => { setEditProfile(profile); setIsEditingProfile(true); }}
              className="absolute top-4 right-4 px-3 py-1.5 border-2 border-[#174873] text-[#174873] rounded-lg text-xs font-medium bg-white "
            >
              Edit Profile
            </button>
          )}

          {isEditingProfile ? (
            <div className="text-left max-w-xl mx-auto space-y-3">
              <h3 className="text-lg font-bold text-white text-center mb-2">Edit Profile</h3>

              {/* PROFILE PHOTO */}
              <div className="flex flex-col items-center gap-2 mb-2">
                {profilePhoto ? (
                  <img
                    src={`${API}${profilePhoto.photo_url}`}
                    alt={profilePhoto.photo_name}
                    className="rounded-lg object-cover border border-gray-200 w-[160px] h-[190px] sm:w-[220px] sm:h-[260px]"
                    style={{ objectPosition: 'top center' }}
                  />
                ) : (
                  <div className="w-[160px] h-[190px] sm:w-[220px] sm:h-[260px] flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 text-sm bg-white">
                    No photo yet
                  </div>
                )}
                <input type="file" accept="image/*" ref={profileImageRef} className="hidden" onChange={handleProfilePhotoUpload} />
                <div className="flex gap-2">
                  <button
                    onClick={() => profileImageRef.current?.click()}
                    className="px-3 py-1.5 bg-white text-black rounded-lg text-xs font-medium"
                  >
                    {profilePhoto ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {profilePhoto && (
                    <button
                      onClick={handleRemoveProfilePhoto}
                      className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-medium bg-white"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>

         
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
                  <label className="block text-base font-semibold text-white mb-1">
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
                  className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium disabled:opacity-50 ">
                  {savingProfile ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 text-black rounded-lg font-medium bg-white text-sm">
                  Cancel
                </button>
              </div>
            </div>
          ) : profile.name ? (
            <> {/*--user view profile--*/}
              {profilePhoto && (
                <img
                  src={`${API}${profilePhoto.photo_url}`}
                  alt={profilePhoto.photo_name}
                  className="rounded-lg object-cover border-3 border-white mx-auto mb-4 w-[160px] h-[190px] sm:w-[220px] sm:h-[260px]"
                  style={{ objectPosition: 'top center' }}
                />
              )}

              <h2 className="text-2xl sm:text-3xl font-bold text-[#E8C97A] break-words">
                {profile.name}
              </h2>

              {profile.designation && (
                <p className="text-2xl font-semibold text-[#E8C97A] mt-1">
                  {profile.designation}
                </p>
              )}

              {profile.university && (
                <p className="text-base text-white mt-1">
                  {profile.university}
                </p>
              )}

              {profile.address && (
                <p className="text-sm text-white mt-1">
                  {profile.address}
                </p>
              )}

              <div className="mt-4 space-y-1">
                {profile.phone && (
                  <p className="text-sm text-white">
                    <span className="font-semibold">Contact:</span>{" "}
                    {profile.phone}
                  </p>
                )}

                {profile.officeContact && (
                  <p className="text-sm text-white">
                    <span className="font-semibold">Office Contact:</span>{" "}
                    {profile.officeContact}
                  </p>
                )}

                {profile.email && (
                  <p className="text-sm text-white">
                    <span className="font-semibold">Email:</span>{" "}
                    {profile.email}
                  </p>
                )}

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
        <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${
          hasPhoto && !hasSlideshow && galleryPhotos.length && hasDesc 
           ? (photoSettings.align === 'top' ? '' : 'md:grid-cols-3') 
           : 'md:grid-cols-3' // Default fallback grid structure
        }`}>

          {/* SLIDESHOW */}
          {hasSlideshow && (
             <div className="md:col-span-3 w-full">
              {isAdmin && (
                <div className="flex justify-end mb-2 relative">
                  <button
                    onClick={() => { setEditSlideSettings(photoSettings); setIsEditingSlideSize(v => !v); }}
                    title="Adjust slideshow size"
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 text-sm"
                  >
                    ⚙
                  </button>
                  {isEditingSlideSize && (
                    <div className="absolute top-10 right-0 z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-64 max-w-[90vw] space-y-3">
                      <p className="text-xs font-bold text-gray-500">Slideshow Size</p>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Height (px)</label>
                        <input
                          type="number"
                          min={100}
                          value={editSlideSettings.slideshowHeight}
                          onChange={e => setEditSlideSettings(prev => ({ ...prev, slideshowHeight: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm outline-none focus:ring-2 focus:ring-[#174873]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Max width (e.g. 100%, 600px)</label>
                        <input
                          type="text"
                          value={editSlideSettings.slideshowMaxWidth}
                          onChange={e => setEditSlideSettings(prev => ({ ...prev, slideshowMaxWidth: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm outline-none focus:ring-2 focus:ring-[#174873]/20"
                        />
                      </div>
                      <div className="flex gap-2 justify-end pt-1">
                        <button onClick={handleSaveSlideshowSettings} disabled={savingPhotoSettings}
                          className="px-3 py-1.5 bg-[#174873] text-white rounded-lg text-xs font-medium disabled:opacity-50">
                          {savingPhotoSettings ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => setIsEditingSlideSize(false)}
                          className="px-3 py-1.5 text-gray-500 text-xs">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
                <div className="w-full max-w-full overflow-hidden mx-auto">
                  <SlideshowBlock
                    photos={galleryPhotos}
                    isAdmin={isAdmin}
                    onDelete={handleDeletePhoto}
                    height={photoSettings.slideshowHeight}
                    maxWidth={photoSettings.slideshowMaxWidth || "100%"}
                  />
                </div>
            </div>
          )}

          {/*---photo grid options---*/}
          {hasPhoto && galleryPhotos.length > 0 && (
            <div className={`min-w-0 ${
              !hasDesc ? 'md:col-span-3' :
              photoSettings.align === 'left'  ? 'md:col-span-1 order-1' :
              photoSettings.align === 'right' ? 'md:col-span-1 order-2' :
              'md:col-span-3'
            }`}>
              {isAdmin && (
                <div className="flex justify-end mb-2 relative">
                  <button
                    onClick={() => { setEditPhotoSettings(photoSettings); setIsEditingPhotoSize(v => !v); }}
                    title="Adjust photo size"
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 text-sm"
                  >
                    ⚙
                  </button>
                  {isEditingPhotoSize && (
                    <div className="absolute top-10 right-0 z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-64 max-w-[90vw] space-y-3">
                      <p className="text-xs font-bold text-gray-500">Photo Grid Size</p>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Position relative to text</label>
                        <select
                          value={editPhotoSettings.align}
                          onChange={e => setEditPhotoSettings(prev => ({ ...prev, align: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm outline-none focus:ring-2 focus:ring-[#174873]/20 bg-white"
                        >
                          <option value="left">Beside text (left)</option>
                          <option value="right">Beside text (right)</option>
                          <option value="top">Above text (full width)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Photos per row (1–3)</label>
                        <input
                          type="number"
                          min={1}
                          max={3}
                          value={editPhotoSettings.cols}
                          onChange={e => setEditPhotoSettings(prev => ({ ...prev, cols: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm outline-none focus:ring-2 focus:ring-[#174873]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Photo width (px)</label>
                        <input
                          type="number"
                          min={50}
                          value={editPhotoSettings.width}
                          onChange={e => setEditPhotoSettings(prev => ({ ...prev, width: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm outline-none focus:ring-2 focus:ring-[#174873]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Photo height (px)</label>
                        <input
                          type="number"
                          min={50}
                          value={editPhotoSettings.height}
                          onChange={e => setEditPhotoSettings(prev => ({ ...prev, height: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm outline-none focus:ring-2 focus:ring-[#174873]/20"
                        />
                      </div>
                      <div className="flex gap-2 justify-end pt-1">
                        <button onClick={handleSavePhotoGridSettings} disabled={savingPhotoSettings}
                          className="px-3 py-1.5 bg-[#174873] text-white rounded-lg text-xs font-medium disabled:opacity-50">
                          {savingPhotoSettings ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => setIsEditingPhotoSize(false)}
                          className="px-3 py-1.5 text-gray-500 text-xs">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className={`grid gap-4 grid-cols-1 ${
                photoSettings.cols === 1 ? 'sm:grid-cols-1' :
                photoSettings.cols === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' :
                'sm:grid-cols-2'
              }`}>
                {galleryPhotos.map((photo) => (
                  <div key={photo.id} className="relative min-w-0 border border-blue-100 shadow-lg bg-[#eef6ff] p-3 rounded-2xl text-center">
                    <img
                      src={`${API}${photo.photo_url}`}
                      alt={photo.photo_name}
                      className="object-cover mx-auto rounded-lg"
                      style={{
                        width: '100%',
                        maxWidth: `${photoSettings.width}px`,
                        height: `${photoSettings.height}px`,
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
            <div className={`w-full ${
                hasSlideshow 
                  ? 'md:col-span-3' 
                  : hasPhoto && galleryPhotos.length && photoSettings.align === 'left'
                  ? 'md:col-span-2 order-2'
                  : hasPhoto && galleryPhotos.length && photoSettings.align === 'right'
                  ? 'md:col-span-2 order-1'
                  : 'md:col-span-3'
            }`}>

              {/*---description--*/}
              <div className="bg-[#fff8cd] rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-8 w-full min-h-[180px]">
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editDesc}
                      onChange={e => {
                        setEditDesc(e.target.value);
                        // Auto-grow: reset height then expand to scrollHeight
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onFocus={e => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      rows={8}
                      className="w-full p-5 border border-gray-200 rounded-xl text-sm resize-y outline-none focus:ring-2 focus:ring-[#174873]/20 overflow-hidden"
                      style={{ minHeight: '200px' }}
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
                        <p className="italic text-black text-center">
                          {isAdmin ? 'No content yet. Click Edit Description.' : 'Content coming soon.'}
                        </p>
                      );
                    }

                    const lines = raw.split('\n');
                    const elements = [];
                    let bulletBuffer = [];
                    let firstLine = true;
                    let noteBuffer = [];   // lines collected between '>' open and '<' close
                    let inNote = false;    // whether we're currently inside an open note block

                    // Which BODY_STYLES entry paragraphs/bullets should use right
                    // now. Starts at 'default' and switches to 'subheading' /
                    // 'subSubheading' the moment a '## ' / '### ' line is hit —
                    // then stays that way until the next heading changes it again.
                    let currentBodyLevel = 'default';
                     let tableBuffer = [];  // consecutive '| a | b | c |' lines collected into one table
                    
                    let accordionBuffer = [];   // lines collected between the opening '+++ Title' and the closing '+++'
                    let accordionTitle = '';
                    let inAccordion = false;
                    let accordionCount = 0;     // gives each rendered block a stable index for open/closed state
                    {/*--links---*/}
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
                            className="text-blue-600 hover:text-blue-800 break-all "
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

                    // Renders inline bold (**text**) + links together, usable anywhere
                    const renderInlineFormatting = (text) => {
                      const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);
                      return parts.map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return (
                            <strong key={i} className="font-bold">
                              {renderTextWithLinks(part.slice(2, -2))}
                            </strong>
                          );
                        }
                        return <span key={i}>{renderTextWithLinks(part)}</span>;
                      });
                    };
                    {/*bullets*/}
                    const flushBullets = () => {
                      if (bulletBuffer.length > 0) {
                        elements.push(
                          <ul key={`ul-${elements.length}`} className={`list-disc list-inside space-y-1.5 text-black marker:text-[#174873] marker:font-bold ${BODY_STYLES[currentBodyLevel]}`}>
                            {bulletBuffer.map((b, i) => (
                              <li key={i}>{renderInlineFormatting(b)}</li>
                            ))}
                          </ul>
                        );
                        bulletBuffer = [];
                      }
                    };
                    
                    {/*notes*/}
                    // Renders the whole accumulated note block as ONE callout box.
                    // Supports the same formatting as the main description:
                    // - '## ' / '### ' become headings (smaller, since they're
                    //   inside a callout — text-sm/text-xs instead of text-lg/base)
                    // - '- ' lines become real bullet points
                    // - '---' becomes a divider line
                    // - '**bold**' and links work on every line, including
                    //   inside headings and bullets
                    // Consecutive non-bullet lines stay as separate lines (breaks
                    // preserved); consecutive bullet lines group into one <ul>.
                    const flushNote = () => {
                      if (noteBuffer.length > 0) {
                        const noteElements = [];
                        let noteBulletBuffer = [];

                        const flushNoteBullets = () => {
                          if (noteBulletBuffer.length > 0) {
                            noteElements.push(
                              <ul key={`note-ul-${noteElements.length}`} className="list-disc list-inside space-y-1">
                                {noteBulletBuffer.map((b, i) => (
                                  <li key={i}>{renderInlineFormatting(b)}</li>
                                ))}
                              </ul>
                            );
                            noteBulletBuffer = [];
                          }
                        };

                        noteBuffer.forEach((lineText, i) => {
                          if (lineText.startsWith('### ')) {
                            flushNoteBullets();
                            noteElements.push(
                              <h4 key={`note-h4-${i}`} className={`${HEADING_STYLES.subSubheading} mt-2 not-italic`}>
                                {renderInlineFormatting(lineText.slice(4))}
                              </h4>
                            );
                          } else if (lineText.startsWith('## ')) {
                            flushNoteBullets();
                            noteElements.push(
                              <h3 key={`note-h3-${i}`} className={`${HEADING_STYLES.subheading} mt-2 not-italic`}>
                                {renderInlineFormatting(lineText.slice(3))}
                              </h3>
                            );
                          } else if (lineText === '---') {
                            flushNoteBullets();
                            noteElements.push(
                              <hr key={`note-hr-${i}`} className="border-[#174873]/20 my-1" />
                            );
                          } else if (lineText.startsWith('- ')) {
                            noteBulletBuffer.push(lineText.slice(2));
                          } else {
                            flushNoteBullets();
                            noteElements.push(
                              <div key={`note-line-${i}`}>{renderInlineFormatting(lineText)}</div>
                            );
                          }
                        });
                        flushNoteBullets();
                        {/*notes normal text*/}
                        elements.push(
                          <div key={`note-${elements.length}`} className="bg-[#FFFBEA] border-l-4 border-[#174873] pl-4 py-2 rounded-r-lg text-black italic text-md space-y-1">
                            {noteElements}
                          </div>
                        );
                      }
                      noteBuffer = [];
                      inNote = false;
                    };

                    //---accordion or collapsible headings
                    // Renders one '+++ Title ... +++' block as a self-contained
                    // click-to-expand widget. Unlike the note/table/bullet
                    // helpers above, this doesn't touch `elements` incrementally
                    // — it builds its own little content list, then pushes ONE
                    // finished accordion component.
                    const flushAccordion = () => {
                      const index = accordionCount++;
                      const contentElements = [];
                      let localBulletBuffer = [];
                      let localNoteBuffer = [];   // lines collected between '>' open and '<' close, inside this accordion
                      let inLocalNote = false;

                      const flushLocalBullets = () => {
                        if (localBulletBuffer.length > 0) {
                          contentElements.push(
                            <ul key={`acc-ul-${contentElements.length}`} className="list-disc list-inside space-y-1 text-black text-md marker:text-[#174873] marker:font-bold">
                              {localBulletBuffer.map((b, bi) => (
                                <li key={bi}>{renderInlineFormatting(b)}</li>
                              ))}
                            </ul>
                          );
                          localBulletBuffer = [];
                        }
                      };

                      
                      const flushLocalNote = () => {
                        if (localNoteBuffer.length > 0) {
                          const noteElements = [];
                          let localNoteBulletBuffer = [];

                          const flushLocalNoteBullets = () => {
                            if (localNoteBulletBuffer.length > 0) {
                              noteElements.push(
                                <ul key={`acc-note-ul-${noteElements.length}`} className="list-disc list-inside space-y-1">
                                  {localNoteBulletBuffer.map((b, i) => (
                                    <li key={i}>{renderInlineFormatting(b)}</li>
                                  ))}
                                </ul>
                              );
                              localNoteBulletBuffer = [];
                            }
                          };

                          localNoteBuffer.forEach((lineText, i) => {
                            if (lineText.startsWith('### ')) {
                              flushLocalNoteBullets();
                              noteElements.push(
                                <h4 key={`acc-note-h4-${i}`} className={`${HEADING_STYLES.subSubheading} mt-2 not-italic`}>
                                  {renderInlineFormatting(lineText.slice(4))}
                                </h4>
                              );
                            } else if (lineText.startsWith('## ')) {
                              flushLocalNoteBullets();
                              noteElements.push(
                                <h3 key={`acc-note-h3-${i}`} className={`${HEADING_STYLES.subheading} mt-2 not-italic`}>
                                  {renderInlineFormatting(lineText.slice(3))}
                                </h3>
                              );
                            } else if (lineText === '---') {
                              flushLocalNoteBullets();
                              noteElements.push(
                                <hr key={`acc-note-hr-${i}`} className="border-[#174873]/20 my-1" />
                              );
                            } else if (lineText.startsWith('- ')) {
                              localNoteBulletBuffer.push(lineText.slice(2));
                            } else {
                              flushLocalNoteBullets();
                              noteElements.push(
                                <div key={`acc-note-line-${i}`}>{renderInlineFormatting(lineText)}</div>
                              );
                            }
                          });
                          flushLocalNoteBullets();

                          contentElements.push(
                            <div key={`acc-note-${contentElements.length}`} className="bg-[#FFF4C2] border-l-4 border-[#D4A017] pl-4 py-2 rounded-r-lg text-black italic text-md space-y-1">
                              {noteElements}
                            </div>
                          );
                        }
                        localNoteBuffer = [];
                        inLocalNote = false;
                      };

                      accordionBuffer.forEach((lineText, li) => {
                        const t = lineText.trim();

                        // Currently inside an open note block within this
                        // accordion — swallow lines until the closing '<'.
                        if (inLocalNote) {
                          let lineContent = t.startsWith('> ') ? t.slice(2) : t;
                          if (lineContent.endsWith('<')) {
                            localNoteBuffer.push(lineContent.slice(0, -1).trim());
                            flushLocalNote();
                          } else {
                            localNoteBuffer.push(lineContent);
                          }
                          return;
                        }

                        if (t === '') {
                          flushLocalBullets();
                          contentElements.push(<div key={`acc-sp-${li}`} className="h-1" />);
                          return;
                        }

                        // '> ... <' opens/closes a note block, same syntax as
                        // the top-level description. Checked before the bullet
                        // check below for the same reason as the top level.
                        if (t.startsWith('> ') || t === '>') {
                          flushLocalBullets();
                          let content = t.startsWith('> ') ? t.slice(2) : '';
                          if (content.endsWith('<')) {
                            localNoteBuffer.push(content.slice(0, -1).trim());
                            flushLocalNote();
                          } else {
                            inLocalNote = true;
                            localNoteBuffer.push(content);
                          }
                          return;
                        }

                        if (t.startsWith('- ')) {
                          localBulletBuffer.push(t.slice(2));
                          return;
                        }
                        flushLocalBullets();

                        //normal text in accordian
                        contentElements.push(
                          <p key={`acc-line-${li}`} className="text-black text-md leading-relaxed">
                            {renderInlineFormatting(t)}
                          </p>
                        );
                      });
                      flushLocalBullets();
                      flushLocalNote(); // in case a note was left open at the end of this accordion's content
                      //accordian topmost view
                      const isOpen = !!openSections[index];
                      elements.push(
                        <div key={`accordion-${index}`} className="border border-gray-200 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setOpenSections(prev => ({ ...prev, [index]: !prev[index] }))}
                            className="w-full flex items-center justify-between gap-2 px-4 py-1.5 bg-white  text-left"
                          >
                            <span className={HEADING_STYLES.accordionTitle}>
                              {renderInlineFormatting(accordionTitle)}
                            </span>
                            <span className={`text-[#174873] text-sm transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}>
                              ▶
                            </span>
                          </button>
                          {isOpen && (
                            <div className="px-4 py-3 space-y-1 border-t-2 border-[#174873] bg-[#E6F0F5]/[60%]">
                              {contentElements}
                            </div>
                          )}
                        </div>
                      );

                      accordionBuffer = [];
                      accordionTitle = '';
                      inAccordion = false;
                    };

                    //flush table inside description
                    const flushTable = () => {
                      if (tableBuffer.length === 0) return;

                      const parseRow = (lineText) =>
                        lineText
                          .replace(/^\|/, '')
                          .replace(/\|$/, '')
                          .split('|')
                          .map(cell => cell.trim());

                      const isDividerRow = (cells) =>
                        cells.every(cell => /^:?-+:?$/.test(cell));

                      const rowsParsed = tableBuffer.map(parseRow).filter(cells => !isDividerRow(cells));

                      if (rowsParsed.length > 0) {
                        const [headerRow, ...rawBodyRows] = rowsParsed;
                        const colCount = headerRow.length;

                        // Normalize every body row to exactly colCount cells —
                        // pad short rows with empty cells, drop extra cells on
                        // long rows — so every <tr> lines up under the header
                        // regardless of how many '|' the admin typed on a line.
                        const bodyRows = rawBodyRows.map(cells => {
                          const normalized = cells.slice(0, colCount);
                          while (normalized.length < colCount) normalized.push('');
                          return normalized;
                        });

                        elements.push(
                          <div key={`table-${elements.length}`} className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full text-md text-left table-fixed">
                              <thead className="bg-white">
                                <tr >
                                  {headerRow.map((cell, ci) => (
                                    <th key={ci} className="px-4 py-3 text-black font-medium">
                                      {renderInlineFormatting(cell)}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {bodyRows.map((cells, ri) => (
                                  <tr key={ri} className="hover:bg-gray-50 divide-x divide-gray-200">
                                    {cells.map((cell, ci) => (
                                      <td key={ci} className="px-4 py-2.5 text-[#374151] text-sm">
                                        {renderInlineFormatting(cell)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      }
                      tableBuffer = [];
                    };
                    
                    //description normal
                    lines.forEach((line, idx) => {
                      const trimmed = line.trim();

                    //if note in description
                      if (inNote) {
                        let lineContent = trimmed.startsWith('> ') ? trimmed.slice(2) : trimmed;
                        if (lineContent.endsWith('<')) {
                          noteBuffer.push(lineContent.slice(0, -1).trim());
                          flushNote();
                        } else {
                          noteBuffer.push(lineContent);
                        }
                        return;
                      }

                      // Currently inside an open '+++ Title ... +++' accordion
                      // block — every line is swallowed until a line that is
                      // exactly '+++' on its own closes it.
                      if (inAccordion) {
                        if (trimmed === '+++') {
                          flushAccordion();
                        } else {
                          accordionBuffer.push(line);
                        }
                        return;
                      }

                      // blank line → spacer
                      if (trimmed === '') {
                        flushBullets();
                        flushTable();
                        elements.push(<div key={`sp-${idx}`} className="h-2" />);
                        return;
                      }

                      // very first non-blank line → big centered heading
                      if (firstLine) {
                        firstLine = false;
                        flushBullets();
                        flushTable();
                        elements.push(
                          <h2 key={idx} className={`${HEADING_STYLES.heading} text-center pb-3 border-b-2 border-[#174873]/20 tracking-tight`}>
                            {trimmed}
                          </h2>
                        );
                        return;
                      }

                      // ## Subheading
                      if (trimmed.startsWith('## ')) {
                        flushBullets();
                        flushTable();
                        currentBodyLevel = 'subheading'; // everything below this, until the next heading, uses BODY_STYLES.subheading
                        elements.push(
                          <h3 key={idx} className={`${HEADING_STYLES.subheading} mt-6`}>
                            {trimmed.slice(3)}
                          </h3>
                        );
                        return;
                      }

                      // ### Smaller subheading
                      if (trimmed.startsWith('### ')) {
                        flushBullets();
                        flushTable();
                        currentBodyLevel = 'subSubheading'; // everything below this, until the next heading, uses BODY_STYLES.subSubheading
                        elements.push(
                          <h4 key={idx} className={`${HEADING_STYLES.subSubheading} mt-4`}>
                            {trimmed.slice(4)}
                          </h4>
                        );
                        return;
                      }

                     //notes in description
                      if (trimmed.startsWith('> ') || trimmed === '>') {
                        flushBullets();
                        let content = trimmed.startsWith('> ') ? trimmed.slice(2) : '';
                        if (content.endsWith('<')) {
                          // opened and closed on the same line
                          noteBuffer.push(content.slice(0, -1).trim());
                          flushNote();
                        } else {
                          inNote = true;
                          noteBuffer.push(content);
                        }
                        return;
                      }

                      // +++ Title  → opens a collapsible accordion block.
                      // Everything after this line is hidden until a lone
                      // '+++' line closes it. Completely separate from the
                      // '## '/'### ' headings — those stay plain and always
                      // visible; only '+++' blocks are ever collapsible.
                      if (trimmed.startsWith('+++ ')) {
                        flushBullets();
                        flushTable();
                        accordionTitle = trimmed.slice(4);
                        accordionBuffer = [];
                        inAccordion = true;
                        return;
                      }

                      // - list
                      if (trimmed.startsWith('- ')) {
                        bulletBuffer.push(trimmed.slice(2));
                        return;
                      }

                      // | Table row |
                      if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 1) {
                        flushBullets();
                        flushTable();
                        tableBuffer.push(trimmed);
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

                      // Paragraph (bold **spans** and links are rendered inline
                      // via renderInlineFormatting regardless of this branch —
                      // so bold-containing and plain lines share one consistent
                      // size/color and never jump between the two). The size
                      // itself comes from BODY_STYLES[currentBodyLevel], so it
                      // stays fixed for every paragraph AND bullet under the
                      // same '## '/'### ' heading, and only changes when a new
                      // heading is hit above.
                      flushBullets();
                      elements.push(
                        <p key={idx} className={`text-[#1F2937] leading-relaxed text-justify ${BODY_STYLES[currentBodyLevel]}`}>
                          {renderInlineFormatting(trimmed)}
                        </p>
                      );
                    });

                    flushBullets();
                    flushTable();
                    flushNote();
                    if (inAccordion) flushAccordion();

                    return <div className="space-y-2">{elements}</div>;
                  })()
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PDF VIEWER ── */}
      {galleryPdfs.length > 0 && (
        <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#174873] px-4 sm:px-6 py-4">
            <h2 className="text-lg font-semibold text-white">📄 Documents</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {galleryPdfs.map(pdf => (
              <div key={pdf.id} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-2 group">
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
                    className="ml-2 sm:ml-4 shrink-0 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-sm font-medium"
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
        <div className="space-y-3">

          {/* Table heading / caption, sits above the table */}
          {(tableHeading || isAdmin) && (
            <div className="flex items-start justify-between gap-3">
              {isEditingHeading ? (
                <div className="flex-1 flex gap-2 items-center">
                  <input
                    value={editTableHeading}
                    onChange={e => setEditTableHeading(e.target.value)}
                    placeholder="Table heading, e.g. Faculty List"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-base font-semibold outline-none focus:ring-2 focus:ring-[#174873]/20"
                    autoFocus
                  />
                  <button onClick={handleSaveTableHeading} disabled={savingHeading}
                    className="px-3 py-2 bg-[#174873] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                    {savingHeading ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => { setEditTableHeading(tableHeading); setIsEditingHeading(false); }}
                    className="px-3 py-2 text-gray-500 text-sm">
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  {tableHeading ? (
                    <h3 className="text-3xl font-bold text-[#174873]">{tableHeading}</h3>
                  ) : (
                    <span className="italic text-gray-400 text-sm">No table heading yet.</span>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => { setEditTableHeading(tableHeading); setIsEditingHeading(true); }}
                      className="px-3 py-1.5 border-2 border-[#174873] text-[#174873] rounded-lg text-xs font-medium shrink-0"
                    >
                      {tableHeading ? 'Edit Heading' : '+ Add Heading'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-[#174873] text-white ">
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
                {displayRows.map(({ row, origIdx }) => {
                  const idx = origIdx; // keeps existing edit/delete logic below untouched
                  const isEditingThisRow = isAdmin && editingRowIdx === idx;
                  return (
                    <tr
                      key={idx}
                      className={`border-t border-gray-100 transition-colors
                        odd:bg-white even:bg-[#DFE3E6]
                        ${isEditingThisRow ? 'bg-[#FFF8CD]' : ''}
                      `}
                    >
                      {columns.map(col => (
                        <td key={col} className="px-8 py-3 text-black">
                          {isEditingThisRow ? (
                            /* ── EDIT MODE: show input for each cell ── */
                            col.toLowerCase().includes('pdf') || col.toLowerCase().includes('document') || col.toLowerCase().includes('syllabus') ? (
                              <div className="space-y-1">
                                {editingRowData[col] ? (
                                  <div className="flex items-center gap-1">
                                    <a href={editingRowData[col].startsWith('http') ? editingRowData[col] : `${API}${editingRowData[col]}`}
                                      target="_blank" rel="noopener noreferrer"
                                      className="text-sm text-[#174873] hover:underline truncate max-w-[80px]">
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
                                          const taggedFile = new File([file], `${TABLE_PDF_TAG}${file.name}`, { type: file.type });
                                          const form = new FormData();
                                          form.append('section', section || '');
                                          form.append('category', subsection || '');
                                          form.append('sub_category', '');
                                          form.append('files', taggedFile);
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
                                    className="inline-flex items-center gap-1 text-[#174873] hover:underline font-medium text-3sm">
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
                                className="text-green-600 hover:text-green-800 text-sm font-bold">
                                Save
                              </button>
                              <button onClick={handleCancelEditRow}
                                className="text-gray-400 hover:text-gray-600 text-xs">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 items-center">
                              <button onClick={() => handleMoveRow(idx, 'up')}
                                disabled={idx === 0}
                                title="Move row up"
                                className={`text-xs font-bold ${idx === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-[#174873] hover:text-[#406BC7]'}`}>
                                ▲
                              </button>
                              <button onClick={() => handleMoveRow(idx, 'down')}
                                disabled={idx === rows.length - 1}
                                title="Move row down"
                                className={`text-xs font-bold ${idx === rows.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-[#174873] hover:text-[#406BC7]'}`}>
                                ▼
                              </button>
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
                                      const taggedFile = new File([file], `${TABLE_PDF_TAG}${file.name}`, { type: file.type });
                                      const form = new FormData();
                                      form.append('section', section || '');
                                      form.append('category', subsection || '');
                                      form.append('sub_category', '');
                                      form.append('files', taggedFile);

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
      </div>
      )}
    </div>
  );
};

export default GenericContentPage;