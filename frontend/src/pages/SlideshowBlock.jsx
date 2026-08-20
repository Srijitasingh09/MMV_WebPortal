import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SlideshowBlock = ({ photos, isAdmin, onDelete, height = 360, maxWidth = '100%' }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (photos.length === 0) return;
    const timer = setInterval(() =>
      setCurrent(p => (p + 1) % photos.length), 5000);
    return () => clearInterval(timer);
  }, [photos.length]);

  const numHeight = typeof height === 'number' ? height : parseInt(height, 10) || 360;

  if (photos.length === 0) return (
    <div
      className="relative rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center p-6 bg-slate-50 mx-auto"
      style={{
        height: height,
        width: '100%',
        maxWidth: maxWidth
      }}
    >
      <p className="text-gray-400 italic text-sm">No photos yet.</p>
    </div>
  );

  return (
    <div
      className="slideshow-box relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-xs transition-all duration-300 mx-auto"
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        maxWidth: maxWidth || '100%'
      }}
    >
      <style>{`
        @media (max-width: 767px) {
          .slideshow-box {
            height: clamp(200px, 45vh, ${numHeight}px) !important;
          }
        }
      `}</style>

      {/* Photos */}
      {photos.map((photo, i) => (
        <img
          key={photo.id}
          src={`${API}${photo.photo_url}`}
          alt={photo.photo_name || 'Slideshow photo'}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 max-w-full"
          style={{ opacity: i === current ? 1 : 0 }}
        />
      ))}

      {/* Admin delete button for current photo */}
      {isAdmin && onDelete && photos[current] && (
        <button
          onClick={() => onDelete(photos[current].id)}
          className="absolute top-3 right-3 bg-red-600/90 hover:bg-red-700 text-white text-xs px-2.5 py-1 rounded-md z-20 shadow-md font-medium"
        >
          ✕ Delete
        </button>
      )}

      {/* Prev / Next arrows */}
      <button
        onClick={() => setCurrent(p => (p - 1 + photos.length) % photos.length)}
        aria-label="Previous photo"
        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center z-10 transition-colors shadow-md text-lg"
      >
        ‹
      </button>
      <button
        onClick={() => setCurrent(p => (p + 1) % photos.length)}
        aria-label="Next photo"
        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center z-10 transition-colors shadow-md text-lg"
      >
        ›
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-1.5 sm:gap-2 z-10 px-2">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300
              ${i === current ? 'w-5 sm:w-6 bg-white shadow-md' : 'w-2 bg-white/60 hover:bg-white/90'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default SlideshowBlock;