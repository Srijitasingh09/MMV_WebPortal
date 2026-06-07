import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#174873] text-white ">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">

        <div>
          <h3 className="text-lg font-semibold mb-3">
            Mahila Maha Vidyalaya
          </h3>
          <p className="text-blue-200 text-sm leading-relaxed">
            Women's College, Banaras Hindu University.
            Established in 1929 by Pandit Madan Mohan Malaviya.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2">
            <li><Link to="/about" className="text-blue-200 text-sm hover:text-white">About MMV</Link></li>
            <li><Link to="/notices" className="text-blue-200 text-sm hover:text-white">Notices</Link></li>
            <li><Link to="/academics" className="text-blue-200 text-sm hover:text-white">Academics</Link></li>
            <li><Link to="/contact" className="text-blue-200 text-sm hover:text-white">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Contact Us</h3>
          <ul className="space-y-2 text-blue-200 text-sm">
            <li>📍 MMV Campus, BHU, Varanasi — 221005</li>
            <li>📞 +91-XXXXX-XXXXX</li>
            <li>✉️ mmv@bhu.ac.in</li>
          </ul>
        </div>

      </div>

      <div className="border-t border-blue-800 py-3 text-center text-blue-300 text-xs">
        © 2026 Mahila Maha Vidyalaya, Banaras Hindu University. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;