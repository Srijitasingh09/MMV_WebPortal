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
        // Silently fail — footer contact is non-critical
      }
    };
    fetchContact();
  }, []);

  return (
    <footer className="bg-[#0f3358] text-slate-200 border-t-2 border-[#d4af37]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">

        {/* Col 1 — College blurb */}
        <div>
          <h3 className="text-lg font-bold font-cinzel text-white mb-3 tracking-wide">
            Mahila Maha Vidyalaya
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed font-sans-official">
            Women's College, Banaras Hindu University.
            Established in 1929 by Pandit Madan Mohan Malaviya.
          </p>
        </div>

        {/* Col 2 — Quick Links */}
        <div>
          <h3 className="text-lg font-bold font-cinzel text-white mb-3 tracking-wide">Quick Links</h3>
          <ul className="space-y-2 font-sans-official">
            <li><Link to="/about" className="text-slate-300 text-sm hover:text-[#d4af37] transition-colors">About MMV</Link></li>
            <li><Link to="/notices" className="text-slate-300 text-sm hover:text-[#d4af37] transition-colors">Notices &amp; Circulars</Link></li>
            <li><Link to="/ai-assistant" className="text-slate-300 text-sm hover:text-[#d4af37] transition-colors">AI Assistant</Link></li>
            <li><Link to="/contact" className="text-slate-300 text-sm hover:text-[#d4af37] transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        {/* Col 3 — Live contact info from API */}
        <div>
          <h3 className="text-lg font-bold font-cinzel text-white mb-3 tracking-wide">Contact Us</h3>
          {contactInfo ? (
            <ul className="space-y-2.5 text-slate-300 text-sm font-sans-official">
              {contactInfo.address && (
                <li className="flex items-start gap-2.5">
                  <span className="text-[#d4af37] mt-0.5">📍</span>
                  <span>{contactInfo.address}</span>
                </li>
              )}
              {contactInfo.phone && (
                <li className="flex items-center gap-2.5">
                  <span className="text-[#d4af37]">📞</span>
                  <a
                    href={`tel:${contactInfo.phone.replace(/\s+/g, "")}`}
                    className="hover:text-[#d4af37] transition-colors"
                  >
                    {contactInfo.phone}
                  </a>
                </li>
              )}
              {contactInfo.email && (
                <li className="flex items-center gap-2.5">
                  <span className="text-[#d4af37]">✉️</span>
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="hover:text-[#d4af37] transition-colors"
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
            <ul className="space-y-2 text-slate-400 text-sm opacity-50 font-sans-official">
              <li>📍 —</li>
              <li>📞 —</li>
              <li>✉️ —</li>
            </ul>
          )}
        </div>

      </div>

      <div className="border-t border-[#174873] py-4 text-center text-slate-400 text-xs px-4 font-sans-official">
        © 2026 Mahila Maha Vidyalaya, Banaras Hindu University. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;