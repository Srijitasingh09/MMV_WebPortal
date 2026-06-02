import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// ============================================
// SLIDESHOW SECTION
// Cycles through college photos automatically
// ============================================
const slides = [
  {
    image: '/mmvimage.jpeg',
    caption: 'Mahila Maha Vidyalaya — Est. 1929',
    position: 'center center',
  },
  {
    image: '/mmvimage2.jpeg',
    caption: 'Women\'s College, Banaras Hindu University',
    position:'center center',
  },
  {
    image: '/mmvimage3.jpeg',
    caption: 'A Legacy of Excellence in Women\'s Education',
    position: 'center center',
  },
];

const Slideshow = () => {
  // currentIndex tells us which photo is showing right now
  const [currentIndex, setCurrentIndex] = useState(0);

  // useEffect runs code when component loads
  // Here it sets up a timer that changes the slide every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      // % slides.length makes it loop back to 0 after last slide
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4000);

    // cleanup — stops the timer when component is removed
    return () => clearInterval(timer);
  }, []);

  return (
    
    <div style={{position: 'relative', width: '100%', height: '400px'}}>

      <img
        src={slides[currentIndex].image}
        alt={slides[currentIndex].caption}
       style={{
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: slides[currentIndex].position,
}}
      />

      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}>
        <h2 style={{color: 'white', fontSize: '28px', fontWeight: '600'}}>
          {slides[currentIndex].caption}
        </h2>
        <p style={{color: 'white', fontSize: '14px', marginTop: '8px'}}>
          Empowering Women Through Education
        </p>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
      }}>
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: index === currentIndex ? 'white' : 'rgba(255,255,255,0.5)',
              border: 'none',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

    </div>
  );
  
};


// ============================================
// ABOUT SECTION
// College description with info
// ============================================
const AboutSection = () => {
  return (
    <div className="bg-white py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-10 items-center">

        {/* LEFT — Photo */}
        <div className="md:w-1/2">
          <img
            src="/mmvimage3.jpeg"
            alt="MMV Building"
            className="rounded-lg shadow-md w-full object-cover h-72"
          />
        </div>

        {/* RIGHT — Text */}
        <div className="md:w-1/2">
          <h2 className="text-2xl font-semibold text-[#174873] mb-4">
            About Mahila Maha Vidyalaya
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Mahila Maha Vidyalaya (MMV), the Women's College of Banaras Hindu 
            University, was established in 1929 by Pandit Madan Mohan Malaviya 
            to promote higher education and empowerment of women.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mt-3">
            Located within the BHU campus in Varanasi, the college was founded 
            with the vision of providing quality education and equal opportunities 
            to women. MMV offers undergraduate, postgraduate, and research programs 
            in various disciplines.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mt-3">
            The college focuses on academic excellence, skill development, research, 
            cultural activities, sports, and personality development — nurturing 
            confident, knowledgeable, and socially responsible women.
          </p>
         
        </div>

      </div>
    </div>
  );
};


// ============================================
// QUICK LINKS SECTION
// Cards linking to important pages
// ============================================
const quickLinks = [
  { title: 'Notices', desc: 'Latest announcements and updates', path: '/notices', icon: '📋' },
  { title: 'Academics', desc: 'Syllabus, timetable and NEP', path: '/academics', icon: '📚' },
  { title: 'Facilities', desc: 'Hostels, library, sports and more', path: '/facilities', icon: '🏛️' },
  { title: 'AI Assistant', desc: 'Get instant answers to your questions', path: '/ai-assistant', icon: '🤖' },
];

const QuickLinks = () => {
  return (
    <div className="bg-gray-50 py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold text-[#174873] mb-6 text-center">
          Quick Access
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="bg-white rounded-lg p-5 shadow-sm border border-gray-100
                         hover:shadow-md hover:border-[#406BC7] transition-all duration-200
                         text-center group"
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <h3 className="text-[#174873] font-medium text-sm group-hover:text-[#406BC7]">
                {item.title}
              </h3>
              <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};


// ============================================
// FOOTER
// Contact info at the bottom of every page
// ============================================
const Footer = () => {
  return (
    <footer className="bg-[#174873] text-white mt-10">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Column 1 — About */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Mahila Maha Vidyalaya</h3>
          <p className="text-blue-200 text-sm leading-relaxed">
            Women's College, Banaras Hindu University. 
            Established in 1929 by Pandit Madan Mohan Malaviya.
          </p>
        </div>

        {/* Column 2 — Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2">
            <li><Link to="/about" className="text-blue-200 text-sm hover:text-white">About MMV</Link></li>
            <li><Link to="/notices" className="text-blue-200 text-sm hover:text-white">Notices</Link></li>
            <li><Link to="/academics" className="text-blue-200 text-sm hover:text-white">Academics</Link></li>
            <li><Link to="/contact" className="text-blue-200 text-sm hover:text-white">Contact Us</Link></li>
          </ul>
        </div>

        {/* Column 3 — Contact */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Contact Us</h3>
          <ul className="space-y-2 text-blue-200 text-sm">
            <li>📍 MMV Campus, BHU, Varanasi — 221005</li>
            <li>📞 +91-XXXXX-XXXXX</li>
            <li>✉️ mmv@bhu.ac.in</li>
          </ul>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="border-t border-blue-800 py-3 text-center text-blue-300 text-xs">
        © 2026 Mahila Maha Vidyalaya, Banaras Hindu University. All rights reserved.
      </div>

    </footer>
  );
};


// ============================================
// MAIN HOME PAGE
// Puts all sections together
// ============================================
const Home = () => {
  return (
    <div>
      <Slideshow />
      <QuickLinks />
      <AboutSection />
      <Footer />
    </div>
  );
};

export default Home;
