import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SlideshowBlock from './SlideshowBlock';
import ProfileCardsBlock from './ProfileCardsBlock';
import { getToken, isAdmin as isAdminSession } from '../utils/auth';

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

// Profile photos are tagged via a filename prefix so they can be told apart
// from any other photos uploaded on the same page (e.g. via the old
// standalone "photo" block). This needs no backend changes since photo_name
// is just whatever filename the browser sends.
const PROFILE_PHOTO_TAG = '__profile_photo__';
const CARD_PHOTO_TAG = '__profile_card_';
// Same idea, but for PDFs uploaded into a table cell (e.g. a "syllabus PDF"
// column). They're stored in the same backend `pdfs` table as the standalone
// pdf-list block, so they need a tag to be told apart — otherwise they'd also
// show up in the generic "Documents" viewer below the description.
const TABLE_PDF_TAG = '__table_pdf__';

// ─── Shared heading / subheading styles ─────────────────────────────────────
const HEADING_STYLES = {
  heading:        'text-[#0f3358] font-cinzel font-bold tracking-wide pb-2 py-0.5 leading-normal',   // main page-level heading
  subheading:     'text-lg sm:text-xl md:text-2xl font-bold text-[#0f3358] font-cinzel leading-snug',       // '## ' — description body, description notes, accordion notes
  subSubheading:  'text-sm sm:text-base md:text-lg font-bold text-[#174873] font-sans-official leading-snug',    // '### ' — description body, description notes, accordion notes
  accordionTitle: 'text-sm sm:text-base md:text-lg font-bold text-[#0f3358]',    // accordion bar title ('+++ Title')
};

// ─── Body text size per description section ────────────────────────────────
const BODY_STYLES = {
  default:       'text-xs sm:text-sm md:text-base leading-relaxed',   // text before any '## '/'### ' has appeared yet
  subheading:    'text-xs sm:text-sm md:text-base leading-relaxed', // text under the most recent '## ' subheading
  subSubheading: 'text-xs sm:text-sm md:text-base leading-relaxed',   // text under the most recent '### ' sub-subheading
};

// ─── Caret position helper & non-jumping Textarea Resize ────────────────────
const CARET_MIRROR_PROPS = [
  'boxSizing', 'width', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderStyle',
  'fontStyle', 'fontVariant', 'fontWeight', 'fontSize', 'lineHeight', 'fontFamily',
  'textAlign', 'textTransform', 'textIndent', 'letterSpacing', 'wordSpacing', 'whiteSpace', 'wordWrap',
];

const getCaretCoordinates = (textareaEl) => {
  if (!textareaEl) return { top: 0, left: 0 };
  const computed = window.getComputedStyle(textareaEl);
  const div = document.createElement('div');

  div.style.position = 'absolute';
  div.style.top = '0px';
  div.style.left = '-9999px';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'pre-wrap';
  div.style.wordWrap = 'break-word';
  div.style.pointerEvents = 'none';

  CARET_MIRROR_PROPS.forEach((prop) => { div.style[prop] = computed[prop]; });
  div.style.width = computed.width;

  document.body.appendChild(div);

  const caretIndex = textareaEl.selectionStart ?? 0;
  div.textContent = textareaEl.value.substring(0, caretIndex);

  const marker = document.createElement('span');
  marker.textContent = textareaEl.value.substring(caretIndex) || '.';
  div.appendChild(marker);

  const coords = {
    top: marker.offsetTop,
    left: marker.offsetLeft,
  };
  document.body.removeChild(div);
  return coords;
};

// Safely adjusts textarea height without collapsing layout or causing window scroll jumps
const adjustTextareaHeight = (el) => {
  if (!el) return;
  const savedScrollY = window.scrollY;
  const savedScrollX = window.scrollX;

  el.style.height = 'auto';
  const targetHeight = Math.max(260, el.scrollHeight);
  el.style.height = `${targetHeight}px`;

  // Instantly restore window scroll position to prevent browser scroll jumps
  window.scrollTo({ top: savedScrollY, left: savedScrollX, behavior: 'instant' });
};

const DESC_TOOLBAR_BUTTONS = [
  {
    label: 'B',
    title: 'Bold',
    apply: (sel) => sel
      ? { text: `**${sel}**`, cursorOffset: `**${sel}**`.length }
      : { text: '****', cursorOffset: 2 },
  },
  {
    label: 'I',
    title: 'Italic',
    apply: (sel) => sel
      ? { text: `*${sel}*`, cursorOffset: `*${sel}*`.length }
      : { text: '**', cursorOffset: 1 },
  },
  {
    label: 'H2',
    title: 'Subheading',
    apply: (sel) => ({ text: `## ${sel || 'Subheading'}`, cursorOffset: `## ${sel || 'Subheading'}`.length }),
  },
  {
    label: 'H3',
    title: 'Sub-subheading',
    apply: (sel) => ({ text: `### ${sel || 'Sub-subheading'}`, cursorOffset: `### ${sel || 'Sub-subheading'}`.length }),
  },
  {
    label: '• List',
    title: 'Bullet point',
    apply: (sel) => ({ text: `- ${sel || 'List item'}`, cursorOffset: `- ${sel || 'List item'}`.length }),
  },
  {
    label: '― Divider',
    title: 'Horizontal divider',
    apply: () => ({ text: '---', cursorOffset: 3 }),
  },
  {
    label: '▸ Accordion',
    title: 'Collapsible accordion section',
    apply: (sel) => {
      const body = sel || 'Accordion content goes here.';
      const text = `+++ Section Title\n${body}\n+++`;
      return { text, cursorOffset: text.length };
    },
  },
  {
    label: '❝ Note',
    title: 'Highlighted note callout',
    apply: (sel) => {
      const body = sel || 'Note text';
      const text = `> ${body} <`;
      return { text, cursorOffset: text.length };
    },
  },
];

// Defined outside component so it never causes stale closure issues inside useCallback/useEffect
const blankProfile = {
  name: '', designation: '', university: '', address: '',
  phone: '', officeContact: '', email: ''
};

// ─── Shared link / inline-formatting helpers ────────────────────────────────
const splitLinks = (text) => {
  if (typeof text !== 'string') return [{ type: 'text', content: text }];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s]+)/g;
  const segments = [];
  let lastIndex = 0;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    const label = match[1] || match[3];
    const href = (match[2] || match[3]).replace(/[),.;:!?]+$/, '');
    segments.push({ type: 'link', label, href });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }
  return segments.length > 0 ? segments : [{ type: 'text', content: text }];
};

const renderLink = (seg, key) => {
  const isInternal = seg.href.startsWith('/');
  return (
    <a
      key={key}
      href={seg.href}
      target={isInternal ? "_self" : "_blank"}
      rel={isInternal ? "" : "noopener noreferrer"}
      className="text-blue-600 hover:text-blue-800 hover:underline break-all font-medium"
    >
      {seg.label}
    </a>
  );
};

const renderTextWithLinks = (text) =>
  splitLinks(text).map((seg, i) =>
    seg.type === 'link'
      ? renderLink(seg, `link-${i}`)
      : <React.Fragment key={`txt-${i}`}>{seg.content}</React.Fragment>
  );

const renderInlineFormatting = (text) => {
  if (!text || typeof text !== 'string') return text || '';
  return splitLinks(text).map((seg, i) => {
    if (seg.type === 'link') {
      return renderLink(seg, `fmt-link-${i}`);
    }
    const parts = seg.content.split(/(\*\*.*?\*\*|\*.*?\*|_.*?_)/g).filter(Boolean);
    return (
      <React.Fragment key={`fmt-txt-${i}`}>
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
            return (
              <strong key={j} className="font-bold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) && part.length >= 2) {
            return (
              <em key={j} className="italic">
                {part.slice(1, -1)}
              </em>
            );
          }
          return part;
        })}
      </React.Fragment>
    );
  });
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
  const isAdmin   = isAdminSession();
  const token     = getToken();
  const imageRef  = useRef(null);
  const pdfRef    = useRef(null);
  const profileImageRef = useRef(null);
  const profileCardsRef = useRef(null);
  const descTextareaRef = useRef(null);

  const [data,       setData]       = useState({});
  const [loading,    setLoading]    = useState(true);
  const [isEditing,  setIsEditing]  = useState(false);
  const [editDesc,   setEditDesc]   = useState('');
  const [saving,     setSaving]     = useState(false);

  // floating caret-menu state
  const [caretPos,      setCaretPos]      = useState({ top: 0, left: 0 });
  const [caretMenuMode, setCaretMenuMode] = useState(null); // null | 'menu' | 'link'
  const [linkLabel,     setLinkLabel]     = useState('');
  const [linkUrl,       setLinkUrl]       = useState('');

  const [openSections, setOpenSections] = useState({});
  const [openGridCards, setOpenGridCards] = useState({});

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
  const [editingRowIdx,  setEditingRowIdx]  = useState(null);
  const [editingRowData, setEditingRowData] = useState({});

  // column rename state
  const [editingColName,  setEditingColName]  = useState(null);
  const [editColNameValue, setEditColNameValue] = useState('');

  // profile state
  const [profile,          setProfile]          = useState(blankProfile);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfile,      setEditProfile]      = useState(blankProfile);
  const [savingProfile,    setSavingProfile]    = useState(false);

  const blankPhotoSettings = {
    cols: photoCols,
    height: photoHeight,
    width: photoWidth,
    align: photoAlign === 'center' ? 'top' : photoAlign,
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

  const allPhotos    = data.photos || [];
  const profilePhoto  = allPhotos.find(p => p.photo_name?.startsWith(PROFILE_PHOTO_TAG)) || null;
  const galleryPhotos = allPhotos.filter(p => !p.photo_name?.startsWith(PROFILE_PHOTO_TAG) && !p.photo_name?.startsWith(CARD_PHOTO_TAG));

  const allPdfs    = data.pdfs || [];
  const galleryPdfs = allPdfs.filter(p => !p.pdf_name?.startsWith(TABLE_PDF_TAG));

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

      let parsed = {};
      if (match.details) {
        try { parsed = JSON.parse(match.details); } catch { parsed = {}; }
      }

      setOpenSections({});
      setOpenGridCards({});

      if (hasTable) {
        setColumns(parsed.columns || tableColumns);
        setRows(parsed.rows || []);
        const heading = parsed.tableHeading || '';
        setTableHeading(heading);
        setEditTableHeading(heading);
      }

      if (hasProfile) {
        const merged = { ...blankProfile, ...(parsed.profile || {}) };
        setProfile(merged);
        setEditProfile(merged);
      }

      const mergedPhotoSettings = { ...blankPhotoSettings, ...(parsed.photoSettings || {}) };
      setPhotoSettings(mergedPhotoSettings);
      setEditPhotoSettings(mergedPhotoSettings);
      setEditSlideSettings(mergedPhotoSettings);
    } catch {
      setData({});
      if (hasTable)   { setColumns(tableColumns); setRows([]); setTableHeading(''); setEditTableHeading(''); }
      if (hasProfile) { setProfile(blankProfile); setEditProfile(blankProfile); }
      setOpenSections({});
      setOpenGridCards({});
      setPhotoSettings(blankPhotoSettings);
      setEditPhotoSettings(blankPhotoSettings);
      setEditSlideSettings(blankPhotoSettings);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, subsection]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/facility-content`,
        { section, category: subsection, sub_category: '', description: editDesc },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchData();
      setIsEditing(false);
      setCaretMenuMode(null);
    } catch { alert('Save failed'); }
    finally { setSaving(false); }
  };

  const updateCaretMenuPosition = useCallback(() => {
    const el = descTextareaRef.current;
    if (!el) return;
    const { top, left } = getCaretCoordinates(el);
    setCaretPos({
      top: top - el.scrollTop,
      left: left - el.scrollLeft,
    });
  }, []);

  // Applies a toolbar button's formatting without causing scroll jumps or layout shifts
  const applyDescFormat = useCallback((applyFn) => {
    const el = descTextareaRef.current;
    if (!el) return;

    const start = el.selectionStart ?? editDesc.length;
    const end = el.selectionEnd ?? editDesc.length;
    const selected = editDesc.slice(start, end);
    const { text, cursorOffset } = applyFn(selected);

    const nextValue = editDesc.slice(0, start) + text + editDesc.slice(end);
    const savedScrollY = window.scrollY;
    const savedScrollX = window.scrollX;

    setEditDesc(nextValue);

    requestAnimationFrame(() => {
      if (!descTextareaRef.current) return;
      const tEl = descTextareaRef.current;
      tEl.focus({ preventScroll: true });
      const pos = start + cursorOffset;
      try {
        tEl.setSelectionRange(pos, pos);
      } catch (_) {
        tEl.selectionStart = pos;
        tEl.selectionEnd = pos;
      }
      adjustTextareaHeight(tEl);
      updateCaretMenuPosition();
      window.scrollTo({ top: savedScrollY, left: savedScrollX, behavior: 'instant' });
    });
  }, [editDesc, updateCaretMenuPosition]);

  const openLinkForm = () => {
    const el = descTextareaRef.current;
    if (el) {
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      setLinkLabel(editDesc.slice(start, end));
    }
    setLinkUrl('');
    setCaretMenuMode('link');
  };

  const insertLink = () => {
    if (!linkUrl.trim()) return;
    applyDescFormat(() => {
      const label = linkLabel.trim() || linkUrl.trim();
      const text = `[${label}](${linkUrl.trim()})`;
      return { text, cursorOffset: text.length };
    });
    setLinkLabel('');
    setLinkUrl('');
    setCaretMenuMode(null);
  };

  const displayRows = rows.map((row, origIdx) => ({ row, origIdx }));

  const handleMoveRow = (idx, direction) => {
    if (editingRowIdx !== null) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= rows.length) return;
    const updated = [...rows];
    [updated[idx], updated[targetIdx]] = [updated[targetIdx], updated[idx]];
    setRows(updated);
    saveTable(columns, updated);
  };

  const saveTable = async (cols, tableRows) => {
    try {
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

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
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
    if (editingRowIdx !== null) {
      setEditingRowIdx(null);
      setEditingRowData({});
    }
    const updated = rows.filter((_, i) => i !== idx);
    setRows(updated);
    saveTable(columns, updated);
  };

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

  const handleStartEditColName = (col) => {
    setEditingColName(col);
    setEditColNameValue(col);
  };

  const handleCancelEditColName = () => {
    setEditingColName(null);
    setEditColNameValue('');
  };

  const handleSaveColName = () => {
    const trimmed = editColNameValue.trim();
    if (!trimmed || trimmed === editingColName) {
      handleCancelEditColName();
      return;
    }
    if (columns.includes(trimmed)) {
      alert('A column with that name already exists.');
      return;
    }
    const updatedCols = columns.map(c => (c === editingColName ? trimmed : c));
    const updatedRows = rows.map(r => {
      const nr = { ...r };
      if (editingColName in nr) {
        nr[trimmed] = nr[editingColName];
        delete nr[editingColName];
      }
      return nr;
    });
    setColumns(updatedCols);
    setRows(updatedRows);
    saveTable(updatedCols, updatedRows);
    handleCancelEditColName();
  };

  const handleMoveColumn = (col, direction) => {
    const idx = columns.indexOf(col);
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= columns.length) return;
    const updated = [...columns];
    [updated[idx], updated[targetIdx]] = [updated[targetIdx], updated[idx]];
    setColumns(updated);
    saveTable(updated, rows);
  };

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

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
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
    if (pdfRef.current) {
      pdfRef.current.value = '';
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#174873]" />
    </div>
  );

  const renderDescriptionContent = (raw) => {
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
    let noteBuffer = [];   
    let inNote = false;    

    let currentBodyLevel = 'default';
    let tableBuffer = [];  
    
    let accordionBuffer = [];   
    let accordionTitle = '';
    let inAccordion = false;
    let accordionCount = 0;     

    let gridBuffer = [];
    let inGrid = false;
    let gridTheme = 'default';
    let gridCount = 0;

    const GRID_THEMES = {
      default: {
        cardBorder: 'border-slate-200/90 hover:border-[#d4af37]',
        cardBg: 'bg-white hover:bg-[#FAF7F2]/80',
        headerHoverBg: 'group-hover:bg-[#FAF7F2]',
        headerText: 'text-[#0f3358] group-hover:text-[#7d311f]',
        badge: 'bg-[#d4af37] group-hover:bg-[#7d311f]',
        arrowBg: 'bg-slate-100 group-hover:bg-[#0f3358]',
        arrowText: 'text-slate-500 group-hover:text-white',
        dividerBorder: 'border-[#d4af37]/40',
        bodyBg: 'bg-white',
      },
      blue: {
        cardBorder: 'border-blue-100 hover:border-blue-400',
        cardBg: 'bg-white hover:bg-blue-50/60',
        headerHoverBg: 'group-hover:bg-blue-50/50',
        headerText: 'text-[#174873] group-hover:text-blue-900',
        badge: 'bg-blue-500 group-hover:bg-[#174873]',
        arrowBg: 'bg-blue-50 group-hover:bg-[#174873]',
        arrowText: 'text-blue-500 group-hover:text-white',
        dividerBorder: 'border-blue-200',
        bodyBg: 'bg-white',
      },
      green: {
        cardBorder: 'border-emerald-100 hover:border-emerald-500',
        cardBg: 'bg-white hover:bg-emerald-50/60',
        headerHoverBg: 'group-hover:bg-emerald-50/50',
        headerText: 'text-emerald-900 group-hover:text-emerald-950',
        badge: 'bg-emerald-500 group-hover:bg-emerald-700',
        arrowBg: 'bg-emerald-50 group-hover:bg-emerald-700',
        arrowText: 'text-emerald-600 group-hover:text-white',
        dividerBorder: 'border-emerald-200',
        bodyBg: 'bg-white',
      },
      slate: {
        cardBorder: 'border-slate-200 hover:border-slate-500',
        cardBg: 'bg-white hover:bg-slate-100/70',
        headerHoverBg: 'group-hover:bg-slate-100/50',
        headerText: 'text-slate-800 group-hover:text-black',
        badge: 'bg-slate-400 group-hover:bg-slate-700',
        arrowBg: 'bg-slate-100 group-hover:bg-slate-800',
        arrowText: 'text-slate-500 group-hover:text-white',
        dividerBorder: 'border-slate-200',
        bodyBg: 'bg-white',
      },
      crimson: {
        cardBorder: 'border-rose-100 hover:border-[#7d311f]',
        cardBg: 'bg-white hover:bg-rose-50/60',
        headerHoverBg: 'group-hover:bg-rose-50/40',
        headerText: 'text-[#7d311f] group-hover:text-rose-900',
        badge: 'bg-[#7d311f] group-hover:bg-rose-700',
        arrowBg: 'bg-rose-50 group-hover:bg-[#7d311f]',
        arrowText: 'text-[#7d311f] group-hover:text-white',
        dividerBorder: 'border-rose-200',
        bodyBg: 'bg-white',
      },
      purple: {
        cardBorder: 'border-purple-100 hover:border-purple-500',
        cardBg: 'bg-white hover:bg-purple-50/60',
        headerHoverBg: 'group-hover:bg-purple-50/40',
        headerText: 'text-purple-900 group-hover:text-purple-950',
        badge: 'bg-purple-500 group-hover:bg-purple-700',
        arrowBg: 'bg-purple-50 group-hover:bg-purple-700',
        arrowText: 'text-purple-600 group-hover:text-white',
        dividerBorder: 'border-purple-200',
        bodyBg: 'bg-white',
      },
      amber: {
        cardBorder: 'border-amber-100 hover:border-amber-500',
        cardBg: 'bg-white hover:bg-amber-50/60',
        headerHoverBg: 'group-hover:bg-amber-50/40',
        headerText: 'text-amber-900 group-hover:text-amber-950',
        badge: 'bg-amber-500 group-hover:bg-amber-700',
        arrowBg: 'bg-amber-50 group-hover:bg-amber-700',
        arrowText: 'text-amber-600 group-hover:text-white',
        dividerBorder: 'border-amber-200',
        bodyBg: 'bg-white',
      },
    };

    const flushBullets = () => {
      if (bulletBuffer.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className={`list-disc list-inside space-y-1.5 text-slate-900 marker:text-[#7d311f] marker:font-bold ${BODY_STYLES[currentBodyLevel]}`}>
            {bulletBuffer.map((b, i) => (
              <li key={i}>{renderInlineFormatting(b)}</li>
            ))}
          </ul>
        );
        bulletBuffer = [];
      }
    };

    const flushNote = () => {
      if (noteBuffer.length > 0) {
        const noteElements = [];
        let noteBulletBuffer = [];

        const flushNoteBullets = () => {
          if (noteBulletBuffer.length > 0) {
            noteElements.push(
              <ul key={`note-ul-${noteElements.length}`} className="list-disc list-inside space-y-1 text-xs sm:text-sm md:text-base leading-relaxed text-slate-800 marker:text-[#7d311f] marker:font-bold">
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
              <h4 key={`note-h4-${i}`} className="mt-2 not-italic flex items-center gap-2 text-[#0f3358] font-bold text-xs sm:text-sm md:text-base">
                <span className="w-1.5 h-1.5 bg-[#7d311f] rotate-45 shrink-0" />
                <span>{renderInlineFormatting(lineText.slice(4))}</span>
              </h4>
            );
          } else if (lineText.startsWith('## ')) {
            flushNoteBullets();
            noteElements.push(
              <h3 key={`note-h3-${i}`} className="mt-2.5 not-italic flex items-center gap-2 text-[#0f3358] font-cinzel font-bold text-sm sm:text-base md:text-lg">
                <span className="w-1.5 h-4 bg-[#7d311f] rounded-full shrink-0" />
                <span>{renderInlineFormatting(lineText.slice(3))}</span>
              </h3>
            );
          } else if (lineText === '---') {
            flushNoteBullets();
            noteElements.push(
              <hr key={`note-hr-${i}`} className="border-[#7d311f]/20 my-1" />
            );
          } else if (lineText.startsWith('- ')) {
            noteBulletBuffer.push(lineText.slice(2));
          } else {
            flushNoteBullets();
            noteElements.push(
              <div key={`note-line-${i}`} className="text-xs sm:text-sm md:text-base leading-relaxed text-slate-800">{renderInlineFormatting(lineText)}</div>
            );
          }
        });
        flushNoteBullets();
        elements.push(
          <div key={`note-${elements.length}`} className="bg-[#FAF7F2] border-l-4 border-[#7d311f] border-r border-t border-b border-[#7d311f]/20 p-3.5 sm:p-5 rounded-r-xl shadow-xs text-slate-800 space-y-1.5 my-3 text-xs sm:text-sm md:text-base leading-relaxed">
            {noteElements}
          </div>
        );
      }
      noteBuffer = [];
      inNote = false;
    };

    const flushGrid = () => {
      if (gridBuffer.length === 0) {
        inGrid = false;
        return;
      }

      const gridId = gridCount++;
      const themeKey = gridTheme.toLowerCase();
      const theme = GRID_THEMES[themeKey] || GRID_THEMES.default;
      const cards = [];
      let currentCard = null;

      gridBuffer.forEach((line) => {
        const t = line.trim();
        if (t.startsWith('=== ')) {
          if (currentCard) cards.push(currentCard);
          currentCard = { title: t.slice(4), lines: [] };
        } else if (currentCard) {
          currentCard.lines.push(line);
        }
      });
      if (currentCard) cards.push(currentCard);

      if (cards.length > 0) {
        const numCols = Math.min(cards.length, 3);
        const columns = Array.from({ length: numCols }, () => []);

        cards.forEach((card, cardIdx) => {
          const colIdx = cardIdx % numCols;
          columns[colIdx].push({ card, cardIdx });
        });

        const gridColClass =
          numCols === 1
            ? 'grid-cols-1'
            : numCols === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

        elements.push(
          <div key={`grid-${gridId}`} className={`grid items-start ${gridColClass} gap-6 my-6`}>
            {columns.map((colCards, colIdx) => (
              <div key={`grid-${gridId}-col-${colIdx}`} className="flex flex-col space-y-6">
                {colCards.map(({ card, cardIdx }) => {
                  const cardKey = `grid-${gridId}-card-${cardIdx}`;
                  const isExpanded = !!openGridCards[cardKey];

                  const cardContentElements = [];
                  let cardBullets = [];
                  let cardNoteBuffer = [];
                  let inCardNote = false;

                  const flushCardBullets = () => {
                    if (cardBullets.length > 0) {
                      cardContentElements.push(
                        <ul key={`card-ul-${cardContentElements.length}`} className="space-y-2 text-xs sm:text-sm md:text-base text-slate-700 my-2">
                          {cardBullets.map((b, bi) => (
                            <li key={bi} className="flex items-start gap-2.5">
                              <span className="text-[#7d311f] font-bold shrink-0 mt-0.5">✓</span>
                              <span className="leading-relaxed">{renderInlineFormatting(b)}</span>
                            </li>
                          ))}
                        </ul>
                      );
                      cardBullets = [];
                    }
                  };

                  const flushCardNote = () => {
                    if (cardNoteBuffer.length > 0) {
                      const noteElements = [];
                      let cardNoteBulletBuffer = [];

                      const flushCardNoteBullets = () => {
                        if (cardNoteBulletBuffer.length > 0) {
                          noteElements.push(
                            <ul key={`card-note-ul-${noteElements.length}`} className="list-disc list-inside space-y-1 text-xs sm:text-sm leading-relaxed text-slate-800 marker:text-[#7d311f] marker:font-bold">
                              {cardNoteBulletBuffer.map((b, i) => (
                                <li key={i}>{renderInlineFormatting(b)}</li>
                              ))}
                            </ul>
                          );
                          cardNoteBulletBuffer = [];
                        }
                      };

                      cardNoteBuffer.forEach((lineText, i) => {
                        if (lineText.startsWith('### ')) {
                          flushCardNoteBullets();
                          noteElements.push(
                            <h4 key={`card-note-h4-${i}`} className="mt-2 not-italic flex items-center gap-2 text-[#0f3358] font-bold text-xs sm:text-sm">
                              <span className="w-1.5 h-1.5 bg-[#7d311f] rotate-45 shrink-0" />
                              <span>{renderInlineFormatting(lineText.slice(4))}</span>
                            </h4>
                          );
                        } else if (lineText.startsWith('## ')) {
                          flushCardNoteBullets();
                          noteElements.push(
                            <h3 key={`card-note-h3-${i}`} className="mt-2.5 not-italic flex items-center gap-2 text-[#0f3358] font-cinzel font-bold text-sm sm:text-base">
                              <span className="w-1.5 h-4 bg-[#7d311f] rounded-full shrink-0" />
                              <span>{renderInlineFormatting(lineText.slice(3))}</span>
                            </h3>
                          );
                        } else if (lineText === '---') {
                          flushCardNoteBullets();
                          noteElements.push(<hr key={`card-note-hr-${i}`} className="border-[#7d311f]/20 my-1" />);
                        } else if (lineText.startsWith('- ')) {
                          cardNoteBulletBuffer.push(lineText.slice(2));
                        } else {
                          flushCardNoteBullets();
                          noteElements.push(
                            <div key={`card-note-line-${i}`} className="text-xs sm:text-sm leading-relaxed text-slate-800">{renderInlineFormatting(lineText)}</div>
                          );
                        }
                      });
                      flushCardNoteBullets();

                      cardContentElements.push(
                        <div key={`card-note-${cardContentElements.length}`} className="bg-[#FAF7F2] border-l-4 border-[#7d311f] border-r border-t border-b border-[#7d311f]/20 p-3 rounded-r-xl shadow-xs text-slate-800 space-y-1.5 my-2 text-xs sm:text-sm leading-relaxed">
                          {noteElements}
                        </div>
                      );
                    }
                    cardNoteBuffer = [];
                    inCardNote = false;
                  };

                  card.lines.forEach((lineText, li) => {
                    const trimmedLine = lineText.trim();

                    if (inCardNote) {
                      let lineContent = trimmedLine.startsWith('> ') ? trimmedLine.slice(2) : trimmedLine;
                      if (lineContent.endsWith('<')) {
                        cardNoteBuffer.push(lineContent.slice(0, -1).trim());
                        flushCardNote();
                      } else {
                        cardNoteBuffer.push(lineContent);
                      }
                      return;
                    }

                    if (trimmedLine === '') {
                      flushCardBullets();
                      cardContentElements.push(<div key={`card-sp-${li}`} className="h-1" />);
                      return;
                    }

                    if (trimmedLine.startsWith('> ') || trimmedLine === '>') {
                      flushCardBullets();
                      let content = trimmedLine.startsWith('> ') ? trimmedLine.slice(2) : '';
                      if (content.endsWith('<')) {
                        cardNoteBuffer.push(content.slice(0, -1).trim());
                        flushCardNote();
                      } else {
                        inCardNote = true;
                        cardNoteBuffer.push(content);
                      }
                      return;
                    }

                    if (trimmedLine.startsWith('- ')) {
                      cardBullets.push(trimmedLine.slice(2));
                      return;
                    }
                    flushCardBullets();
                    cardContentElements.push(
                      <p key={`card-p-${li}`} className="text-xs sm:text-sm md:text-base text-slate-800 leading-relaxed my-1">
                        {renderInlineFormatting(trimmedLine)}
                      </p>
                    );
                  });
                  flushCardBullets();
                  flushCardNote();

                  return (
                    <div
                      key={cardKey}
                      className={`group rounded-2xl border-2 transition-all duration-300 shadow-xs hover:shadow-xl hover:-translate-y-1 overflow-hidden ${theme.cardBorder} ${theme.cardBg}`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenGridCards(prev => ({ ...prev, [cardKey]: !prev[cardKey] }))}
                        className={`w-full flex items-center justify-between gap-4 px-6 py-5 text-left transition-colors cursor-pointer ${theme.headerHoverBg}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-3 h-3 rounded-full shrink-0 transition-colors ${theme.badge}`} />
                          <h3 className={`text-base sm:text-lg font-bold font-serif tracking-wide ${theme.headerText} transition-colors`}>
                            {renderInlineFormatting(card.title)}
                          </h3>
                        </div>
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shrink-0 ${theme.arrowBg} ${theme.arrowText} ${isExpanded ? 'rotate-90' : ''}`}>
                          ►
                        </span>
                      </button>

                      {isExpanded && (
                        <div className={`px-6 py-5 border-t border-dashed ${theme.dividerBorder} ${theme.bodyBg} text-slate-800 animate-in fade-in duration-200`}>
                          {cardContentElements.length > 0 ? cardContentElements : (
                            <p className="text-xs text-slate-500 italic">No details specified.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      }

      gridBuffer = [];
      inGrid = false;
      gridTheme = 'default';
    };

    const flushAccordion = () => {
      const index = accordionCount++;
      const contentElements = [];
      let localBulletBuffer = [];
      let localNoteBuffer = [];   
      let inLocalNote = false;

      const flushLocalBullets = () => {
        if (localBulletBuffer.length > 0) {
          contentElements.push(
            <ul key={`acc-ul-${contentElements.length}`} className="list-disc list-inside space-y-1.5 text-slate-900 text-xs sm:text-sm md:text-base marker:text-[#7d311f] marker:font-bold">
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
                <ul key={`acc-note-ul-${noteElements.length}`} className="list-disc list-inside space-y-1 text-xs sm:text-sm md:text-base leading-relaxed text-slate-800 marker:text-[#7d311f] marker:font-bold">
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
                <h4 key={`acc-note-h4-${i}`} className="mt-2 not-italic flex items-center gap-2 text-[#0f3358] font-bold text-xs sm:text-sm md:text-base">
                  <span className="w-1.5 h-1.5 bg-[#7d311f] rotate-45 shrink-0" />
                  <span>{renderInlineFormatting(lineText.slice(4))}</span>
                </h4>
              );
            } else if (lineText.startsWith('## ')) {
              flushLocalNoteBullets();
              noteElements.push(
                <h3 key={`acc-note-h3-${i}`} className="mt-2.5 not-italic flex items-center gap-2 text-[#0f3358] font-cinzel font-bold text-sm sm:text-base md:text-lg">
                  <span className="w-1.5 h-4 bg-[#7d311f] rounded-full shrink-0" />
                  <span>{renderInlineFormatting(lineText.slice(3))}</span>
                </h3>
              );
            } else if (lineText === '---') {
              flushLocalNoteBullets();
              noteElements.push(
                <hr key={`acc-note-hr-${i}`} className="border-[#7d311f]/20 my-1" />
              );
            } else if (lineText.startsWith('- ')) {
              localNoteBulletBuffer.push(lineText.slice(2));
            } else {
              flushLocalNoteBullets();
              noteElements.push(
                <div key={`acc-note-line-${i}`} className="text-xs sm:text-sm md:text-base leading-relaxed text-slate-800">{renderInlineFormatting(lineText)}</div>
              );
            }
          });
          flushLocalNoteBullets();

          contentElements.push(
            <div key={`acc-note-${contentElements.length}`} className="bg-[#FAF7F2] border-l-4 border-[#7d311f] border-r border-t border-b border-[#7d311f]/20 p-3.5 sm:p-5 rounded-r-xl shadow-xs text-slate-800 space-y-1.5 my-3 text-xs sm:text-sm md:text-base leading-relaxed">
              {noteElements}
            </div>
          );
        }
        localNoteBuffer = [];
        inLocalNote = false;
      };

      accordionBuffer.forEach((lineText, li) => {
        const t = lineText.trim();

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

        contentElements.push(
          <p key={`acc-line-${li}`} className="text-slate-800 text-xs sm:text-sm md:text-base leading-relaxed">
            {renderInlineFormatting(t)}
          </p>
        );
      });
      flushLocalBullets();
      flushLocalNote();
      const isOpen = !!openSections[index];
      elements.push(
        <div key={`accordion-${index}`} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs my-3">
          <button
            type="button"
            onClick={() => setOpenSections(prev => ({ ...prev, [index]: !prev[index] }))}
            className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-3.5 bg-[#FAF7F2] hover:bg-[#F3EDE3] text-left border-l-4 border-[#d4af37] transition-all cursor-pointer"
          >
            <span className="text-sm sm:text-base md:text-lg font-bold text-[#0f3358] font-cinzel tracking-wide">
              {renderInlineFormatting(accordionTitle)}
            </span>
            <span className={`text-[#7d311f] text-xs font-bold transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}>
              ►
            </span>
          </button>
          {isOpen && (
            <div className="px-4 sm:px-5 py-3.5 sm:py-4 space-y-2 border-t-2 border-[#174873] bg-[#E6F0F5]/80 shadow-inner">
              {contentElements}
            </div>
          )}
        </div>
      );

      accordionBuffer = [];
      accordionTitle = '';
      inAccordion = false;
    };

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

        const bodyRows = rawBodyRows.map(cells => {
          const normalized = cells.slice(0, colCount);
          while (normalized.length < colCount) normalized.push('');
          return normalized;
        });

        const colWidthPct = `${(100 / colCount).toFixed(2)}%`;

        elements.push(
          <div key={`table-${elements.length}`} className="w-full rounded-xl border-2 border-[#0f3358]/30 shadow-md my-3 bg-white overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed text-[10px] sm:text-xs md:text-sm">
              <thead>
                <tr className="bg-[#0f3358] text-white border-b-3 border-[#d4af37]">
                  {headerRow.map((cell, ci) => (
                    <th
                      key={ci}
                      style={{ width: colWidthPct }}
                      className="px-1 sm:px-3 py-1.5 sm:py-2.5 text-left font-cinzel font-bold text-[10px] sm:text-xs md:text-sm text-[#fce8b2] tracking-normal sm:tracking-wider uppercase border-r border-slate-300 last:border-r-0 break-words align-middle leading-tight"
                    >
                      {renderInlineFormatting(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bodyRows.map((cells, ri) => (
                  <tr key={ri} className="odd:bg-[#F8FAFC] even:bg-[#EEF2F6] hover:bg-[#E2E8F0] transition-colors">
                    {cells.map((cell, ci) => (
                      <td
                        key={ci}
                        style={{ width: colWidthPct }}
                        className="px-1 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm text-slate-800 font-medium border-r border-slate-300 last:border-r-0 break-words align-middle leading-tight"
                      >
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

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (inGrid) {
        if (trimmed === ':::') {
          flushGrid();
        } else {
          gridBuffer.push(line);
        }
        return;
      }

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

      if (inAccordion) {
        if (trimmed === '+++') {
          flushAccordion();
        } else {
          accordionBuffer.push(line);
        }
        return;
      }

      if (trimmed.startsWith(':::grid')) {
        flushBullets();
        flushTable();
        gridTheme = trimmed.slice(7).trim() || 'default';
        gridBuffer = [];
        inGrid = true;
        return;
      }

      if (trimmed === '') {
        flushBullets();
        flushTable();
        elements.push(<div key={`sp-${idx}`} className="h-2" />);
        return;
      }

      if (firstLine) {
        firstLine = false;
        flushBullets();
        flushTable();
        elements.push(
          <div key={idx} className="mb-4 sm:mb-6 text-center">
            <h2 className="font-cinzel text-2xl sm:text-2xl md:text-2xl lg:text-4xl font-bold text-[#0f3358] tracking-wide inline-block pb-2 border-b-2 border-[#7d311f] leading-normal py-0.5">
              {trimmed}
            </h2>
          </div>
        );
        return;
      }

      if (trimmed.startsWith('## ')) {
        flushBullets();
        flushTable();
        currentBodyLevel = 'subheading';
        elements.push(
          <div key={idx} className="mt-5 mb-2.5">
            <h3 className={`${HEADING_STYLES.subheading} flex items-center gap-2.5 text-[#0f3358] font-cinzel font-bold text-lg sm:text-xl md:text-2xl tracking-wide leading-snug py-0.5`}>
              <span className="w-1.5 h-5 sm:h-6 bg-[#7d311f] rounded-full shrink-0" />
              <span>{trimmed.slice(3)}</span>
            </h3>
          </div>
        );
        return;
      }

      if (trimmed.startsWith('### ')) {
        flushBullets();
        flushTable();
        currentBodyLevel = 'subSubheading';
        elements.push(
          <h4 key={idx} className={`${HEADING_STYLES.subSubheading} mt-3.5 mb-1.5 text-[#0f3358] font-cinzel font-bold text-sm sm:text-base md:text-lg flex items-center gap-2.5 leading-snug py-0.5`}>
            <span className="w-2 h-2 bg-[#7d311f] rotate-45 shrink-0" />
            <span>{trimmed.slice(4)}</span>
          </h4>
        );
        return;
      }

      if (trimmed.startsWith('> ') || trimmed === '>') {
        flushBullets();
        let content = trimmed.startsWith('> ') ? trimmed.slice(2) : '';
        if (content.endsWith('<')) {
          noteBuffer.push(content.slice(0, -1).trim());
          flushNote();
        } else {
          inNote = true;
          noteBuffer.push(content);
        }
        return;
      }

      if (trimmed.startsWith('+++ ')) {
        flushBullets();
        flushTable();
        accordionTitle = trimmed.slice(4);
        accordionBuffer = [];
        inAccordion = true;
        return;
      }

      if (trimmed.startsWith('- ')) {
        bulletBuffer.push(trimmed.slice(2));
        return;
      }

      if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 1) {
        flushBullets();
        tableBuffer.push(trimmed);
        return;
      }

      if (trimmed === '---') {
        flushBullets();
        elements.push(
          <hr key={idx} className="border-gray-200 my-2" />
        );
        return;
      }

      flushBullets();
      elements.push(
        <p key={idx} className={`text-[#1F2937] leading-relaxed text-justify mb-3 ${BODY_STYLES[currentBodyLevel]}`}>
          {renderInlineFormatting(trimmed)}
        </p>
      );
    });

    flushBullets();
    flushTable();
    flushNote();
    if (inGrid) flushGrid();
    if (inAccordion) flushAccordion();

    return <div className="space-y-2">{elements}</div>;
  };

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-8">
      {/* ── BHU OFFICIAL PORTAL PAGE HEADING ── */}
      <div className="border-b-2 border-[#d4af37] pb-2.5 sm:pb-4 flex items-end">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-1.5 sm:w-2 h-5 sm:h-8 md:h-9 bg-[#7d311f] rounded-full shrink-0" />
          <h1 className="text-[#0f3358] font-cinzel font-bold text-lg sm:text-2xl md:text-3xl lg:text-4xl tracking-tight leading-normal sm:leading-tight py-0.5 truncate sm:whitespace-normal">
            {title}
          </h1>
        </div>
      </div>

      {/* ── OFFICIAL EXECUTIVE PROFILE CARD ── */}
      {hasProfile && (
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#0f3358] p-4 sm:p-8 md:p-10 shadow-2xl border-2 border-[#d4af37]">
          {isAdmin && !isEditingProfile && (
            <button
              onClick={() => { setEditProfile(profile); setIsEditingProfile(true); }}
              className="absolute top-4 right-4 z-20 px-4 py-2 bg-[#d4af37] text-[#0f3358] hover:bg-[#e5c158] rounded-xl text-xs font-bold shadow-md transition-all border border-amber-300 flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit Profile
            </button>
          )}

          {isEditingProfile ? (
            <div className="text-left max-w-2xl mx-auto space-y-4 bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-2xl text-slate-800 shadow-2xl relative z-10 border border-amber-300">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-xl font-bold text-[#0f3358] font-cinzel">Edit Profile</h3>
                <span className="text-xs bg-amber-100 text-amber-900 font-semibold px-2.5 py-1 rounded-md">Admin Portal Mode</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                {profilePhoto ? (
                  <img
                    src={`${API}${profilePhoto.photo_url}`}
                    alt={profilePhoto.photo_name}
                    className="rounded-xl object-cover border-2 border-[#d4af37] w-36 h-44 shadow-md"
                    style={{ objectPosition: 'top center' }}
                  />
                ) : (
                  <div className="w-36 h-44 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 text-xs bg-white p-2 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mb-1 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    No Photo Uploaded
                  </div>
                )}
                <div className="space-y-2 text-center sm:text-left">
                  <p className="text-xs font-semibold text-slate-600">Profile Photo</p>
                  <p className="text-[11px] text-slate-500">Recommended high-resolution portrait format.</p>
                  <input type="file" accept="image/*" ref={profileImageRef} className="hidden" onChange={handleProfilePhotoUpload} />
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                    <button
                      onClick={() => profileImageRef.current?.click()}
                      className="px-3.5 py-1.5 bg-[#0f3358] text-white rounded-lg text-xs font-semibold hover:bg-[#174873] transition-colors"
                    >
                      {profilePhoto ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {profilePhoto && (
                      <button
                        onClick={handleRemoveProfilePhoto}
                        className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'name',          label: 'Full Name' },
                  { key: 'designation',   label: 'Official Designation' },
                  { key: 'university',    label: 'Department / Institution' },
                  { key: 'address',       label: 'Office Location / Address' },
                  { key: 'phone',         label: 'Contact Number' },
                  { key: 'officeContact', label: 'Office Phone / Extension' },
                  { key: 'email',         label: 'Official Email Address' },
                ].map(field => (
                  <div key={field.key} className={field.key === 'address' || field.key === 'university' ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      {field.label}
                    </label>
                    <input
                      value={editProfile[field.key] || ''}
                      onChange={e => setEditProfile({ ...editProfile, [field.key]: e.target.value })}
                      placeholder={field.label}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0f3358] focus:border-transparent bg-white shadow-xs"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t">
                <button onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 text-xs">
                  Cancel
                </button>
                <button onClick={handleSaveProfile} disabled={savingProfile}
                  className="px-5 py-2 bg-[#0f3358] text-white rounded-lg text-xs font-bold hover:bg-[#174873] disabled:opacity-50 shadow-md">
                  {savingProfile ? 'Saving Profile...' : 'Save Profile Changes'}
                </button>
              </div>
            </div>
          ) : profile.name ? (
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
              {profilePhoto ? (
                <div className="relative flex-shrink-0">
                  <div className="p-1 rounded-2xl border border-[#d4af37]/50 bg-[#081a2f] shadow-md">
                    <img
                      src={`${API}${profilePhoto.photo_url}`}
                      alt={profilePhoto.photo_name}
                      className="rounded-xl object-cover w-44 h-56 sm:w-52 sm:h-64"
                      style={{ objectPosition: 'top center' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="relative flex-shrink-0">
                  <div className="p-1 rounded-2xl border border-[#d4af37]/50 bg-[#081a2f] shadow-md">
                    <div className="w-44 h-56 sm:w-52 sm:h-64 rounded-xl bg-[#081a2f] flex flex-col items-center justify-center text-slate-400 p-4 text-center border border-white/10">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-2 text-[#d4af37]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-xs font-semibold text-slate-300">Administrative Office</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-1 text-center md:text-left space-y-4 w-full">
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white font-cinzel tracking-wide leading-tight">
                    {profile.name}
                  </h2>
                  {profile.designation && (
                    <p className="text-base sm:text-lg md:text-xl font-semibold text-[#fce8b2] mt-1 font-sans">
                      {profile.designation}
                    </p>
                  )}
                  {profile.university && (
                    <p className="text-sm sm:text-base text-slate-300 mt-1 font-medium">
                      {profile.university}
                    </p>
                  )}
                  {profile.address && (
                    <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center justify-center md:justify-start gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      {profile.address}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-center md:items-start gap-2.5 pt-2 w-full">
                  {profile.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      className="inline-flex items-center gap-3 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all text-left group w-fit max-w-full"
                    >
                      <div className="p-1.5 rounded-lg bg-[#d4af37]/20 text-[#d4af37] group-hover:bg-[#d4af37] group-hover:text-[#0f3358] transition-colors shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                      </div>
                      <div className="min-w-0 pr-1">
                        <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider mr-2">Phone No.:</span>
                        <span className="text-xs sm:text-sm font-semibold text-white">{profile.phone}</span>
                      </div>
                    </a>
                  )}

                  {profile.officeContact && (
                    <div className="inline-flex items-center gap-3 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-left w-fit max-w-full">
                      <div className="p-1.5 rounded-lg bg-[#d4af37]/20 text-[#d4af37] shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                      </div>
                      <div className="min-w-0 pr-1">
                        <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider mr-2">Office Extension:</span>
                        <span className="text-xs sm:text-sm font-semibold text-white">{profile.officeContact}</span>
                      </div>
                    </div>
                  )}

                  {profile.email && (
                    <a
                      href={`mailto:${profile.email}`}
                      className="inline-flex items-center gap-3 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all text-left group w-fit max-w-full"
                    >
                      <div className="p-1.5 rounded-lg bg-[#d4af37]/20 text-[#d4af37] group-hover:bg-[#d4af37] group-hover:text-[#0f3358] transition-colors shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      </div>
                      <div className="min-w-0 pr-1">
                        <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider mr-2">Official Email:</span>
                        <span className="text-xs sm:text-sm font-semibold text-white break-all">{profile.email}</span>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-300 italic">
              {isAdmin ? 'No profile details saved. Click Edit Profile above to configure.' : 'Official leadership profile coming soon.'}
            </div>
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
          <button onClick={() => profileCardsRef.current?.openAddForm()}
            className="px-4 py-2 border-2 border-[#174873] text-[#174873] rounded-lg text-sm font-medium">
            Add Profile Card
          </button>
        </div>
      )}

      {/* ── SLIDESHOW ── */}
      {hasSlideshow && (
        <div className="w-full">
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

      {/* ── STAFF / WARDEN PROFILE CARDS ── */}
      <ProfileCardsBlock
        ref={profileCardsRef}
        section={section}
        subsection={subsection}
        content={data}
        isAdmin={isAdmin}
        token={token}
        onChanged={(fresh) => setData(fresh)}
      />

      {/* ── PHOTO + DESCRIPTION LAYOUT ── */}
      {(hasPhoto || hasDesc) && (
        <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${
          hasPhoto && galleryPhotos.length && hasDesc 
           ? (photoSettings.align === 'top' ? '' : 'md:grid-cols-3') 
           : 'md:grid-cols-3'
        }`}>

          {/* Photo Grid Options */}
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
                  <div key={photo.id} className="relative min-w-0 border border-slate-200 shadow-md bg-slate-50 p-3 rounded-2xl text-center">
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

              {/* Description Container */}
              <div className="bg-white rounded-2xl border-2 border-[#7d311f]/30 shadow-md p-6 sm:p-10 w-full min-h-[180px]">
                {isEditing ? (
                  <div className="space-y-3">
                    {/* Formatting toolbar */}
                    <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                      {DESC_TOOLBAR_BUTTONS.map((btn) => (
                        <button
                          key={btn.label}
                          type="button"
                          title={btn.title}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => { e.preventDefault(); applyDescFormat(btn.apply); }}
                          className="px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-[#174873] bg-white border border-gray-200 rounded-lg hover:bg-[#174873] hover:text-white transition-colors"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>

                    {/* Textarea with floating format icon above the cursor */}
                    <div className="relative">
                      <textarea
                        ref={descTextareaRef}
                        value={editDesc}
                        onChange={e => {
                          setEditDesc(e.target.value);
                          adjustTextareaHeight(e.target);
                          updateCaretMenuPosition();
                        }}
                        onFocus={e => {
                          adjustTextareaHeight(e.target);
                          updateCaretMenuPosition();
                        }}
                        onClick={updateCaretMenuPosition}
                        onKeyUp={updateCaretMenuPosition}
                        onSelect={updateCaretMenuPosition}
                        onScroll={updateCaretMenuPosition}
                        rows={8}
                        className="w-full p-5 border border-gray-200 rounded-xl text-sm resize-y outline-none focus:ring-2 focus:ring-[#174873]/20 overflow-hidden"
                        style={{ minHeight: '260px' }}
                        placeholder="Enter description, contact info, about this section..."
                      />

                      {/* Floating format icon — sits directly above the cursor. */}
                      <div
                        className="absolute z-20"
                        style={{ top: Math.max(caretPos.top - 34, 0), left: Math.max(caretPos.left - 12, 0) }}
                      >
                        <button
                          type="button"
                          title="Insert formatting"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => { e.preventDefault(); setCaretMenuMode(caretMenuMode ? null : 'menu'); }}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-[#174873] text-white shadow-md hover:bg-[#0f3358] transition-colors cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>

                        {caretMenuMode === 'menu' && (
                          <div className="absolute bottom-full mb-2 left-0 z-30 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5">
                            {DESC_TOOLBAR_BUTTONS.map((btn) => (
                              <button
                                key={btn.label}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => { e.preventDefault(); applyDescFormat(btn.apply); setCaretMenuMode(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm text-slate-700 hover:bg-gray-50 text-left cursor-pointer"
                              >
                                <span className="w-5 text-[#174873] font-bold text-center">{btn.label}</span>
                                <span className="text-slate-500">{btn.title}</span>
                              </button>
                            ))}
                            <div className="my-1 border-t border-gray-100" />
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={(e) => { e.preventDefault(); openLinkForm(); }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm text-slate-700 hover:bg-gray-50 text-left cursor-pointer"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#174873]">
                                <path d="M9 17H7A5 5 0 0 1 7 7h2" />
                                <path d="M15 7h2a5 5 0 0 1 0 10h-2" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                              </svg>
                              <span>Insert link</span>
                            </button>
                          </div>
                        )}

                        {caretMenuMode === 'link' && (
                          <div className="absolute bottom-full mb-2 left-0 z-30 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-3 space-y-2">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Insert Link</p>
                            <input
                              value={linkLabel}
                              onChange={e => setLinkLabel(e.target.value)}
                              placeholder="Text to display"
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#174873]/20"
                            />
                            <input
                              value={linkUrl}
                              onChange={e => setLinkUrl(e.target.value)}
                              placeholder="https://example.com"
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#174873]/20"
                            />
                            <div className="flex gap-2 justify-end pt-1">
                              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={(e) => { e.preventDefault(); setCaretMenuMode(null); }}
                                className="px-3 py-1 text-xs text-gray-500">
                                Cancel
                              </button>
                              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={(e) => { e.preventDefault(); insertLink(); }} disabled={!linkUrl.trim()}
                                className="px-3 py-1 text-xs font-medium bg-[#174873] text-white rounded-lg disabled:opacity-50">
                                Insert
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleSave} disabled={saving}
                        className="px-4 py-2 bg-[#174873] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setIsEditing(false); setCaretMenuMode(null); }}
                        className="px-4 py-2 text-gray-500 text-sm">
                          Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  renderDescriptionContent(data.description || '')
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
            <h2 className="text-lg font-semibold text-white">📄 Downloads</h2>
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

      {/* ── TABLE AT THE BOTTOM OF THE BOARD ── */}
      {hasTable && (
        <div className="space-y-3">
          {(tableHeading || isAdmin) && (
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
              {isEditingHeading ? (
                <div className="flex-1 flex flex-col sm:flex-row gap-2 sm:items-center">
                  <input
                    value={editTableHeading}
                    onChange={e => setEditTableHeading(e.target.value)}
                    placeholder="Table heading, e.g. Faculty List"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-base font-semibold outline-none focus:ring-2 focus:ring-[#174873]/20"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveTableHeading} disabled={savingHeading}
                      className="px-3 py-2 bg-[#174873] text-white rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50">
                      {savingHeading ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => { setEditTableHeading(tableHeading); setIsEditingHeading(false); }}
                      className="px-3 py-2 text-gray-500 text-xs sm:text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {tableHeading ? (
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#174873]">{tableHeading}</h3>
                  ) : (
                    <span className="italic text-gray-400 text-xs sm:text-sm">No table heading yet.</span>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => { setEditTableHeading(tableHeading); setIsEditingHeading(true); }}
                      className="px-3 py-1.5 border-2 border-[#174873] text-[#174873] rounded-lg text-xs font-medium shrink-0 self-start"
                    >
                      {tableHeading ? 'Edit Heading' : '+ Add Heading'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {(() => {
            const isPdfCol = (col) =>
              col.toLowerCase().includes('pdf') ||
              col.toLowerCase().includes('document') ||
              col.toLowerCase().includes('syllabus');

            const uploadPdf = async (onSet) => {
              return async (e) => {
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
                  if (pdfUrl) onSet(pdfUrl);
                  else alert('Upload succeeded but URL not returned: ' + JSON.stringify(res.data));
                } catch (err) {
                  alert('Upload failed: ' + JSON.stringify(err.response?.data));
                }
              };
            };

            const renderPdfEditor = (value, onChange) => (
              <div className="space-y-1 min-w-[120px]">
                {value ? (
                  <div className="flex items-center gap-1">
                    <a href={value.startsWith('http') ? value : `${API}${value}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-[#174873] hover:underline truncate max-w-[100px]">
                      Current PDF
                    </a>
                    <button onClick={() => onChange('')}
                      className="text-red-400 text-xs hover:text-red-600 min-w-[24px] min-h-[24px]">✕</button>
                  </div>
                ) : (
                  <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 bg-[#174873] text-white rounded text-[10px] sm:text-xs whitespace-nowrap min-h-[28px]">
                    <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                    </svg>
                    Upload PDF
                    <input type="file" accept=".pdf" className="hidden" onChange={uploadPdf(onChange)} />
                  </label>
                )}
                <input
                  value={value || ''}
                  onChange={e => onChange(e.target.value)}
                  placeholder="or paste URL"
                  className="w-full px-1.5 py-1 border border-blue-300 rounded text-[10px] sm:text-xs outline-none focus:ring-1 focus:ring-[#174873]"
                />
              </div>
            );

            const renderViewValue = (val) =>
              val
                ? val.startsWith('/uploads/') || val.startsWith('http')
                  ? (
                    <a href={val.startsWith('http') ? val : `${API}${val}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#174873] hover:underline font-medium text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                      </svg>
                      View PDF
                    </a>
                  )
                  : renderInlineFormatting(val)
                : '—';

            const IconBtn = ({ onClick, disabled, title, colorClass, children }) => (
              <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                title={title}
                className={`inline-flex items-center justify-center min-w-[32px] min-h-[32px] rounded-lg text-xs font-bold
                  ${disabled ? 'text-gray-300 cursor-not-allowed' : `${colorClass} hover:bg-black/5 active:bg-black/10`}`}
              >
                {children}
              </button>
            );

            const rowActions = (idx, isEditingThisRow) =>
              isEditingThisRow ? (
                <div className="flex gap-1">
                  <IconBtn onClick={handleSaveEditRow} title="Save" colorClass="text-green-600">✓</IconBtn>
                  <IconBtn onClick={handleCancelEditRow} title="Cancel" colorClass="text-gray-400">✕</IconBtn>
                </div>
              ) : (
                <div className="flex gap-0.5">
                  <IconBtn onClick={() => handleMoveRow(idx, 'up')} disabled={idx === 0} title="Move up" colorClass="text-[#174873]">▲</IconBtn>
                  <IconBtn onClick={() => handleMoveRow(idx, 'down')} disabled={idx === rows.length - 1} title="Move down" colorClass="text-[#174873]">▼</IconBtn>
                  <IconBtn onClick={() => handleStartEditRow(idx)} title="Edit" colorClass="text-[#174873]">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                  </IconBtn>
                  <IconBtn onClick={() => handleDeleteRow(idx)} title="Delete" colorClass="text-red-500">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z"/>
                    </svg>
                  </IconBtn>
                </div>
              );

            return (
              <div className="rounded-xl border-2 border-[#0f3358]/30 shadow-md overflow-hidden my-3 bg-white w-full">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse table-fixed text-[10px] sm:text-xs md:text-sm">
                    <thead>
                      <tr className="bg-[#0f3358] text-white border-b-3 border-[#d4af37]">
                        {columns.map((col, colIdx) => (
                          <th
                            key={col}
                            className="px-1 sm:px-3 py-1.5 sm:py-2.5 text-left font-cinzel font-bold text-[10px] sm:text-xs md:text-sm text-[#fce8b2] tracking-normal sm:tracking-wider uppercase border-r border-slate-300 last:border-r-0 break-words align-middle leading-tight"
                          >
                            {isAdmin && editingColName === col ? (
                              <div className="flex items-center gap-1 normal-case font-sans font-normal">
                                <input
                                  value={editColNameValue}
                                  onChange={e => setEditColNameValue(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleSaveColName();
                                    if (e.key === 'Escape') handleCancelEditColName();
                                  }}
                                  autoFocus
                                  className="px-1.5 py-0.5 text-black rounded text-[10px] sm:text-xs w-16 sm:w-24"
                                />
                                <button onClick={handleSaveColName} title="Save"
                                  className="text-green-300 hover:text-white text-xs font-bold">✓</button>
                                <button onClick={handleCancelEditColName} title="Cancel"
                                  className="text-gray-300 hover:text-white text-xs">✕</button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="truncate">{col}</span>
                                {isAdmin && (
                                <span className="flex items-center gap-0.5 ml-1 shrink-0">
                                  <button
                                    onClick={() => handleMoveColumn(col, 'left')}
                                    disabled={colIdx === 0}
                                    title="Shift column left"
                                    className={`text-[10px] sm:text-xs ${colIdx === 0 ? 'text-slate-500 cursor-not-allowed' : 'text-blue-200 hover:text-white'}`}
                                  >◄</button>
                                  <button
                                    onClick={() => handleMoveColumn(col, 'right')}
                                    disabled={colIdx === columns.length - 1}
                                    title="Shift column right"
                                    className={`text-[10px] sm:text-xs ${colIdx === columns.length - 1 ? 'text-slate-500 cursor-not-allowed' : 'text-blue-200 hover:text-white'}`}
                                  >►</button>
                                  <button
                                    onClick={() => handleStartEditColName(col)}
                                    title="Rename column"
                                    className="text-blue-200 hover:text-white text-[10px] sm:text-xs"
                                  >✎</button>
                                  <button
                                    onClick={() => handleDeleteColumn(col)}
                                    title="Delete column"
                                    className="text-red-300 hover:text-white text-xs"
                                  >×</button>
                                </span>
                                )}
                              </div>
                            )}
                          </th>
                        ))}
                        {isAdmin && (
                          <th className="px-1.5 sm:px-3 py-1.5 sm:py-2.5 bg-[#0f3358] text-[#fce8b2] font-bold text-[10px] sm:text-xs">
                            {addingCol ? (
                              <div className="flex gap-1">
                                <input value={newColName} onChange={e => setNewColName(e.target.value)}
                                  placeholder="Column name"
                                  className="px-1.5 py-0.5 text-black rounded text-[10px] sm:text-xs w-16 sm:w-24" />
                                <button onClick={handleAddColumn} className="text-green-300 text-xs font-bold">✓</button>
                                <button onClick={() => setAddingCol(false)} className="text-gray-300 text-xs">✕</button>
                              </div>
                            ) : (
                              <button onClick={() => setAddingCol(true)}
                                className="text-blue-200 hover:text-white text-[10px] sm:text-xs font-bold whitespace-nowrap">
                                + Col
                              </button>
                            )}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {rows.length === 0 && (
                        <tr>
                          <td colSpan={columns.length + (isAdmin ? 1 : 0)}
                            className="px-4 py-6 text-center text-gray-400 italic text-xs sm:text-sm">
                            {isAdmin ? 'No rows yet. Add columns first, then add rows.' : 'No data available.'}
                          </td>
                        </tr>
                      )}
                      {displayRows.map(({ row, origIdx }) => {
                        const idx = origIdx;
                        const isEditingThisRow = isAdmin && editingRowIdx === idx;
                        const baseBg = isEditingThisRow ? 'bg-[#FFF8CD]' : (idx % 2 === 0 ? 'bg-[#F8FAFC]' : 'bg-[#EEF2F6]');
                        const cellBg = isEditingThisRow ? 'bg-[#FFF8CD]' : `${baseBg} group-hover:bg-[#E2E8F0] transition-colors`;
                        return (
                          <tr key={idx} className="group border-t border-slate-200">
                            {columns.map((col) => (
                              <td
                                key={col}
                                className={`px-1 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm text-slate-800 font-medium align-middle border-r border-slate-300 last:border-r-0 break-words leading-tight ${cellBg}`}
                              >
                                {isEditingThisRow ? (
                                  isPdfCol(col)
                                    ? renderPdfEditor(editingRowData[col], (v) =>
                                        setEditingRowData(prev => ({ ...prev, [col]: v })))
                                    : (
                                      <input
                                        value={editingRowData[col] || ''}
                                        onChange={e => setEditingRowData(prev => ({ ...prev, [col]: e.target.value }))}
                                        placeholder={col}
                                        className="w-full min-w-[70px] px-1.5 py-1 border border-blue-300 rounded text-[10px] sm:text-xs outline-none focus:ring-1 focus:ring-[#174873]"
                                      />
                                    )
                                ) : (
                                  <span className="break-words leading-tight">{renderViewValue(row[col])}</span>
                                )}
                              </td>
                            ))}
                            {isAdmin && (
                              <td className={`px-1.5 sm:px-2.5 py-1.5 sticky right-0 z-10 ${cellBg} shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.15)]`}>
                                {rowActions(idx, isEditingThisRow)}
                              </td>
                            )}
                          </tr>
                        );
                      })}

                      {isAdmin && columns.length > 0 && (
                        <tr className="border-t-2 border-gray-200 bg-gray-50">
                          {columns.map((col, i) => (
                            <td key={col} className={`px-1.5 sm:px-3 py-1.5 ${i === 0 ? 'sticky left-0 z-10 bg-gray-50' : ''}`}>
                              {isPdfCol(col) ? (
                                <div className="space-y-1 min-w-[120px]">
                                  {!newRow[col] ? (
                                    <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 bg-[#174873] text-[#fce8b2] rounded text-[10px] sm:text-xs whitespace-nowrap min-h-[28px]">
                                      <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                                      </svg>
                                      Upload PDF
                                      <input type="file" accept=".pdf" className="hidden"
                                        onChange={uploadPdf((v) => setNewRow(prev => ({ ...prev, [col]: v })))} />
                                    </label>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] sm:text-xs text-green-600">✓ Uploaded</span>
                                      <button onClick={() => setNewRow({ ...newRow, [col]: '' })}
                                        className="text-red-400 text-xs hover:text-red-600 min-w-[24px] min-h-[24px]">✕</button>
                                    </div>
                                  )}
                                  <input
                                    value={newRow[col] || ''}
                                    onChange={e => setNewRow({ ...newRow, [col]: e.target.value })}
                                    placeholder="or paste URL"
                                    className="w-full px-1.5 py-1 border border-blue-200 rounded text-[10px] sm:text-xs outline-none"
                                  />
                                </div>
                              ) : (
                                <input
                                  value={newRow[col] || ''}
                                  onChange={e => setNewRow({ ...newRow, [col]: e.target.value })}
                                  placeholder={col}
                                  className="w-full min-w-[80px] px-1.5 py-1 border border-blue-200 rounded text-[10px] sm:text-xs outline-none"
                                />
                              )}
                            </td>
                          ))}
                          <td className="px-1.5 sm:px-2.5 py-1.5 sticky right-0 z-10 bg-gray-50 shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.15)]">
                            <button onClick={handleAddRow}
                              className="min-w-[32px] min-h-[32px] px-2.5 py-1 bg-[#174873] text-white rounded text-[10px] sm:text-xs font-bold whitespace-nowrap">
                              Add
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {isAdmin && (
                  <div className="md:hidden flex justify-center py-2 border-t border-gray-100 bg-gray-50">
                    <span className="text-[10px] text-gray-400">Scroll → to edit/delete rows</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default GenericContentPage;