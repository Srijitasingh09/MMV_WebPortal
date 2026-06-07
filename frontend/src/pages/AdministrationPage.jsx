import React, { useState, useEffect, useRef } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';

export const sectionConfig = {
  'vice-chancellor': { title: 'Vice-Chancellor', subSections: [] },
  'mmv-principal': { title: 'MMV Principal', subSections: [] },
  'dean-of-student': { title: 'Dean of Student', subSections: [] },
  'mmv-student-advisor': { title: 'MMV Student Advisor', subSections: [] },
  'proctorial-board': {
    title: 'Proctorial Board',
    subSections: ['Chief Proctor', 'University', 'MMV'],
    subSectionTypes: {
      'Chief Proctor': 'photo-description',
      'University': 'table',
      'MMV': 'photo-table',
    }
  },
  'controller-of-examination': { title: 'Controller of Examination', subSections: [] },
  'office': { title: 'Office', subSections: ['I-Card/No-Dues', 'Fees', 'Attendance', 'Scholarship', 'Examination', 'Internship'] },
};

const toSlug = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const fromSlug = (slug, options) => options.find(o => toSlug(o) === slug) || null;

const AdministrationPage = () => {
  const { section, subsection: subsectionSlug } = useParams();
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const token = localStorage.getItem('token');
  const fileInputRef = useRef(null);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Dynamic table state
  const [tableColumns, setTableColumns] = useState([]);
  const [tableRows, setTableRows] = useState([]);
  const [newRow, setNewRow] = useState({});
  const [editingColumns, setEditingColumns] = useState(false);
  const [columnInput, setColumnInput] = useState('');

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:8000/administration');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching administration data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Compute derived values
  const config = section && sectionConfig[section] ? sectionConfig[section] : null;
  const activeSubSection = config && subsectionSlug ? fromSlug(subsectionSlug, config.subSections) : null;
  const dbSectionName = config ? config.title : '';
  const dbSubSection = activeSubSection;

  const getSubSectionType = () => {
    if (config && config.subSectionTypes && activeSubSection) {
      return config.subSectionTypes[activeSubSection] || 'description';
    }
    return 'description';
  };

  const subType = getSubSectionType();
  const currentData = data.find(
    (item) => item.section_name === dbSectionName && item.sub_section === dbSubSection
  ) || { description: '', image_url: null };

  // Parse table data: { columns: [...], rows: [...] }
  const parseTableData = (description) => {
    try {
      const parsed = JSON.parse(description || '{}');
      if (parsed && parsed.columns && parsed.rows) {
        return { columns: parsed.columns, rows: parsed.rows };
      }
      // Legacy: plain array of rows
      if (Array.isArray(parsed)) {
        const cols = parsed.length > 0 ? Object.keys(parsed[0]) : [];
        return { columns: cols, rows: parsed };
      }
      return { columns: [], rows: [] };
    } catch { return { columns: [], rows: [] }; }
  };

  // Sync table state
  useEffect(() => {
    if (subType === 'table' || subType === 'photo-table') {
      const td = parseTableData(currentData?.description);
      setTableColumns(td.columns);
      setTableRows(td.rows);
    }
  }, [data, activeSubSection, section, subType]);

  // ─── RENDER LOGIC ───

  // IF NO SECTION — SHOW OVERVIEW GRID
  if (!section) {
    return (
      <div className="p-8 max-w-6xl mx-auto animation-fade-in h-full overflow-y-auto custom-scrollbar">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Administration</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(sectionConfig).map(([key, cfg]) => (
            <button key={key} onClick={() => navigate(`/administration/${key}`)}
              className="bg-blue-50 p-6 rounded-2xl border-2 border-secondary hover:shadow-md hover:bg-blue-100/50 transition-all text-left flex flex-col group h-[120px] justify-center">
              <h3 className="text-xl font-bold text-primary group-hover:text-secondary transition-colors">{cfg.title}</h3>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!config) return <Navigate to="/administration" replace />;

  // IF SECTION HAS SUBSECTIONS BUT NO SUBSECTION SELECTED — SHOW SUBSECTION GRID
  if (config.subSections.length > 0 && !subsectionSlug) {
    return (
      <div className="p-8 max-w-6xl mx-auto animation-fade-in h-full overflow-y-auto custom-scrollbar">
        <button onClick={() => navigate('/administration')}
          className="mb-6 flex items-center text-sm font-medium text-primary hover:text-secondary transition-colors">
          ← Back to Administration
        </button>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">{config.title}</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {config.subSections.map((sub) => (
            <button key={sub} onClick={() => navigate(`/administration/${section}/${toSlug(sub)}`)}
              className="bg-blue-50 p-6 rounded-2xl border-2 border-secondary hover:shadow-md hover:bg-blue-100/50 transition-all text-left flex flex-col group h-[120px] justify-center">
              <h3 className="text-xl font-bold text-primary group-hover:text-secondary transition-colors">{sub}</h3>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── CONTENT PAGE ───

  const handleEditClick = () => { setEditDescription(currentData.description || ''); setIsEditing(true); };

  const handleSaveDescription = async () => {
    setSaving(true);
    try {
      await axios.put('http://localhost:8000/admin/administration',
        { section_name: dbSectionName, sub_section: dbSubSection, description: editDescription },
        { headers: { Authorization: `Bearer ${token}` } });
      await fetchData(); setIsEditing(false);
    } catch (e) { alert('Failed to save.'); } finally { setSaving(false); }
  };

  const saveTableData = async (cols, rows) => {
    setSaving(true);
    try {
      await axios.put('http://localhost:8000/admin/administration',
        { section_name: dbSectionName, sub_section: dbSubSection, description: JSON.stringify({ columns: cols, rows: rows }) },
        { headers: { Authorization: `Bearer ${token}` } });
      await fetchData();
    } catch (e) { alert('Failed to save table.'); } finally { setSaving(false); }
  };

  const handleSaveColumns = () => {
    const cols = columnInput.split(',').map(c => c.trim()).filter(c => c.length > 0);
    if (cols.length === 0) return;
    setTableColumns(cols);
    setEditingColumns(false);
    saveTableData(cols, tableRows);
  };

  const handleAddRow = () => {
    if (!tableColumns.some(col => (newRow[col] || '').trim())) return;
    const updated = [...tableRows, { ...newRow }];
    setTableRows(updated); setNewRow({});
    saveTableData(tableColumns, updated);
  };

  const handleDeleteRow = (index) => {
    const updated = tableRows.filter((_, i) => i !== index);
    setTableRows(updated);
    saveTableData(tableColumns, updated);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const formData = new FormData();
    formData.append('section_name', dbSectionName);
    if (dbSubSection) formData.append('sub_section', dbSubSection);
    formData.append('file', file);
    setUploadingImage(true);
    try {
      await axios.post('http://localhost:8000/admin/administration/upload-photo', formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      await fetchData();
    } catch (e) { alert('Failed to upload.'); }
    finally { setUploadingImage(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  if (loading) return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div></div>;

  const showPhoto = (subType === 'photo-description' || subType === 'photo-table' || (subType === 'description' && section !== 'office'));
  const showTable = (subType === 'table' || subType === 'photo-table');
  const showDescription = (subType === 'description' || subType === 'photo-description');
  const backPath = config.subSections.length > 0 ? `/administration/${section}` : '/administration';

  const renderTable = () => (
    <div className="bg-blue-50 rounded-2xl border-2 border-secondary overflow-hidden">
      {/* Admin: Column configuration */}
      {isAdmin && (
        <div className="p-4 border-b border-secondary/20">
          {editingColumns ? (
            <div className="flex items-center gap-3">
              <input value={columnInput} onChange={(e) => setColumnInput(e.target.value)}
                placeholder="Enter column names separated by commas (e.g. Name, Designation, Contact)"
                className="flex-1 px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:border-secondary outline-none" />
              <button onClick={handleSaveColumns} className="px-4 py-2 bg-secondary text-white rounded-lg text-xs font-bold hover:bg-primary transition-colors">Save Columns</button>
              <button onClick={() => setEditingColumns(false)} className="px-3 py-2 text-muted text-xs font-bold hover:text-primary">Cancel</button>
            </div>
          ) : (
            <button onClick={() => { setColumnInput(tableColumns.join(', ')); setEditingColumns(true); }}
              className="text-sm text-secondary hover:text-primary font-medium transition-colors">
              {tableColumns.length === 0 ? '+ Define Table Columns' : 'Edit Columns'}
            </button>
          )}
        </div>
      )}

      {tableColumns.length === 0 ? (
        <div className="p-8 text-center text-muted italic">
          {isAdmin ? 'Click "Define Table Columns" above to set up the table.' : 'No table configured yet.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-white">
                {tableColumns.map(col => <th key={col} className="px-4 py-3 text-left font-semibold">{col}</th>)}
                {isAdmin && <th className="px-4 py-3 text-left font-semibold w-20">Action</th>}
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 && (
                <tr><td colSpan={tableColumns.length + (isAdmin ? 1 : 0)} className="px-4 py-8 text-center text-muted italic">No data added yet.</td></tr>
              )}
              {tableRows.map((row, idx) => (
                <tr key={idx} className="border-t border-secondary/20 hover:bg-blue-100/50 transition-colors">
                  {tableColumns.map(col => <td key={col} className="px-4 py-3 text-primary">{row[col] || '-'}</td>)}
                  {isAdmin && <td className="px-4 py-3"><button onClick={() => handleDeleteRow(idx)} className="text-red-500 hover:text-red-700 text-xs font-bold">Remove</button></td>}
                </tr>
              ))}
              {isAdmin && (
                <tr className="border-t-2 border-secondary/30 bg-white">
                  {tableColumns.map(col => (
                    <td key={col} className="px-4 py-2">
                      <input value={newRow[col] || ''} onChange={(e) => setNewRow({ ...newRow, [col]: e.target.value })}
                        placeholder={col} className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:border-secondary outline-none" />
                    </td>
                  ))}
                  <td className="px-4 py-2">
                    <button onClick={handleAddRow} disabled={saving} className="px-3 py-2 bg-secondary text-white rounded-lg text-xs font-bold hover:bg-primary transition-colors disabled:opacity-50">Add</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto animation-fade-in custom-scrollbar overflow-y-auto h-full">
      <button onClick={() => navigate(backPath)}
        className="mb-6 flex items-center text-sm font-medium text-primary hover:text-secondary transition-colors">
        ← Back to {config.subSections.length > 0 ? config.title : 'Administration'}
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">{activeSubSection ? `${config.title} — ${activeSubSection}` : config.title}</h1>
      </div>

      <div className={`grid grid-cols-1 ${showPhoto ? 'lg:grid-cols-3' : ''} gap-8`}>
        {showPhoto && (
          <div className="lg:col-span-1">
            <div className="bg-blue-50 rounded-2xl border-2 border-secondary overflow-hidden">
              <div className="p-4 border-b border-secondary/20 flex justify-between items-center">
                {isAdmin && (
                  <div>
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}
                      className="text-sm text-secondary hover:text-primary font-medium transition-colors disabled:opacity-50">
                      {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                    </button>
                  </div>
                )}
              </div>
              <div className="p-6 flex justify-center items-center bg-white min-h-[300px]">
                {currentData.image_url ? (
                  <img src={`http://localhost:8000${currentData.image_url}`} alt={dbSubSection || dbSectionName}
                    className="max-w-full h-auto rounded-lg object-cover max-h-[400px]" />
                ) : (<p className="text-muted">No photo available</p>)}
              </div>
            </div>
          </div>
        )}

        <div className={showPhoto ? 'lg:col-span-2' : ''}>
          {showDescription && (
            <div className="bg-blue-50 rounded-2xl border-2 border-secondary overflow-hidden h-full flex flex-col">
              <div className="p-4 border-b border-secondary/20 flex justify-between items-center">
                {isAdmin && !isEditing && (
                  <button onClick={handleEditClick} className="text-sm text-secondary hover:text-primary font-medium transition-colors">Edit</button>
                )}
                {isAdmin && isEditing && (
                  <div className="flex space-x-3">
                    <button onClick={() => setIsEditing(false)} className="text-sm text-muted hover:text-primary font-medium">Cancel</button>
                    <button onClick={handleSaveDescription} disabled={saving}
                      className="text-sm bg-secondary hover:bg-primary text-white px-3 py-1.5 rounded-md font-medium disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
              <div className="p-6 flex-1 bg-white">
                {isEditing ? (
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full h-64 p-4 border-2 border-secondary rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-primary outline-none transition-all resize-none"
                    placeholder="Enter description here..." />
                ) : (
                  <div className="prose max-w-none text-primary whitespace-pre-wrap">
                    {currentData.description || <p className="text-muted italic">No description provided yet.</p>}
                  </div>
                )}
              </div>
            </div>
          )}
          {showTable && renderTable()}
        </div>
      </div>
    </div>
  );
};

export default AdministrationPage;
