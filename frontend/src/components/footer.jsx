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
    <footer className="bg-[#174873] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">

        {/* Col 1 — College blurb */}
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Mahila Maha Vidyalaya
          </h3>
          <p className="text-blue-200 text-sm leading-relaxed">
            Women's College, Banaras Hindu University.
            Established in 1929 by Pandit Madan Mohan Malaviya.
          </p>
        </div>

        {/* Col 2 — Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2">
            <li><Link to="/about"    className="text-blue-200 text-sm hover:text-white">About MMV</Link></li>
            <li><Link to="/notices"  className="text-blue-200 text-sm hover:text-white">Notices</Link></li>
            <li><Link to="/ai-assistant" className="text-blue-200 text-sm hover:text-white">AI assistant</Link></li>
            <li><Link to="/contact"  className="text-blue-200 text-sm hover:text-white">Contact Us</Link></li>
          </ul>
        </div>

        {/* Col 3 — Live contact info from API */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Contact Us</h3>
          {contactInfo ? (
            <ul className="space-y-2 text-blue-200 text-sm">
              {contactInfo.address && (
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">📍</span>
                  <span>{contactInfo.address}</span>
                </li>
              )}
              {contactInfo.phone && (
                <li className="flex items-center gap-2">
                  <span>📞</span>
                  <a
                    href={`tel:${contactInfo.phone.replace(/\s+/g, "")}`}
                    className="hover:text-white transition-colors"
                  >
                    {contactInfo.phone}
                  </a>
                </li>
              )}
              {contactInfo.email && (
                <li className="flex items-center gap-2">
                  <span>✉️</span>
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="hover:text-white transition-colors"
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
            // Subtle skeleton while loading / if fetch failed
            <ul className="space-y-2 text-blue-200 text-sm opacity-50">
              <li>📍 —</li>
              <li>📞 —</li>
              <li>✉️ —</li>
            </ul>
          )}
        </div>

      </div>

      <div className="border-t border-blue-800 py-3 text-center text-blue-300 text-[11px] sm:text-xs px-4">
        © 2026 Mahila Maha Vidyalaya, Banaras Hindu University. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;