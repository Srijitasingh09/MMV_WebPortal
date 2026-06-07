import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

const Timetable = () => {
  const [userData, setUserData] = useState(null);
  const [timetablePdf, setTimetablePdf] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      const token = localStorage.getItem('token');
      try {
        const [userRes, pdfRes] = await Promise.all([
          axios.get('/user/me', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/timetable/pdf', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setUserData(userRes.data);
        setTimetablePdf(pdfRes.data || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, []);

  if (loading) {
    return <div className="text-sm text-muted">Loading timetable...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Academic Timetable PDF</h1>
          <p className="text-muted mt-1">{userData?.degree} • {userData?.course} • Year {userData?.current_year}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {timetablePdf?.pdf_url && (
          <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-blue-500 font-bold">Official Timetable PDF</p>
              <p className="text-sm text-blue-900 font-semibold mt-1">
                {timetablePdf.pdf_name || 'Timetable PDF'} • {timetablePdf.degree || userData?.degree} • {timetablePdf.branch || userData?.course} • Year {timetablePdf.year || userData?.current_year}
              </p>
            </div>
            <a
              href={`${API_BASE_URL}${timetablePdf.pdf_url}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold tracking-widest hover:bg-red-800 transition-colors"
            >
              OPEN PDF
            </a>
          </div>
        )}

        {!timetablePdf?.pdf_url && (
          <div className="text-center py-20 glass-card rounded-2xl">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-400">No timetable PDF uploaded for your branch/course yet</h3>
            <p className="text-sm text-gray-400">Please contact admin to upload timetable PDF for your degree, branch and year.</p>
          </div>
        )}
      </div>

      <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100">
        <h4 className="font-bold text-secondary mb-2 flex items-center">
            <Info size={16} className="mr-2" />
            Academic Note
        </h4>
        <p className="text-sm text-orange-800/70">
            Attendance is mandatory for all lab sessions. Please report to the department office in case of any discrepancy in your elective choices.
        </p>
      </div>
    </div>
  );
};

const Info = ({ size, className }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
)

export default Timetable;
