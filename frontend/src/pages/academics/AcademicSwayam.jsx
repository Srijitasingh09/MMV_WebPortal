import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const API_BASE_URL = `http://${window.location.hostname}:8000`;

const AcademicSwayam = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ description: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/academics/swayam`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Failed to fetch Swayam data", error);
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

      <div>
        <h1 className="text-3xl font-bold text-primary">Swayam Courses</h1>
      </div>

      <div className="bg-blue-50 rounded-2xl p-8 border-2 border-secondary">
        <div className="text-primary whitespace-pre-wrap leading-relaxed">
          {data.description || "No description provided."}
        </div>
      </div>
    </div>
  );
};

export default AcademicSwayam;
