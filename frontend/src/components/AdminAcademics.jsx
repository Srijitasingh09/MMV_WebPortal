import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, CheckCircle, Upload, FileText, Save, Trash2 } from 'lucide-react';


const AdminAcademics = () => {
  const [activeSubTab, setActiveSubTab] = useState('nep');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // NEP State
  const [nepData, setNepData] = useState({ description: '', pdf_name: null, pdf_url: null });
  const [nepFile, setNepFile] = useState(null);

  // Syllabus State
  const [syllabusCategory, setSyllabusCategory] = useState('Science');
  const [syllabusDocs, setSyllabusDocs] = useState([]);
  const [syllabusFile, setSyllabusFile] = useState(null);

  // Electives State
  const [electiveCategory, setElectiveCategory] = useState('Science');
  const [electiveDocs, setElectiveDocs] = useState([]);
  const [electiveFile, setElectiveFile] = useState(null);

  // Section In-charge State (dynamic columns)
  const [incCategory, setIncCategory] = useState('Science');
  const [incTableColumns, setIncTableColumns] = useState([]);
  const [incTableRows, setIncTableRows] = useState([]);
  const [incNewRow, setIncNewRow] = useState({});
  const [incEditingCols, setIncEditingCols] = useState(false);
  const [incColInput, setIncColInput] = useState('');

  // Swayam State
  const [swayamData, setSwayamData] = useState({ description: '' });

  const getToken = () => localStorage.getItem('token');
  const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const fetchNep = async () => {
    const res = await axios.get('/academics/nep');
    setNepData(res.data);
  };

  const fetchSyllabus = async () => {
    const res = await axios.get(`/academics/syllabus/${syllabusCategory}`);
    setSyllabusDocs(res.data);
  };

  const fetchElectives = async () => {
    const res = await axios.get(`/academics/electives/${electiveCategory}`);
    setElectiveDocs(res.data);
  };

  const fetchInc = async () => {
    const res = await axios.get(`/academics/section-incharge/${incCategory}`);
    try {
      const parsed = JSON.parse(res.data.description || '{}');
      if (parsed && parsed.columns && parsed.rows) {
        setIncTableColumns(parsed.columns);
        setIncTableRows(parsed.rows);
      } else if (Array.isArray(parsed)) {
        const cols = parsed.length > 0 ? Object.keys(parsed[0]) : [];
        setIncTableColumns(cols);
        setIncTableRows(parsed);
      } else {
        setIncTableColumns([]);
        setIncTableRows([]);
      }
    } catch {
      setIncTableColumns([]);
      setIncTableRows([]);
    }
  };

  const fetchSwayam = async () => {
    const res = await axios.get('/academics/swayam');
    setSwayamData(res.data);
  };

  useEffect(() => {
    if (activeSubTab === 'nep') fetchNep();
    if (activeSubTab === 'swayam') fetchSwayam();
  }, [activeSubTab]);

  useEffect(() => { if (activeSubTab === 'syllabus') fetchSyllabus(); }, [activeSubTab, syllabusCategory]);
  useEffect(() => { if (activeSubTab === 'electives') fetchElectives(); }, [activeSubTab, electiveCategory]);
  useEffect(() => { if (activeSubTab === 'inc') fetchInc(); }, [activeSubTab, incCategory]);

  // Handlers
  const handleNepUpdate = async () => {
    setLoading(true);
    try {
      await axios.post('/academics/nep', { description: nepData.description }, { headers: authHeader() });
      if (nepFile) {
        const formData = new FormData();
        formData.append('file', nepFile);
        await axios.post('/academics/nep/upload', formData, { headers: authHeader() });
        setNepFile(null);
      }
      showSuccess('NEP Updated!');
      fetchNep();
    } catch (e) {
      alert('Error updating NEP');
    } finally { setLoading(false); }
  };

  const handleNepDeletePdf = async () => {
    if(!window.confirm('Delete NEP PDF?')) return;
    try {
      await axios.delete('/academics/nep/upload', { headers: authHeader() });
      showSuccess('PDF Deleted');
      fetchNep();
    } catch (e) { alert('Error deleting PDF'); }
  };

  const handleSyllabusUpload = async () => {
    if (!syllabusFile) return alert('Select a file');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', syllabusFile);
      await axios.post(`/academics/syllabus/${syllabusCategory}/upload`, formData, { headers: authHeader() });
      showSuccess('Syllabus Uploaded!');
      setSyllabusFile(null);
      fetchSyllabus();
    } catch (e) { alert('Error uploading'); } finally { setLoading(false); }
  };

  const handleSyllabusDelete = async (id) => {
    if(!window.confirm('Delete this syllabus?')) return;
    try {
      await axios.delete(`/academics/syllabus/${id}`, { headers: authHeader() });
      showSuccess('Deleted');
      fetchSyllabus();
    } catch (e) { alert('Error deleting'); }
  };

  const handleElectiveUpload = async () => {
    if (!electiveFile) return alert('Select a file');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', electiveFile);
      await axios.post(`/academics/electives/${electiveCategory}/upload`, formData, { headers: authHeader() });
      showSuccess('Elective Uploaded!');
      setElectiveFile(null);
      fetchElectives();
    } catch (e) { alert('Error uploading'); } finally { setLoading(false); }
  };

  const handleElectiveDelete = async (id) => {
    if(!window.confirm('Delete this elective?')) return;
    try {
      await axios.delete(`/academics/electives/${id}`, { headers: authHeader() });
      showSuccess('Deleted');
      fetchElectives();
    } catch (e) { alert('Error deleting'); }
  };

  const saveIncTable = async (cols, rows) => {
    setLoading(true);
    try {
      await axios.post(`/academics/section-incharge/${incCategory}`, { description: JSON.stringify({ columns: cols, rows: rows }) }, { headers: authHeader() });
      showSuccess('Table Saved!');
      fetchInc();
    } catch (e) { alert('Error saving'); } finally { setLoading(false); }
  };

  const handleIncSaveColumns = () => {
    const cols = incColInput.split(',').map(c => c.trim()).filter(c => c.length > 0);
    if (cols.length === 0) return;
    setIncTableColumns(cols);
    setIncEditingCols(false);
    saveIncTable(cols, incTableRows);
  };

  const handleIncAddRow = async () => {
    const hasValue = incTableColumns.some(col => (incNewRow[col] || '').trim());
    if (!hasValue) return;
    const updatedRows = [...incTableRows, { ...incNewRow }];
    setIncTableRows(updatedRows);
    setIncNewRow({});
    saveIncTable(incTableColumns, updatedRows);
  };

  const handleIncDeleteRow = async (index) => {
    const updatedRows = incTableRows.filter((_, i) => i !== index);
    setIncTableRows(updatedRows);
    saveIncTable(incTableColumns, updatedRows);
  };

  const handleSwayamUpdate = async () => {
    setLoading(true);
    try {
      await axios.post('/academics/swayam', swayamData, { headers: authHeader() });
      showSuccess('Swayam Updated!');
      fetchSwayam();
    } catch (e) { alert('Error updating'); } finally { setLoading(false); }
  };

  const renderTabs = () => (
    <div className="flex gap-2 mb-6 border-b border-gray-100 pb-3 overflow-x-auto">
      {['nep', 'syllabus', 'electives', 'inc', 'swayam'].map(tab => (
        <button
          key={tab}
          onClick={() => setActiveSubTab(tab)}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeSubTab === tab ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          {tab === 'inc' ? 'Section In-Charge' : tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );

  return (
    <div className="glass-card p-10 rounded-[2.5rem] animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="text-primary" size={24} /> Academics Management
        </h2>
        {success && (
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-bold animate-bounce">
            <CheckCircle size={14} /> <span>{success}</span>
          </div>
        )}
      </div>

      {renderTabs()}

      {activeSubTab === 'nep' && (
        <div className="space-y-4">
          <textarea
            value={nepData.description}
            onChange={e => setNepData({...nepData, description: e.target.value})}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none min-h-[150px]"
            placeholder="NEP Description..."
          />
          <div className="flex items-center gap-4">
            <input type="file" onChange={e => setNepFile(e.target.files[0])} className="text-sm" accept=".pdf" />
            {nepData.pdf_name && (
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm">
                <FileText size={16}/> {nepData.pdf_name}
                <button onClick={handleNepDeletePdf} className="text-red-500 ml-2 hover:text-red-700"><Trash2 size={16}/></button>
              </div>
            )}
          </div>
          <button onClick={handleNepUpdate} disabled={loading} className="px-6 py-2 bg-primary text-white font-bold rounded-xl flex items-center gap-2">
            <Save size={18} /> Save NEP
          </button>
        </div>
      )}

      {activeSubTab === 'syllabus' && (
        <div className="space-y-6">
          <select value={syllabusCategory} onChange={e => setSyllabusCategory(e.target.value)} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <option value="Science">Science</option>
            <option value="Social Science">Social Science</option>
            <option value="Arts">Arts</option>
          </select>
          <div className="flex items-center gap-4">
            <input type="file" onChange={e => setSyllabusFile(e.target.files[0])} className="text-sm" accept=".pdf" />
            <button onClick={handleSyllabusUpload} disabled={loading} className="px-4 py-2 bg-primary text-white font-bold rounded-lg flex items-center gap-2">
              <Upload size={16} /> Upload Syllabus
            </button>
          </div>
          <div className="space-y-2 mt-4">
            {syllabusDocs.map(doc => (
              <div key={doc.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-sm font-medium">{doc.pdf_name}</span>
                <button onClick={() => handleSyllabusDelete(doc.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
              </div>
            ))}
            {syllabusDocs.length === 0 && <p className="text-sm text-gray-500">No syllabus documents found for {syllabusCategory}.</p>}
          </div>
        </div>
      )}

      {activeSubTab === 'electives' && (
        <div className="space-y-6">
          <select value={electiveCategory} onChange={e => setElectiveCategory(e.target.value)} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <option value="Science">Science</option>
            <option value="Social Science">Social Science</option>
            <option value="Arts">Arts</option>
          </select>
          <div className="flex items-center gap-4">
            <input type="file" onChange={e => setElectiveFile(e.target.files[0])} className="text-sm" accept=".pdf" />
            <button onClick={handleElectiveUpload} disabled={loading} className="px-4 py-2 bg-primary text-white font-bold rounded-lg flex items-center gap-2">
              <Upload size={16} /> Upload Elective
            </button>
          </div>
          <div className="space-y-2 mt-4">
            {electiveDocs.map(doc => (
              <div key={doc.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-sm font-medium">{doc.pdf_name}</span>
                <button onClick={() => handleElectiveDelete(doc.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
              </div>
            ))}
            {electiveDocs.length === 0 && <p className="text-sm text-gray-500">No elective documents found for {electiveCategory}.</p>}
          </div>
        </div>
      )}

      {activeSubTab === 'inc' && (
        <div className="space-y-4">
          <select value={incCategory} onChange={e => setIncCategory(e.target.value)} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <option value="Science">Science</option>
            <option value="Social Science">Social Science</option>
            <option value="Arts">Arts</option>
          </select>

          <div className="bg-blue-50 rounded-2xl border-2 border-secondary overflow-hidden">
            <div className="p-4 border-b border-secondary/20">
              {incEditingCols ? (
                <div className="flex items-center gap-3">
                  <input value={incColInput} onChange={(e) => setIncColInput(e.target.value)}
                    placeholder="Enter column names separated by commas (e.g. Name, Department, Contact)"
                    className="flex-1 px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:border-secondary outline-none" />
                  <button onClick={handleIncSaveColumns} className="px-4 py-2 bg-secondary text-white rounded-lg text-xs font-bold hover:bg-primary transition-colors">Save Columns</button>
                  <button onClick={() => setIncEditingCols(false)} className="px-3 py-2 text-muted text-xs font-bold hover:text-primary">Cancel</button>
                </div>
              ) : (
                <button onClick={() => { setIncColInput(incTableColumns.join(', ')); setIncEditingCols(true); }}
                  className="text-sm text-secondary hover:text-primary font-medium transition-colors">
                  {incTableColumns.length === 0 ? '+ Define Table Columns' : 'Edit Columns'}
                </button>
              )}
            </div>

            {incTableColumns.length === 0 ? (
              <div className="p-8 text-center text-muted italic">Click "Define Table Columns" to set up the table.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary text-white">
                      {incTableColumns.map(col => (
                        <th key={col} className="px-4 py-3 text-left font-semibold">{col}</th>
                      ))}
                      <th className="px-4 py-3 text-left font-semibold w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incTableRows.length === 0 && (
                      <tr><td colSpan={incTableColumns.length + 1} className="px-4 py-8 text-center text-muted italic">No data added yet.</td></tr>
                    )}
                    {incTableRows.map((row, idx) => (
                      <tr key={idx} className="border-t border-secondary/20 hover:bg-blue-100/50">
                        {incTableColumns.map(col => (
                          <td key={col} className="px-4 py-3 text-primary">{row[col] || '-'}</td>
                        ))}
                        <td className="px-4 py-3">
                          <button onClick={() => handleIncDeleteRow(idx)} className="text-red-500 hover:text-red-700 text-xs font-bold">Remove</button>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-secondary/30 bg-white">
                      {incTableColumns.map(col => (
                        <td key={col} className="px-4 py-2">
                          <input
                            value={incNewRow[col] || ''}
                            onChange={(e) => setIncNewRow({ ...incNewRow, [col]: e.target.value })}
                            placeholder={col}
                            className="w-full px-3 py-2 border border-secondary/30 rounded-lg text-sm focus:border-secondary outline-none"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-2">
                        <button onClick={handleIncAddRow} disabled={loading} className="px-3 py-2 bg-secondary text-white rounded-lg text-xs font-bold hover:bg-primary transition-colors disabled:opacity-50">
                          Add
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'swayam' && (
        <div className="space-y-4">
          <textarea
            value={swayamData.description}
            onChange={e => setSwayamData({...swayamData, description: e.target.value})}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none min-h-[150px]"
            placeholder="Swayam Courses Description..."
          />
          <button onClick={handleSwayamUpdate} disabled={loading} className="px-6 py-2 bg-primary text-white font-bold rounded-xl flex items-center gap-2">
            <Save size={18} /> Save Swayam Info
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminAcademics;
