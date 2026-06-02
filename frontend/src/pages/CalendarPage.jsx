import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CalendarPage = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/calendar', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDocuments(res.data);
      } catch (err) {
        console.error("Error fetching calendar documents:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const academicCalendars = documents.filter(doc => doc.type === 'academic');
  const holidayLists = documents.filter(doc => doc.type === 'holiday');

  const openPdf = (url) => {
    const fullUrl = url.startsWith('http') ? url : `http://localhost:8000${url}`;
    window.open(fullUrl, '_blank');
  };

  const sections = [
    { key: 'academic', title: 'Academic Calendar' },
    { key: 'holiday', title: 'Holiday List' },
  ];

  // Show grid of subsection boxes
  if (!activeSection) {
    return (
      <div className="p-8 max-w-6xl mx-auto animation-fade-in h-full overflow-y-auto custom-scrollbar">
        <button onClick={() => navigate('/')}
          className="mb-6 flex items-center text-sm font-medium text-primary hover:text-secondary transition-colors">
          ← Back to Dashboard
        </button>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">College Calendar</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((sec) => (
            <button key={sec.key} onClick={() => setActiveSection(sec.key)}
              className="bg-blue-50 p-6 rounded-2xl border-2 border-secondary hover:shadow-md hover:bg-blue-100/50 transition-all text-left flex flex-col group h-[120px] justify-center">
              <h3 className="text-xl font-bold text-primary group-hover:text-secondary transition-colors">{sec.title}</h3>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentDocs = activeSection === 'academic' ? academicCalendars : holidayLists;
  const sectionTitle = activeSection === 'academic' ? 'Academic Calendar' : 'Holiday List';

  return (
    <div className="p-8 max-w-6xl mx-auto animation-fade-in h-full overflow-y-auto custom-scrollbar">
      <button onClick={() => setActiveSection(null)}
        className="mb-6 flex items-center text-sm font-medium text-primary hover:text-secondary transition-colors">
        ← Back to College Calendar
      </button>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">{sectionTitle}</h1>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto"></div>
        </div>
      ) : (
        <div className="bg-blue-50 p-8 rounded-2xl border-2 border-secondary min-h-[300px]">
          <div className="space-y-4">
            {currentDocs.length === 0 ? (
              <p className="text-muted text-sm italic text-center py-8">No documents available at the moment.</p>
            ) : (
              currentDocs.map(doc => (
                <div key={doc.id} onClick={() => openPdf(doc.pdf_url)}
                  className="p-4 border border-secondary/20 bg-white rounded-2xl flex items-center justify-between hover:bg-blue-100 transition-all cursor-pointer">
                  <div>
                    <p className="font-bold text-primary">{doc.pdf_name}</p>
                    <p className="text-xs text-muted mt-1">Uploaded: {new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
