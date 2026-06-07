import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Landmark, FileText } from 'lucide-react';
import { mmvCollegeCards } from '../data/mmvInfo';

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

const CollegeInfo = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollegeInfo = async () => {
      try {
        const res = await axios.get('/college-info');
        setCards(res.data || []);
      } catch (err) {
        console.error('Error fetching college info:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCollegeInfo();
  }, []);

  const visibleCards = cards.length > 0 ? cards : mmvCollegeCards;

  return (
    <div className="space-y-8">
      <section className="bhu-gradient text-white rounded-3xl p-10 shadow-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">College Information</p>
        <h1 className="text-4xl font-bold mt-2">Mahila Mahavidyalaya (MMV)</h1>
        <p className="mt-4 text-white/85 max-w-3xl leading-relaxed">
          This section provides verified MMV hostel and campus information sourced from official notices,
          including administration contacts, operations updates, and student activity highlights.
        </p>
      </section>

      {loading && <p className="text-sm text-muted">Loading college information...</p>}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {visibleCards.map((card) => (
          <article key={card.id || card.title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            {card.image_url && (
              card.image_url.toLowerCase().endsWith('.pdf') ? (
                <a
                  href={`${API_BASE_URL}${card.image_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center w-full h-44 bg-blue-50 border border-blue-100 rounded-xl mb-4 text-blue-600 font-bold hover:bg-blue-100 transition-colors"
                >
                  <FileText size={40} className="mr-3" />
                  OPEN PDF
                </a>
              ) : (
                <img
                  src={`${API_BASE_URL}${card.image_url}`}
                  alt={card.title}
                  className="w-full h-44 object-cover rounded-xl mb-4"
                />
              )
            )}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Landmark size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted font-bold">{card.category || 'General'}</p>
                <h2 className="text-lg font-bold text-gray-900">{card.title}</h2>
              </div>
            </div>
            <p className="text-sm text-muted leading-relaxed">{card.description || card.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
};

export default CollegeInfo;
