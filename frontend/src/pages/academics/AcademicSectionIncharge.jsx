import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
const API_BASE_URL = `http://${window.location.hostname}:8000`;

const categories = ["Science", "Social Science", "Arts"];
const toSlug = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const fromSlug = (slug) => categories.find(c => toSlug(c) === slug) || null;

const parseTableData = (description) => {
  try {
    const parsed = JSON.parse(description || '{}');
    if (parsed && parsed.columns && parsed.rows) {
      return { columns: parsed.columns, rows: parsed.rows };
    }
    if (Array.isArray(parsed)) {
      const cols = parsed.length > 0 ? Object.keys(parsed[0]) : [];
      return { columns: cols, rows: parsed };
    }
    return { columns: [], rows: [] };
  } catch { return { columns: [], rows: [] }; }
};

const AcademicSectionIncharge = () => {
  const navigate = useNavigate();
  const { category: catSlug } = useParams();
  const activeCategory = catSlug ? fromSlug(catSlug) : null;
  const [tableColumns, setTableColumns] = useState([]);
  const [tableRows, setTableRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeCategory) { setLoading(false); return; }
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/academics/section-incharge/${activeCategory}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const result = await response.json();
          const td = parseTableData(result.description);
          setTableColumns(td.columns);
          setTableRows(td.rows);
        } else {
          setTableColumns([]); setTableRows([]);
        }
      } catch (error) {
        console.error("Failed to fetch section in-charge data", error);
        setTableColumns([]); setTableRows([]);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [activeCategory]);

  // Show category grid if no category selected
  if (!catSlug) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
        <button onClick={() => navigate('/academics')}
          className="flex items-center text-sm font-medium text-primary hover:text-secondary transition-colors">
          ← Back to Academics
        </button>
        <div><h1 className="text-3xl font-bold text-primary">Section In-Charge</h1></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <button key={cat} onClick={() => navigate(`/academics/section-incharge/${toSlug(cat)}`)}
              className="bg-blue-50 p-6 rounded-2xl border-2 border-secondary hover:shadow-md hover:bg-blue-100/50 transition-all text-left flex flex-col group h-[120px] justify-center">
              <h3 className="text-xl font-bold text-primary group-hover:text-secondary transition-colors">{cat}</h3>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      <button onClick={() => navigate('/academics/section-incharge')}
        className="flex items-center text-sm font-medium text-primary hover:text-secondary transition-colors">
        ← Back to Section In-Charge
      </button>
      <div><h1 className="text-3xl font-bold text-primary">Section In-Charge — {activeCategory}</h1></div>

      <div className="bg-blue-50 rounded-2xl border-2 border-secondary overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div></div>
        ) : tableColumns.length === 0 ? (
          <div className="p-8 text-center text-muted italic">No table configured yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary text-white">
                  {tableColumns.map(col => <th key={col} className="px-4 py-3 text-left font-semibold">{col}</th>)}
                </tr>
              </thead>
              <tbody>
                {tableRows.length === 0 ? (
                  <tr><td colSpan={tableColumns.length} className="px-4 py-8 text-center text-muted italic">No data available.</td></tr>
                ) : (
                  tableRows.map((row, idx) => (
                    <tr key={idx} className="border-t border-secondary/20 hover:bg-blue-100/50 transition-colors">
                      {tableColumns.map(col => <td key={col} className="px-4 py-3 text-primary">{row[col] || '-'}</td>)}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicSectionIncharge;
