import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── ABOUT PAGE CONFIG - tweak these freely ────────────────────────────
// Once the page has loaded, how long to wait before automatically
// navigating to /home (ms).
const ABOUT_CONTENT_AUTO_REDIRECT_MS = 20000;

const AboutSarthi = () => {
  const navigate = useNavigate();

  // Progress fraction (0 to 1) and seconds remaining for UI display
  const [progressFraction, setProgressFraction] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(
    Math.ceil(ABOUT_CONTENT_AUTO_REDIRECT_MS / 1000)
  );

  const isNavigatingRef = useRef(false);

  // Auto-redirect handler (can also be triggered manually via button)
  const handleProceed = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    navigate('/home');
  };

  // ── Bulletproof Auto-redirect & continuous progress timer based on Date.now() ──
  // Using Date.now() guarantees the loader NEVER freezes or stops even if the tab
  // loses focus, drops frames, or undergoes re-renders.
  useEffect(() => {
    const startTime = Date.now();

    const intervalId = setInterval(() => {
      if (isNavigatingRef.current) return;

      const elapsed = Date.now() - startTime;
      const fraction = Math.min(elapsed / ABOUT_CONTENT_AUTO_REDIRECT_MS, 1);
      
      setProgressFraction(fraction);
      setSecondsRemaining(Math.max(0, Math.ceil((ABOUT_CONTENT_AUTO_REDIRECT_MS - elapsed) / 1000)));

      if (fraction >= 1) {
        isNavigatingRef.current = true;
        clearInterval(intervalId);
        navigate('/home');
      }
    }, 25); // Continuous 40fps tick tied directly to wall-clock time

    return () => clearInterval(intervalId);
  }, [navigate]);

  return (
    <main className="relative min-h-screen bg-white text-gray-800 overflow-x-hidden font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Eczar&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;600;700&display=swap');
        .font-yatra { font-family: 'Eczar', serif; }

        @keyframes mmvHeaderShimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .header-loader-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
          animation: mmvHeaderShimmer 1.4s ease-in-out infinite;
        }
      `}</style>

      {/* ── Background Watermark (Fixed behind content) ── */}
      <img
        src="/bhu/SarthiWatermark.jpeg"
        alt="Mahila Mahavidyalaya Emblem Watermark"
        aria-hidden="true"
        className="pointer-events-none select-none fixed inset-0 m-auto h-auto w-[85%] sm:w-[70%] md:w-[55%] max-w-3xl opacity-[0.2] object-contain z-0 scale-120"
      />

      {/*
        ── Official Institutional Header Bar (Non-Sticky, Scrolls with page) ──
        Integrated auto-redirect progress loader bar right inside the header!
      */}
      <header className="relative z-20 bg-primary text-white py-3 sm:py-3.5 px-3 sm:px-6 lg:px-10 border-b-2 border-[#D4AF37]/80 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-center sm:text-left text-xs sm:text-sm">
          
          {/* Left: Institutional Title */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
            <span className="font-semibold tracking-wide text-amber-200 uppercase text-[11px] sm:text-xs md:text-sm">
              Banaras Hindu University 
            </span>
            <span className="text-gray-200 font-semibold uppercase text-[11px] sm:text-xs md:text-sm">
             | Mahila Mahavidyalaya 
            </span>
          </div>

          {/* Right: Header Integrated Loader Widget with Progress Bar & Skip Button */}
          <div className="flex items-center gap-2 sm:gap-3 bg-black/25 px-3 sm:px-4 py-1.5 rounded-full border border-[#D4AF37]/60 shadow-inner">
            <span className="text-amber-200 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              MMV सारथी ({secondsRemaining}s)
            </span>

            {/* Embedded Header Loading Bar (Continuous time-synced width) */}
            <div className="w-20 sm:w-32 h-2 sm:h-2.5 rounded-full bg-white/20 overflow-hidden relative header-loader-shimmer">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-[#D4AF37] to-amber-200 transition-all duration-75 ease-linear rounded-full"
                style={{ width: `${progressFraction * 100}%` }}
              />
            </div>

            {/* Skip Button */}
            <button
              onClick={handleProceed}
              aria-label="Skip timer and go directly to home"
              className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-[#D4AF37] hover:bg-amber-300 text-primary font-extrabold text-[10px] sm:text-xs rounded-full shadow transition-all duration-150 active:scale-95 cursor-pointer uppercase tracking-wider whitespace-nowrap"
            >
              Skip →
            </button>
          </div>

        </div>

        {/* Header Bottom Edge Full-Width Animated Loading Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-[#D4AF37] to-amber-100 transition-all duration-75 ease-linear shadow-[0_0_10px_#D4AF37]"
            style={{ width: `${progressFraction * 100}%` }}
          />
        </div>
      </header>

      {/* ── Main Content Flow (Full Width on Mobile, Covers Whole Page) ── */}
      <div className="relative z-10 max-w-8xl mx-auto pl-4 sm:pl-8 md:pl-12 lg:pl-32 pr-4 sm:pr-8 md:pr-12 lg:pr-32 py-6 sm:py-10 space-y-4 sm:space-y-6">

        {/* Header Section */}
        <section className="space-y-1.5 pb-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-primary tracking-tight">
            About MMV <span className="font-yatra">सारथी</span>
          </h1>
          <div className="h-0.5 w-32 sm:w-56 bg-gradient-to-r from-primary via-[#D4AF37] to-transparent rounded-full ml" />
        </section>

        {/* Intro Narrative */}
        <p className="text-gray-800 text-sm sm:text-base md:text-lg leading-snug sm:leading-relaxed text-justify">
          <strong className="font-semibold text-primary">MMV <span className="font-yatra">सारथी</span></strong> is a student-focused website created to make life at Mahila Mahavidyalaya easier and more informed. It brings essential information about <strong className="font-semibold text-primary">academics, administration, facilities, departments, and services</strong> together in one place, while keeping students updated with the latest <strong className="font-semibold text-primary">college news and notices</strong>.
        </p>

        {/* The Purpose Behind "Sarthi" */}
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold text-primary">
            The Purpose Behind "<span className="font-yatra">सारथी</span>"
          </h2>
          <p className="text-gray-800 text-sm sm:text-base md:text-lg leading-snug sm:leading-relaxed text-justify">
            The name <strong className="font-semibold text-primary">"<span className="font-yatra">सारथी</span>"</strong> represents a guide and companion. Just as a <span className="font-yatra">सारथी</span> guides a traveller through their journey, MMV <span className="font-yatra">सारथी</span> supports students from helping freshers understand their new college to assisting existing students with everyday information.
          </p>
        </div>

        {/* Closing Promise Quote */}
        <p className="text-primary text-sm sm:text-base md:text-lg font-serif font-semibold italic py-2 text-center border-y border-amber-900/15">
          More than just a website, MMV <span className="font-yatra">सारथी</span> is a guide, a companion, and a reliable source of information so that no student has to navigate her MMV journey alone.
        </p>

        {/* Dedicated Team Blurb */}
        <div className="space-y-1.5 text-center pb-1">
          <h3 className="text-3xl sm:text-4xl md:text-4xl font-serif font-bold text-primary tracking-tight">
            सह-सृजन
          </h3>
          <h3 className="text-xl sm:text-2xl md:text-2xl font-serif font-bold text-primary tracking-tight">
            (Our Team)
          </h3>
          <div className="h-0.5 w-24 sm:w-42 mx-auto bg-gradient-to-r from-primary via-[#D4AF37] to-transparent rounded-full mt-2" />
        </div>

        {/* ── Closing Institutional Photo Feature (4:3 Aspect Ratio) ── */}
        <figure className="pt-2 sm:pt-4 flex flex-col items-center">
          <div 
            className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-gray-50 aspect-[4/3]"
            style={{ aspectRatio: '4 / 3' }}
          >
            <img
              src="/bhu/teamphoto.jpeg"
              alt="MMV सारथी Team and Mahila Mahavidyalaya Campus"
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          {/* Center-aligned caption */}
          <figcaption className="mt-2.5 text-xs sm:text-sm md:text-base text-gray-600 text-center italic font-medium max-w-2xl mx-auto leading-normal">
            <b>From Left to Right:</b> Anutosh Shikher Saroj (Research Scholar); Supriya Mishra (B.Sc. Computer Science); Prof. Rakhi Garg (Professor); Roshni Kumari Kushwaha (B.Sc. Computer Science); Varsha Kumari (B.Sc. Computer Science); Srijita Singh (B.Sc. Computer Science).
            <br/><b>Department of Computer Science, MMV, BHU.</b>
          </figcaption>
        </figure>

        <div className="space-y-1">
          <p className="text-gray-800 text-sm sm:text-base md:text-lg leading-snug sm:leading-relaxed text-justify">
            Behind MMV <span className="font-yatra">सारथी</span> is a dedicated team that brings together <strong className="font-semibold text-primary">creativity, technical skills, and fresh ideas</strong>, working together to create a platform that makes every student's MMV journey <strong className="font-semibold text-primary">simpler, smoother, and more informed</strong>.
          </p>
        </div>

        {/* Official Footer Strip */}
        <footer className="pt-4 sm:pt-6 border-t border-gray-200 text-center text-[11px] sm:text-xs md:text-sm text-gray-500 space-y-1">
          <p>&copy; {new Date().getFullYear()} Mahila Mahavidyalaya, Banaras Hindu University. All rights reserved.</p>
          <p>MMV <span className="font-yatra">सारथी</span> - Official Student Advisory & Information Portal</p>
        </footer>

      </div>
    </main>
  );
};

export default AboutSarthi;