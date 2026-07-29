import { useState, useEffect } from 'react';

const API = `http://${window.location.hostname}:8000`;

const SlideshowBlock = ({ photos, isAdmin, onDelete , height = 360, maxWidth = '100%' }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (photos.length === 0) return;
    const timer = setInterval(() =>
      setCurrent(p => (p + 1) % photos.length), 5000);
    return () => clearInterval(timer);
  }, [photos.length]);

  if (photos.length === 0) return (
    <div className="relative rounded-2xl overflow-hidden border border-blue-100"
       style={{ height: height, width: '100%', maxWidth: maxWidth }}>
      <p className="text-gray-400 italic text-sm">No photos yet.</p>
    </div>
  );

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-blue-100"
      style={{ height: height }}>

      {/* Photos */}
      {photos.map((photo, i) => (
        <img key={photo.id} src={`${API}${photo.photo_url}`}
          alt={photo.photo_name}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }} />
      ))}

      {/* Admin delete button for current photo */}
      {isAdmin && onDelete && (
        <button
          onClick={() => onDelete(photos[current].id)}
          className="absolute top-3 right-3 bg-red-600 text-white text-xs px-2 py-1 rounded z-10 hover:bg-red-700">
          ✕ Delete
        </button>
      )}

      {/* Prev / Next arrows */}
      <button
        onClick={() => setCurrent(p => (p - 1 + photos.length) % photos.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center z-10">
        ‹
      </button>
      <button
        onClick={() => setCurrent(p => (p + 1) % photos.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center z-10">
        ›
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10">
        {photos.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all
              ${i === current ? 'bg-white scale-125' : 'bg-white/50'}`} />
        ))}
      </div>
    </div>
  );
};

export default SlideshowBlock;