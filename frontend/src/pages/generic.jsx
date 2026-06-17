import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SlideshowBlock from './SlideshowBlock';

const API = `http://${window.location.hostname}:8000`;

const GenericContentPage = ({
  section,
  subsection,
  title,
  backPath,
  backLabel,
  pageType = 'description', // 'photo-description' | 'description' | 'pdf-list' | 'table' | 'description-table' | 'photo-description-table'
  tableColumns = [],  
  photoAlign = 'left',  
  photoCols = 2,        // how many photos per row (1, 2, 3)
  photoHeight = 200,      // predefined columns if pageType includes 'table'
  slideshowHeight = 360,
  slideshowMaxWidth = '100%',
}) => {
  const navigate  = useNavigate();
  const isAdmin   = localStorage.getItem('isAdmin') === 'true';
  const token     = localStorage.getItem('token');
  const imageRef  = useRef(null);
  const pdfRef    = useRef(null);

  const [data,       setData]       = useState({});
  const [loading,    setLoading]    = useState(true);
  const [isEditing,  setIsEditing]  = useState(false);
  const [editDesc,   setEditDesc]   = useState('');
  const [saving,     setSaving]     = useState(false);

  // table state
  const [columns,    setColumns]    = useState(tableColumns);
  const [rows,       setRows]       = useState([]);
  const [newRow,     setNewRow]     = useState({});
  const [addingCol,  setAddingCol]  = useState(false);
  const [newColName, setNewColName] = useState('');

  const hasSlideshow = pageType.includes('slideshow');
  const hasPhoto     = pageType.includes('photo'); 
  const hasDesc  = pageType.includes('description');
  const hasPdf   = pageType === 'pdf-list';
  const hasTable = pageType.includes('table');

  const fetchData = async () => {
    setLoading(true);
    try {
      // fetch description/photo/pdf content
      const res = await axios.get(
        `${API}/facility-content`,
        { params: { section, category: subsection } }
      );
      const match = (res.data || [])[0] || {};
      setData(match);
      setEditDesc(match.description || '');

      // parse table from extra_data field
      if (hasTable && match.details) {
        try {
          const parsed = JSON.parse(match.details);
          if (parsed.columns) setColumns(parsed.columns);
          if (parsed.rows)    setRows(parsed.rows);
        } catch {
          setRows([]);
        }
      }
    } catch { setData({}); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [section, subsection]);

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
      await axios.put(`${API}/admin/facility-content`,
        {
          section,
          category: subsection,
          sub_category: '',
          details: JSON.stringify({ columns: cols, rows: tableRows })
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch { alert('Table save failed'); }
  };

  const handleAddRow = () => {
    if (!columns.some(col => (newRow[col] || '').trim())) return;
    const updated = [...rows, { ...newRow }];
    setRows(updated);
    setNewRow({});
    saveTable(columns, updated);
  };

  const handleDeleteRow = (idx) => {
    const updated = rows.filter((_, i) => i !== idx);
    setRows(updated);
    saveTable(columns, updated);
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
    const updatedCols = columns.filter(c => c !== col);
    const updatedRows = rows.map(r => { const c = { ...r }; delete c[col]; return c; });
    setColumns(updatedCols);
    setRows(updatedRows);
    saveTable(updatedCols, updatedRows);
  };

  // ── UPLOADS ──
  const handleImageUpload = async (e) => {
    const files = e.target.files; if (!files || files.length === 0) return;
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
    imageRef.current.value = '';
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
    const files = e.target.files; if (!files || files.length === 0) return;
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
    pdfRef.current.value = '';
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
      (hasPhoto || hasSlideshow) && (data.photo_url || data.photos?.length) && hasDesc
      ? photoAlign === 'center' ? '' : 'lg:grid-cols-3'
      : ''
  }`}>

    {/* SLIDESHOW */}
    {hasSlideshow && (
      <div className={`
        ${photoAlign === 'left'  ? 'lg:col-span-1 order-1' : ''}
        ${photoAlign === 'right' ? 'lg:col-span-1 order-2' : ''}
        ${photoAlign === 'center' ? 'lg:col-span-3' : ''}
      `}>
       <SlideshowBlock
        photos={data.photos || []}
        isAdmin={isAdmin}
        onDelete={handleDeletePhoto}
        height={slideshowHeight}
        maxWidth={slideshowMaxWidth}
      />
      </div>
    )}

    {/* SINGLE PHOTO */}
    {/* PHOTOS */}
    {hasPhoto && data.photos?.length > 0 && (
      <div className={`
        ${!hasDesc ? 'lg:col-span-3' : ''}
        ${hasDesc && photoAlign === 'left'  ? 'lg:col-span-1 order-1' : ''}
        ${hasDesc && photoAlign === 'right' ? 'lg:col-span-1 order-2' : ''}
        ${hasDesc && photoAlign === 'center' ? 'lg:col-span-3' : ''}
      `}>
        <div className={`grid gap-3 ${
                photoCols === 1 ? 'grid-cols-1' :
                photoCols === 3 ? 'grid-cols-1 sm:grid-cols-3' :
                'grid-cols-1 sm:grid-cols-2'
              }`}>
                {data.photos.map(photo => (
                  <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-blue-100">
                    <img src={`${API}${photo.photo_url}`} alt={photo.photo_name}
                      className="w-full object-cover" style={{ height: photoHeight, objectPosition: 'top center' }} />
                {isAdmin && (
                  <button onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    ✕ Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    {hasDesc && (
      <div className={`${
        (hasPhoto || hasSlideshow) && (data.photo_url || data.photos?.length)
          ? photoAlign === 'right' ? 'lg:col-span-2 order-1'
          : photoAlign === 'center' ? 'w-full'
          : 'lg:col-span-2 order-2'
          : 'lg:col-span-3'
      }`}>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 min-h-[180px]">
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      rows={8}
                      className="w-full p-4 border border-gray-200 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-[#174873]/20"
                      placeholder="Enter description, contact info, about this section..."
                    />
                    <div className="flex gap-3">
                      <button onClick={handleSave} disabled={saving}
                        className="px-4 py-2 bg-[#174873] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-gray-500 text-sm">Cancel</button>
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
                
                  const flushBullets = () => {
                    if (bulletBuffer.length > 0) {
                      elements.push(
                        <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 text-gray-700 text-base pl-2">
                          {bulletBuffer.map((b, i) => (
                            <li key={i}>{b}</li>
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
                if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
                  flushBullets();
                  elements.push(
                    <p key={idx} className="text-gray-800 font-semibold text-base text-left">
                      {trimmed.slice(2, -2)}
                    </p>
                  );
                  return;
                }

                // > Highlighted note / callout box
                if (trimmed.startsWith('> ')) {
                  flushBullets();
                  elements.push(
                      <div key={idx} className="bg-[#174873]/8 border-l-4 border-[#174873] pl-4 py-2 rounded-r-lg text-gray-700 italic text-sm">
                        {trimmed.slice(2)}
                      </div>
                    );
                    return;
                  }

                  // --- Divider line
                  if (trimmed === '---') {
                    flushBullets();
                    elements.push(<hr key={idx} className="border-gray-200 my-2" />);
                    return;
                  }

                  // Plain paragraph
                    flushBullets();
                    elements.push(
                      <p key={idx} className="text-gray-700 text-base leading-relaxed text-left">
                        {trimmed}
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
      
{data.pdfs?.length > 0 && (
  <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="bg-[#174873] px-6 py-4">
      <h2 className="text-lg font-semibold text-white">📄 Documents</h2>
    </div>

    <div className="divide-y divide-gray-200">
      {data.pdfs.map(pdf => (
        <div key={pdf.id} className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-4 flex-1">
            <svg
              className="w-6 h-6 text-red-500 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M8.5 3.5a2 2 0 0 1 4 0V4h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3.5a2 2 0 0 1 2-2zm0 2v-.5a.5.5 0 0 0-.5-.5.5.5 0 0 0-.5.5V5.5h1zm4 0v-.5a.5.5 0 0 0-.5-.5.5.5 0 0 0-.5.5V5.5h1z" />
            </svg>

            <div className="flex-1">
              
              <a  href={`${API}${pdf.pdf_url}`}
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
                    <td colSpan={columns.length + 2}
                      className="px-4 py-8 text-center text-gray-400 italic">
                      {isAdmin ? 'No rows yet. Add columns first, then add rows.' : 'No data available.'}
                    </td>
                  </tr>
                )}
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    {columns.map(col => (
                      <td key={col} className="px-4 py-3 text-gray-700">
                        {row[col]
                          ? row[col].startsWith('/uploads/') || row[col].startsWith('http')
                            ? 
                              (
                               <a href={row[col].startsWith('http') ? row[col] : `${API}${row[col]}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[#174873] hover:underline font-medium text-sm">
                                <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                                </svg>
                                View PDF
                              </a>
                              )
                            : row[col]
                          : '—'}
                      </td>
                    ))}
                    {isAdmin && <td />}
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteRow(idx)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold">Remove</button>
                      </td>
                    )}
                  </tr>
                ))}

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

                                    // Debug — remove after fixing
                                    console.log('Sending:', { section, subsection, fileName: file.name });
                                
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
                    {isAdmin && <td />}
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