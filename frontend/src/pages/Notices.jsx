import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { mmvNotices } from '../data/mmvInfo';

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

const Notices = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await axios.get('/notices');
        const apiNotices = Array.isArray(response.data) ? response.data : [];
        setNotices(apiNotices.length > 0 ? apiNotices : mmvNotices);
      } catch (err) {
        console.error("Error fetching notices:", err);
        setNotices(mmvNotices);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  const trackClick = async (resourceId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }
    try {
      await axios.post('/recommendations/track-click', {
        resource_id: resourceId,
        event_type: 'click',
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Tracking failed:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <button onClick={() => navigate('/')}
        className="flex items-center text-sm font-medium text-primary hover:text-secondary transition-colors">
        ← Back to Dashboard
      </button>

      <div>
        <h1 className="text-3xl font-bold text-primary">Notice Board</h1>
      </div>

      <div className="space-y-4">
        {notices.map(notice => (
          <div
            key={notice.id}
            onClick={() => trackClick(`not_${notice.id}`)}
            className="p-8 rounded-2xl bg-white border-2 border-secondary hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                notice.category === 'Exam' ? 'bg-blue-50 text-primary' : 
                notice.category === 'Holiday' ? 'bg-blue-100 text-secondary' : 'bg-blue-50 text-primary'
              }`}>
                {notice.category}
              </span>
              <div className="flex items-center text-xs text-muted font-medium">
                {notice.created_at ? new Date(notice.created_at).toLocaleDateString() : notice.date}
              </div>
            </div>
            <h3 className="text-xl font-bold mb-3 text-primary">{notice.title}</h3>
            <p className="text-muted leading-relaxed">{notice.content}</p>
            {notice.attachment_url && (
              <div className="mt-6 pt-6 border-t border-secondary/20 flex justify-end">
                <a
                  href={`${API_BASE_URL}${notice.attachment_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-bold text-secondary hover:underline tracking-wide"
                >
                  {notice.attachment_name ? `OPEN ${notice.attachment_name}` : 'OPEN ATTACHMENT'}
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notices;
