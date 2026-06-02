import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const API_BASE_URL = `http://${window.location.hostname}:8000`;

const AcademicNEP = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ description: "", pdf_url: null, pdf_name: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/academics/nep`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Failed to fetch NEP data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      <button onClick={() => navigate('/academics')}
        className="flex items-center text-sm font-medium text-primary hover:text-secondary transition-colors">
        ← Back to Academics
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">National Education Policy (NEP)</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-blue-50 rounded-2xl p-8 border-2 border-secondary">
          <div className="text-primary whitespace-pre-wrap leading-relaxed">
            {data.description || "No description provided."}
          </div>
        </div>

        {data.pdf_url && (
          <div className="bg-blue-50 rounded-2xl p-8 border-2 border-secondary">
            <h2 className="text-xl font-bold text-primary mb-4">Document</h2>
            <a 
              href={`${API_BASE_URL}${data.pdf_url}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors border border-secondary/20"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-primary">{data.pdf_name}</h3>
              </div>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicNEP;
