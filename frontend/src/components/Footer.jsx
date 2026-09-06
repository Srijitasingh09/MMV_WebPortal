import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Footer = () => {
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const res = await fetch(`${API_BASE}/contact-info`);
        if (!res.ok) return;
        const data = await res.json();
        setContactInfo(data);
      } catch {
        // Silently fail -footer contact is non-critical
      }
    };
    fetchContact();
  }, []);

  return (
    <footer className="bg-primary text-slate-200 border-t-2 border-[#d4af37]">
      {/* Grid: 2 columns on mobile, 3 columns on tablet/desktop */}
     <div
      className="  max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-2  gap-6 sm:gap-8 md:grid-cols-[auto_1.4fr_1fr_1fr] ">

      {/* First section - Logo + College Details */}
      <div className="col-span-2 md:col-span-2 flex items-start gap-4 sm:gap-5">
  
        {/* Logo */}
        <div className="shrink-0">
          <img
            src="/bhu/mmvlogo.jpeg"
            alt="MMV Logo"
            className="h-20 sm:h-20 w-auto rounded-lg object-contain"
          />
        </div>

        {/* College Details */}
        <div>
          <h3 className="text-base sm:text-lg font-bold font-cinzel text-white mb-2 sm:mb-3 tracking-wide">
          Mahila Mahavidyalaya
          </h3>
      
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-sans-official max-w-sm">
          Women's College, Banaras Hindu University.
          Established in 1929 by Pandit Madan Mohan Malaviya.
          </p>
        </div>

        </div>
        {/* Col 2 -Quick Links (Side-by-side with Contact Us on mobile) */}
        <div className="col-span-1">
          <h3 className="text-base sm:text-lg font-bold font-cinzel text-white mb-2 sm:mb-3 tracking-wide">Quick Links</h3>
          <ul className="space-y-1.5 sm:space-y-2 font-sans-official">
            <li><Link to="/Academics" className="text-slate-300 text-xs sm:text-sm hover:text-[#d4af37] transition-colors">Academics</Link></li>
            <li><Link to="/notices" className="text-slate-300 text-xs sm:text-sm hover:text-[#d4af37] transition-colors">Notices &amp; Circulars</Link></li>
            <li><Link to="/News" className="text-slate-300 text-xs sm:text-sm hover:text-[#d4af37] transition-colors">News</Link></li>
            <li><Link to="/contact" className="text-slate-300 text-xs sm:text-sm hover:text-[#d4af37] transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        {/* Col 3 -Contact Us (Side-by-side with Quick Links on mobile) */}
        <div className="col-span-1">
          <h3 className="text-base sm:text-lg font-bold font-cinzel text-white mb-2 sm:mb-3 tracking-wide">Contact Us</h3>
          {contactInfo ? (
            <ul className="space-y-2 sm:space-y-2.5 text-slate-300 text-xs sm:text-sm font-sans-official">
              {contactInfo.address && (
                <li className="flex items-start gap-1.5 sm:gap-2.5">
                  <span className="text-[#d4af37] mt-0.5 shrink-0">📍</span>
                  <span className="break-words">{contactInfo.address}</span>
                </li>
              )}
              {contactInfo.phone && (
                <li className="flex items-center gap-1.5 sm:gap-2.5">
                  <span className="text-[#d4af37] shrink-0">📞</span>
                  <a
                    href={`tel:${contactInfo.phone.replace(/\s+/g, "")}`}
                    className="hover:text-[#d4af37] transition-colors break-all"
                  >
                    {contactInfo.phone}
                  </a>
                </li>
              )}
              {contactInfo.email && (
                <li className="flex items-center gap-1.5 sm:gap-2.5">
                  <span className="text-[#d4af37] shrink-0">✉️</span>
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="hover:text-[#d4af37] transition-colors break-all"
                  >
                    {contactInfo.email}
                  </a>
                </li>
              )}
              {!contactInfo.address && !contactInfo.phone && !contactInfo.email && (
                <li className="italic opacity-60">Contact info not yet added.</li>
              )}
            </ul>
          ) : (
            <ul className="space-y-2 text-slate-400 text-xs sm:text-sm opacity-50 font-sans-official">
              <li>📍 -</li>
              <li>📞 -</li>
              <li>✉️ -</li>
            </ul>
          )}
        </div>

      </div>

      <div className="border-t border-[#174873] py-4 text-center text-slate-400 text-xs px-4 font-sans-official">
        © 2026 Mahila Mahavidyalaya, Banaras Hindu University. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;