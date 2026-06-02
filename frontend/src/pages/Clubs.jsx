import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Sparkles } from 'lucide-react';

const Clubs = () => {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await axios.get('/clubs');
        setItems(res.data || []);
      } catch (err) {
        console.error('Error fetching clubs/events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
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

  const visibleItems = filter === 'All' ? items : items.filter((item) => (item.type || '').toLowerCase() === filter.toLowerCase());

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center">
            <Users className="mr-3 text-secondary" />
            Clubs and Events
          </h1>
          <p className="text-muted mt-1">Discover student communities, events, and co-curricular opportunities.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-gray-100">
          {['All', 'Club', 'Event'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === tab ? 'bg-primary text-white' : 'text-muted hover:bg-gray-50'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-muted">Loading clubs and events...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleItems.map((item) => (
          <article
            key={item.id}
            onClick={() => trackClick(`club_${item.id}`)}
            className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <span className="text-[10px] font-bold px-3 py-1 bg-primary/5 text-primary rounded-full uppercase tracking-widest">
              {item.type || 'Club'}
            </span>
            <h3 className="text-xl font-bold mt-4">{item.name}</h3>
            <p className="text-sm text-muted mt-2 leading-relaxed">{item.description}</p>
            {(item.type || '').toLowerCase() === 'event' && (
              <div className="mt-3 text-xs text-muted">
                Date: {item.event_date || 'TBA'} | Time: {item.event_time || 'TBA'} | Venue: {item.venue || 'TBA'}
              </div>
            )}
            <div className="mt-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tags</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Array.isArray(item.tags) ? item.tags : []).map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 bg-orange-50 text-secondary rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-5 p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-muted">
              <Sparkles size={14} className="inline mr-1 text-secondary" />
              Contact: {item.contact_person || 'Student Affairs Desk'}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Clubs;
