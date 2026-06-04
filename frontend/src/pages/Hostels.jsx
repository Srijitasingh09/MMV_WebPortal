import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Building2, FileText } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

const HOSTELS = [
  'Kirti Kunj Hostel',
  'Kundan Devi Hostel',
  'Jyoti Kunj Hostel',
  'Swasti Kunj Hostel',
  'Pragya Kunj Hostel',
];

const Hostels = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHostelDocs = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get('/hostels', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDocs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        setDocs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHostelDocs();
  }, []);

  const docMap = useMemo(() => {
    const map = new Map();
    docs.forEach((row) => map.set((row.hostel_name || '').toLowerCase(), row));
    return map;
  }, [docs]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <Building2 className="mr-3 text-secondary" />
          Hostel Documents
        </h1>
        <p className="text-muted mt-1">Hostel-wise PDF notices and information uploaded by admin.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading hostel documents...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {HOSTELS.map((hostel) => {
            const doc = docMap.get(hostel.toLowerCase());
            return (
              <div key={hostel} className="glass-card rounded-2xl p-6 border border-gray-100">
                <p className="text-lg font-bold text-gray-900">{hostel}</p>
                {doc?.pdf_url ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-muted">PDF: {doc.pdf_name || 'Hostel document'}</p>
                    <a
                      href={`${API_BASE_URL}${doc.pdf_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold tracking-widest hover:bg-red-800"
                    >
                      <FileText size={14} className="mr-2" />
                      OPEN PDF
                    </a>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-gray-400">No PDF uploaded yet.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Hostels;
