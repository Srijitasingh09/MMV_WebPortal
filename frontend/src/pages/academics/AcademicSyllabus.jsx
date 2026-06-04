import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
const API_BASE_URL = `http://${window.location.hostname}:8000`;

const categories = ["Science", "Social Science", "Arts"];
const toSlug = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const fromSlug = (slug) => categories.find(c => toSlug(c) === slug) || null;

const AcademicSyllabus = () => {
  const navigate = useNavigate();
  const { category: catSlug } = useParams();
  const activeCategory = catSlug ? fromSlug(catSlug) : null;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeCategory) { setLoading(false); return; }
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/academics/syllabus/${activeCategory}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) setData(await response.json());
      } catch (error) { console.error("Failed to fetch syllabus data", error); }
      finally { setLoading(false); }
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
        <div><h1 className="text-3xl font-bold text-primary">Syllabus</h1></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <button key={cat} onClick={() => navigate(`/academics/syllabus/${toSlug(cat)}`)}
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
      <button onClick={() => navigate('/academics/syllabus')}
        className="flex items-center text-sm font-medium text-primary hover:text-secondary transition-colors">
        ← Back to Syllabus
      </button>
      <div><h1 className="text-3xl font-bold text-primary">Syllabus — {activeCategory}</h1></div>

      <div className="bg-blue-50 rounded-2xl p-8 border-2 border-secondary min-h-[300px]">
        {loading ? (
          <div className="flex justify-center items-center h-full pt-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div></div>
        ) : (
          <div>
            {data.length === 0 ? (
              <div className="text-center py-12"><p className="text-muted">No syllabus documents uploaded for {activeCategory} yet.</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.map((item) => (
                  <a key={item.id} href={`${API_BASE_URL}${item.pdf_url}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center p-4 bg-white rounded-xl hover:bg-blue-100 transition-colors border border-secondary/20">
                    <div className="flex-1 min-w-0"><h3 className="font-semibold text-primary truncate">{item.pdf_name}</h3></div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicSyllabus;
