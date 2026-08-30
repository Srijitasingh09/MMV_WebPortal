import React from 'react';
import { Link } from 'react-router-dom';

const AboutSarthi = () => {
  return (
    <main className="relative min-h-screen bg-white text-gray-800 overflow-x-hidden font-sans">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Eczar&display=swap');
        .font-yatra { font-family: 'Eczar', serif; }
      `}</style>

      {/* ── Background Watermark (Fixed behind content) ── */}
      <img
        src="/bhu/SarthiWatermark.jpeg"
        alt="Mahila Mahavidyalaya Emblem Watermark"
        aria-hidden="true"
        className="pointer-events-none select-none fixed inset-0 m-auto h-auto w-[85%] sm:w-[70%] md:w-[55%] max-w-3xl opacity-[0.2] object-contain z-0 scale-120"
      />

      {/* ── Official Institutional Top Bar Header ── */}
      <header className="relative z-20 bg-primary text-white py-2.5 sm:py-3 px-3 sm:px-6 lg:px-10 border-b-2 border-[#D4AF37]/80 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-4 text-center sm:text-left text-xs sm:text-sm">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
            <span className="font-semibold tracking-wide text-amber-200 uppercase text-[11px] sm:text-xs md:text-sm">
              Banaras Hindu University 
            </span>
            <span className="text-gray-200 font-semibold uppercase text-[11px] sm:text-xs md:text-sm">
             | Mahila Mahavidyalaya 
            </span>
          </div>
        </div>
      </header>

      {/* ── Floating / Scrolling Right Glassy Button ── */}
      <Link
        to="/home"
        aria-label="Enter MMV Sarthi Portal — Click to proceed to main site"
        className="fixed top-12 md:top-16 right-2 sm:right-4 md:right-5 lg:right-5 z-40 group flex flex-col items-center justify-center bg-primary/80 hover:bg-[#7d311f]/90 active:bg-[#7d311f]/90 backdrop-blur-lg text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full border-2 border-[#D4AF37]/80 hover:border-[#D4AF37] active:border-[#D4AF37] shadow-lg hover:shadow-xl active:shadow-xl transition-all duration-300 hover:scale-105 active:scale-105 whitespace-nowrap text-center leading-tight ring-1 ring-white/20">
        {/* ── Fixed Size Circle Wrapper (overflow-hidden clips zoomed image) ── */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 mb-0.5 rounded-full overflow-hidden flex items-center justify-center">
          <img
            src="/bhu/sarthi1.jpeg"
            alt="Jigyasa Icon"
          
            className="w-full h-full object-cover scale-125 group-hover:scale-135 group-active:scale-135 transition-transform duration-200"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <span className="text-amber-200 font-bold text-xs sm:text-sm tracking-wide drop-shadow-sm">
          जिज्ञासा
        </span>
        <span className="text-[10px] sm:text-xs font-semibold text-gray-100">
          Click Here!!
        </span>
      </Link>

      {/* ── Main Content Flow (Full Width on Mobile, Covers Whole Page) ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-6 sm:py-10 space-y-4 sm:space-y-6">

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
            (Team)
          </h3>
          <div className="h-0.5 w-24 sm:w-32 mx-auto bg-gradient-to-r from-primary via-[#D4AF37] to-transparent rounded-full mt-2" />
          
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
            Behind MMV <span className="font-yatra">सारथी</span> is a dedicated team that brings together <strong className="font-semibold text-primary">creativity, technical skills, and fresh ideas</strong>, working together to create a platform that makes every student’s MMV journey <strong className="font-semibold text-primary">simpler, smoother, and more informed</strong>.
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