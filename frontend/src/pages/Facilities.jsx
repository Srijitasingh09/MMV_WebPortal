import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = `http://${window.location.hostname}:8000`;

const SECTIONS = {
  'hostels': {
    title: 'Hostels',
    caps: ['description', 'pdf'],
    categories: {
      'National': ['Jyoti Kunj', 'Kirti Kunj', 'Pragya Kunj', 'Swasti Kunj', 'Kundan Devi'],
      'International': [],
    },
  },
  'library': {
    title: 'Library',
    caps: ['description', 'pdf'], subSections: ['MMV', 'Central Library', 'Cyber Library']
  },
  'transportation': {
    title: 'Transportation',
    caps: ['description'], subSections: []
  },
  'medical': {
    title: 'Medical',
    caps: ['description', 'pdf'], subSections: ['Health Centre', 'Sir Sundarlal Hospital', 'Trauma Centre']
  },
  'sports': {
    title: 'Sports',
    caps: ['description', 'pdf'],
    categories: {
      'MMV': ['Indoor', 'Outdoor'],
      'University': ['Indoor', 'Outdoor'],
    }
  },
  'portals': {
    title: 'Portals',
    caps: ['description'], subSections: ['Namaste BHU', 'Samarth']
  },
  'well-being': {
    title: 'Well-Being',
    caps: ['pdf'], subSections: ['MMV', 'University']
  },
  'central-discovery-centre': {
    title: 'Central Discovery Centre',
    caps: ['description', 'pdf'], subSections: []
  },
  'training-placement': {
    title: 'Training & Placement Cell',
    caps: ['description', 'pdf'], subSections: ['MMV', 'University']
  },
  'canteen': {
    title: 'Canteen',
    caps: ['description'], subSections: []
  },
  'clubs': {
    title: 'Clubs',
    caps: ['description'], subSections: []
  },
  'guest-house': {
    title: 'Guest House',
    caps: ['description'], subSections: []
  },
  'extracurricular': {
    title: 'Extracurricular Activities',
    caps: ['description', 'pdf'],
    categories: {
      'Courses/Certification': [], 'NSS/NCC': [], 'Bank/Post Office': [],
      'Places': ['VT', 'Bharat Kala Bhawan']
    },
  },
};

const toSlug = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const fromSlug = (slug, options) => options.find(o => toSlug(o) === slug) || null;

// Background images for specific sections (key: section|category|subcategory)
const BACKGROUND_IMAGES = {
  'hostels||': '/backimages/hostels.jpeg',
  'hostels|National|': '/backimages/hostels.jpeg',
  'hostels|International|': '/backimages/intern hostel.jpeg',
  'hostels|National|Jyoti Kunj': '/backimages/jk.jpeg',
  'hostels|National|Kirti Kunj': '/backimages/kk.jpeg',
  'hostels|National|Pragya Kunj': '/backimages/pk.jpeg',
  'hostels|National|Swasti Kunj': '/backimages/sk.jpeg',
  'hostels|National|Kundan Devi': '/backimages/kd.jpeg',
  'library||': '/backimages/library.jpeg',
  'library|MMV|': '/backimages/mmv library.jpeg',
  'library|Central Library|': '/backimages/central library.jpeg',
  'library|Cyber Library|': '/backimages/cyber library.jpeg',
  'transportation||': '/backimages/bus.jpeg',
  'medical||': '/backimages/medical.jpeg',
  'medical|Health Centre|': '/backimages/health centre.jpeg',
  'medical|Sir Sundarlal Hospital|': '/backimages/sunderlal.jpeg',
  'medical|Trauma Centre|': '/backimages/trauma centre.jpeg',
  'sports||': '/backimages/sports.jpeg',
  'sports|MMV|Indoor': '/backimages/indoor.jpeg',
  'sports|MMV|Outdoor': '/backimages/outdoor.jpeg',
  'sports|University|Indoor': '/backimages/indoor.jpeg',
  'sports|University|Outdoor': '/backimages/outdoor.jpeg',
  'portals|Samarth|': '/backimages/samarth.jpeg',
  'portals|Namaste BHU|': '/backimages/namaste.jpeg',
  'well-being|MMV|': '/backimages/wbsc.jpeg',
  'well-being|University|': '/backimages/wbsc.jpeg',
  'training-placement||': '/backimages/training placement.jpeg',
  'training-placement|MMV|': '/backimages/training placement.jpeg',
  'training-placement|University|': '/backimages/training placement.jpeg',
  'guest-house||': '/backimages/guest house.jpeg',
  'extracurricular|NSS/NCC|': '/backimages/ncc.jpeg',
  'extracurricular|Places|VT': '/backimages/vt.jpeg',
  'extracurricular|Places|Bharat Kala Bhawan': '/backimages/bharat kala bhawan.jpeg',
  'canteen||': '/backimages/canteen.jpeg',
  'extracurricular|Bank/Post Office|': '/backimages/bank po.jpeg',
};

const Facilities = () => {
  const { section, category: catSlug, subcategory: subSlug } = useParams();
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const token = localStorage.getItem('token');
  const fileRef = useRef(null);
  const photoRef = useRef(null);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchData = async (sec) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/facility-content?section=${sec}`);
      setData(res.data);
    } catch { setData([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (section && SECTIONS[section]) {
      fetchData(section);
      setIsEditing(false);
    } else {
      setLoading(false);
    }
  }, [section]);

  // ─── HUB PAGE (no section selected) ───
  if (!section) {
    return (
      <div className="p-8 max-w-6xl mx-auto animation-fade-in h-full overflow-y-auto custom-scrollbar">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Campus Facilities</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(SECTIONS).map(([key, cfg]) => (
            <button key={key} onClick={() => navigate(`/facilities/${key}`)}
              className="bg-blue-50 p-6 rounded-2xl border-2 border-secondary hover:shadow-md hover:bg-blue-100/50 transition-all text-left flex flex-col group h-[120px] justify-center">
              <h3 className="text-xl font-bold text-primary group-hover:text-secondary transition-colors">{cfg.title}</h3>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!SECTIONS[section]) { navigate('/facilities'); return null; }

  const cfg = SECTIONS[section];
  const hasCats = !!cfg.categories;
  const hasSubs = cfg.subSections && cfg.subSections.length > 0;

  // Resolve active category/subcategory from URL
  const activeCat = catSlug && hasCats ? fromSlug(catSlug, Object.keys(cfg.categories)) : null;
  const activeSub = subSlug && hasCats && activeCat ? fromSlug(subSlug, cfg.categories[activeCat] || []) : 
                    (catSlug && hasSubs && !hasCats ? fromSlug(catSlug, cfg.subSections) : null);

  // ─── SECTION HAS CATEGORIES, NO CATEGORY SELECTED → show category grid ───
  if (hasCats && !catSlug) {
    const catKeys = Object.keys(cfg.categories);
    return (
      <div className="p-8 max-w-6xl mx-auto animation-fade-in h-full overflow-y-auto custom-scrollbar">
        <button onClick={() => navigate('/facilities')}
          className="mb-6 flex items-center text-sm font-medium text-primary hover:text-secondary transition-colors">
          ← Back to Facilities
        </button>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">{cfg.title}</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catKeys.map(cat => (
            <button key={cat} onClick={() => navigate(`/facilities/${section}/${toSlug(cat)}`)}
              className="bg-blue-50 p-6 rounded-2xl border-2 border-secondary hover:shadow-md hover:bg-blue-100/50 transition-all text-left flex flex-col group h-[120px] justify-center">
              <h3 className="text-xl font-bold text-primary group-hover:text-secondary transition-colors">{cat}</h3>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── SECTION HAS SUBSECTIONS (flat), NO SUBSECTION SELECTED → show subsection grid ───
  if (hasSubs && !catSlug) {
    return (
      <div className="p-8 max-w-6xl mx-auto animation-fade-in h-full overflow-y-auto custom-scrollbar">
        <button onClick={() => navigate('/facilities')}
          className="mb-6 flex items-center text-sm font-medium text-primary hover:text-secondary transition-colors">
          ← Back to Facilities
        </button>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">{cfg.title}</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cfg.subSections.map(sub => (
            <button key={sub} onClick={() => navigate(`/facilities/${section}/${toSlug(sub)}`)}
              className="bg-blue-50 p-6 rounded-2xl border-2 border-secondary hover:shadow-md hover:bg-blue-100/50 transition-all text-left flex flex-col group h-[120px] justify-center">
              <h3 className="text-xl font-bold text-primary group-hover:text-secondary transition-colors">{sub}</h3>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── CATEGORY SELECTED BUT HAS SUBCATEGORIES, NO SUBCATEGORY SELECTED → show subcategory grid ───
  if (hasCats && activeCat && !subSlug) {
    const subs = cfg.categories[activeCat] || [];
    if (subs.length > 0) {
      return (
        <div className="p-8 max-w-6xl mx-auto animation-fade-in h-full overflow-y-auto custom-scrollbar">
          <button onClick={() => navigate(`/facilities/${section}`)}
            className="mb-6 flex items-center text-sm font-medium text-primary hover:text-secondary transition-colors">
            ← Back to {cfg.title}
          </button>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary">{cfg.title} — {activeCat}</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subs.map(sub => (
              <button key={sub} onClick={() => navigate(`/facilities/${section}/${toSlug(activeCat)}/${toSlug(sub)}`)}
                className="bg-blue-50 p-6 rounded-2xl border-2 border-secondary hover:shadow-md hover:bg-blue-100/50 transition-all text-left flex flex-col group h-[120px] justify-center">
                <h3 className="text-xl font-bold text-primary group-hover:text-secondary transition-colors">{sub}</h3>
              </button>
            ))}
          </div>
        </div>
      );
    }
  }

  // ─── CONTENT PAGE — render the actual content ───
  const dbSection = section;
  const dbCategory = hasCats ? (activeCat || '') : (activeSub || '');
  const dbSubCategory = hasCats ? (activeSub || '') : '';
  let currentCaps = [...cfg.caps];

  const currentData = data.find(
    d => d.category === dbCategory && d.sub_category === dbSubCategory
  ) || { description: '', name: '', pdf_url: null, pdf_name: null, photo_url: null, photo_name: null };

  // Determine back path
  let backPath = '/facilities';
  let backLabel = 'Facilities';
  if (hasCats && activeSub) {
    backPath = `/facilities/${section}/${toSlug(activeCat)}`;
    backLabel = `${cfg.title} — ${activeCat}`;
  } else if (hasCats && activeCat) {
    backPath = `/facilities/${section}`;
    backLabel = cfg.title;
  } else if (hasSubs && activeSub) {
    backPath = `/facilities/${section}`;
    backLabel = cfg.title;
  }

  // Title
  let pageTitle = cfg.title;
  if (activeCat && activeSub) pageTitle = `${cfg.title} — ${activeCat} — ${activeSub}`;
  else if (activeCat) pageTitle = `${cfg.title} — ${activeCat}`;
  else if (activeSub) pageTitle = `${cfg.title} — ${activeSub}`;

  // Handlers
  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/facility-content`, {
        section: dbSection, category: dbCategory, sub_category: dbSubCategory,
        description: editDesc, name: editName,
      }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchData(section); setIsEditing(false);
    } catch (e) { alert('Failed to save.'); } finally { setSaving(false); }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData();
    fd.append('section', dbSection); fd.append('category', dbCategory); fd.append('sub_category', dbSubCategory);
    fd.append('file', file);
    setUploading(true);
    try {
      await axios.post(`${API}/facility-content/upload-pdf`, fd, { headers: { Authorization: `Bearer ${token}` } });
      await fetchData(section);
    } catch { alert('Upload failed.'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handlePdfDelete = async () => {
    if (!window.confirm('Delete PDF?')) return;
    try {
      await axios.delete(`${API}/facility-content/pdf`, {
        data: { section: dbSection, category: dbCategory, sub_category: dbSubCategory },
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchData(section);
    } catch { alert('Delete failed.'); }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData();
    fd.append('section', dbSection); fd.append('category', dbCategory); fd.append('sub_category', dbSubCategory);
    fd.append('file', file);
    setUploading(true);
    try {
      await axios.post(`${API}/facility-content/upload-photo`, fd, { headers: { Authorization: `Bearer ${token}` } });
      await fetchData(section);
    } catch { alert('Upload failed.'); }
    finally { setUploading(false); if (photoRef.current) photoRef.current.value = ''; }
  };

  const handlePhotoDelete = async () => {
    if (!window.confirm('Delete photo?')) return;
    try {
      await axios.delete(`${API}/facility-content/photo`, {
        data: { section: dbSection, category: dbCategory, sub_category: dbSubCategory },
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchData(section);
    } catch { alert('Delete failed.'); }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div></div>;
  }

  // Determine background image
  const bgKey = `${section}|${dbCategory}|${dbSubCategory}`;
  const bgImg = BACKGROUND_IMAGES[bgKey];

  return (
    <div className="relative animation-fade-in custom-scrollbar overflow-y-auto h-full">
      {/* Full-page background image */}
      {bgImg && (
        <>
          <div className="fixed inset-0 ml-64" style={{ zIndex: 0 }}>
            <img src={bgImg} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="fixed inset-0 ml-64 bg-white/75" style={{ zIndex: 0 }} />
        </>
      )}

      <div className="relative p-8 max-w-6xl mx-auto" style={{ zIndex: 1 }}>
        <button onClick={() => navigate(backPath)}
          className="mb-6 flex items-center text-sm font-medium text-primary hover:text-secondary transition-colors">
          ← Back to {backLabel}
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">{pageTitle}</h1>
        </div>

      <div className={`grid grid-cols-1 ${currentCaps.includes('photo') ? 'lg:grid-cols-3' : ''} gap-8`}>
        {/* Photo Section */}
        {currentCaps.includes('photo') && (
          <div className="lg:col-span-1">
            <div className="bg-blue-50 rounded-2xl border-2 border-secondary overflow-hidden">
              <div className="p-4 border-b border-secondary/20 flex justify-between items-center">
                {isAdmin && (
                  <div className="flex items-center space-x-2">
                    <input type="file" accept="image/*" className="hidden" ref={photoRef} onChange={handlePhotoUpload} />
                    <button onClick={() => photoRef.current?.click()} disabled={uploading}
                      className="text-sm text-secondary hover:text-primary font-medium transition-colors disabled:opacity-50">
                      {uploading ? '...' : 'Upload Photo'}
                    </button>
                    {currentData.photo_url && (
                      <button onClick={handlePhotoDelete} className="text-red-400 hover:text-red-600 text-sm">Delete</button>
                    )}
                  </div>
                )}
              </div>
              <div className="p-6 flex justify-center items-center bg-white min-h-[250px]">
                {currentData.photo_url ? (
                  <img src={`${API}${currentData.photo_url}`} alt="Facility" className="max-w-full h-auto rounded-lg object-cover max-h-[350px]" />
                ) : (<p className="text-muted">No photo available</p>)}
              </div>
            </div>
          </div>
        )}

        {/* Description Section */}
        <div className={currentCaps.includes('photo') ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="bg-blue-50 rounded-2xl border-2 border-secondary overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-secondary/20 flex justify-between items-center">
              {isAdmin && !isEditing && (
                <button onClick={() => { setEditDesc(currentData.description || ''); setEditName(currentData.name || ''); setIsEditing(true); }}
                  className="text-sm text-secondary hover:text-primary font-medium transition-colors">Edit</button>
              )}
              {isAdmin && isEditing && (
                <div className="flex space-x-3">
                  <button onClick={() => setIsEditing(false)} className="text-sm text-muted hover:text-primary font-medium">Cancel</button>
                  <button onClick={handleSave} disabled={saving}
                    className="text-sm bg-secondary hover:bg-primary text-white px-3 py-1.5 rounded-md font-medium disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
            <div className="p-6 flex-1 bg-white">
              {isEditing ? (
                <div className="space-y-4">
                  {(section === 'hostels' && !activeCat) && (
                    <div>
                      <label className="text-xs font-bold text-muted uppercase tracking-widest mb-1 block">Warden Name</label>
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        className="w-full p-3 border-2 border-secondary rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-primary outline-none"
                        placeholder="Admin Warden Name" />
                    </div>
                  )}
                  <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)}
                    className="w-full h-64 p-4 border-2 border-secondary rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-primary outline-none transition-all resize-none"
                    placeholder="Enter description here..." />
                </div>
              ) : (
                <div className="prose max-w-none text-primary whitespace-pre-wrap">
                  {currentData.name && <p className="text-lg font-semibold text-primary mb-2">{currentData.name}</p>}
                  {currentData.description || <p className="text-muted italic">No description provided yet.</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Section */}
      {currentCaps.includes('pdf') && (
        <div className="mt-8">
          <div className="bg-blue-50 rounded-2xl border-2 border-secondary overflow-hidden">
            <div className="p-4 border-b border-secondary/20 flex justify-between items-center">
              <h3 className="font-semibold text-primary">Documents</h3>
              {isAdmin && (
                <div className="flex items-center space-x-2">
                  <input type="file" accept=".pdf" className="hidden" ref={fileRef} onChange={handlePdfUpload} />
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="text-sm text-secondary hover:text-primary font-medium transition-colors disabled:opacity-50">
                    {uploading ? 'Uploading...' : 'Upload PDF'}
                  </button>
                </div>
              )}
            </div>
            <div className="p-6">
              {currentData.pdf_url ? (
                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-secondary/20">
                  <a href={`${API}${currentData.pdf_url}`} target="_blank" rel="noopener noreferrer"
                    className="text-secondary hover:underline font-medium">{currentData.pdf_name || 'View PDF'}</a>
                  {isAdmin && <button onClick={handlePdfDelete} className="text-red-400 hover:text-red-600 text-sm">Delete</button>}
                </div>
              ) : (<p className="text-muted italic text-center py-4">No documents uploaded yet.</p>)}
            </div>
          </div>
        </div>
      )}
      </div>{/* close relative content wrapper */}
    </div>
  );
};

export default Facilities;
