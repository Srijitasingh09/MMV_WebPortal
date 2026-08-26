import React from 'react';
import { Link } from 'react-router-dom';

const AboutSarthi = () => {
  return (
    <main className="relative min-h-screen bg-white text-gray-800 overflow-x-hidden font-sans">

      {/* ── Background Watermark (Fixed behind content) ── */}
      <img
        src="/bhu/SarthiWatermark.jpeg"
        alt="Mahila Mahavidyalaya Emblem Watermark"
        aria-hidden="true"
        className="pointer-events-none select-none fixed inset-0 m-auto h-auto w-[85%] sm:w-[70%] md:w-[55%] max-w-3xl opacity-[0.16] object-contain z-0"
      />

      {/* ── Official Institutional Top Bar Header ── */}
      <header className="relative z-20 bg-[#0f3358] text-white py-2.5 sm:py-3 px-3 sm:px-6 lg:px-10 border-b-2 border-[#D4AF37]/80 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-4 text-center sm:text-left text-xs sm:text-sm">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
            <span className="font-semibold tracking-wide text-amber-200 uppercase text-[11px] sm:text-xs md:text-sm">
              Banaras Hindu University 
            </span>
            <span className="text-gray-200 font-semibold uppercase text-[11px] sm:text-xs md:text-sm">
             | Mahila Mahavidyalaya 
            </span>
          </div>
          {/* <div className="text-gray-300 text-[10px] sm:text-xs tracking-wider uppercase font-medium">
            Official Student Guidance & Information Portal
          </div> */}
        </div>
      </header>

      {/* ── Floating / Scrolling Right Glassy Button ── */}
      <Link
        to="/home"
        aria-label="Enter MMV Sarthi Portal — Click to proceed to main site"
        className="fixed top-12 sm:top-20 md:top-16 right-3 sm:right-6 md:right-10 lg:right-12 z-40 group flex flex-col items-center justify-center bg-[#0f3358]/80 hover:bg-[#7d311f]/90 backdrop-blur-lg text-white px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-2xl sm:rounded-3xl border-2 border-[#D4AF37]/80 hover:border-[#D4AF37] shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 whitespace-nowrap text-center leading-tight ring-1 ring-white/20"
      >
        <span className="text-amber-200 font-bold text-sm sm:text-base tracking-wide drop-shadow-sm">
          जिज्ञासा
        </span>
        <span className="text-xs sm:text-sm font-semibold text-gray-100 flex items-center gap-1 mt-0.5">
          Click Here!!
          <span className="group-hover:translate-x-1 transition-transform duration-200 text-amber-300">→</span>
        </span>
      </Link>

      {/* ── Main Content Flow (Full Width on Mobile, Covers Whole Page) ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-6 sm:py-10 space-y-4 sm:space-y-6">

        {/* Header Section */}
        <section className="space-y-1.5 pb-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#0f3358] tracking-tight">
            About MMV Sarthi
          </h1>
          <div className="h-0.5 w-24 sm:w-32 bg-gradient-to-r from-[#0f3358] via-[#D4AF37] to-transparent rounded-full" />
        </section>

        {/* Intro Narrative */}
        <p className="text-gray-800 text-sm sm:text-base md:text-lg leading-snug sm:leading-relaxed text-justify">
          <strong className="font-semibold text-[#0f3358]">MMV Sarthi</strong> is a student-focused website created to make life at Mahila Mahavidyalaya easier and more informed. It brings essential information about <strong className="font-semibold text-[#0f3358]">academics, administration, facilities, departments, and services</strong> together in one place, while keeping students updated with the latest <strong className="font-semibold text-[#0f3358]">college news and notices</strong>.
        </p>

        {/* The Purpose Behind "Sarthi" */}
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold text-[#0f3358]">
            The Purpose Behind "Sarthi"
          </h2>
          <p className="text-gray-800 text-sm sm:text-base md:text-lg leading-snug sm:leading-relaxed text-justify">
            The name <strong className="font-semibold text-[#0f3358]">“Sarthi”</strong> represents a guide and companion. Just as a Sarthi guides a traveller through their journey, MMV Sarthi supports students from helping freshers understand their new college to assisting existing students with everyday information.
          </p>
        </div>

        {/* Closing Promise Quote */}
        <p className="text-[#0f3358] text-sm sm:text-base md:text-lg font-serif font-semibold italic py-2 text-center border-y border-amber-900/15">
          More than just a website, MMV Sarthi is a guide, a companion, and a reliable source of information so that no student has to navigate her MMV journey alone.
        </p>

        {/* Dedicated Team Blurb */}
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg md:text-xl font-serif font-bold text-[#0f3358]">
            सह-सृजन: Our Team
          </h3>
          <p className="text-gray-800 text-sm sm:text-base md:text-lg leading-snug sm:leading-relaxed text-justify">
            Behind MMV Sarthi is a dedicated team that brings together <strong className="font-semibold text-[#0f3358]">creativity, technical skills, and fresh ideas</strong>, working together to create a platform that makes every student’s MMV journey <strong className="font-semibold text-[#0f3358]">simpler, smoother, and more informed</strong>.
          </p>
        </div>

        {/* ── Closing Institutional Photo Feature (4:3 Aspect Ratio) ── */}
        <figure className="pt-2 sm:pt-4 flex flex-col items-center">
          <div 
            className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-gray-50 aspect-[4/3]"
            style={{ aspectRatio: '4 / 3' }}
          >
            <img
              src="/bhu/teamphoto2.jpeg"
              alt="MMV Sarthi Team and Mahila Mahavidyalaya Campus"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <figcaption className="mt-2 text-xs sm:text-sm md:text-base text-gray-600 text-center italic font-medium">
           <b>From Left to Right:</b> Anutosh Shikher Saroj (Research Scholar); Supriya Mishra (B.Sc. Student); Prof. Rakhi Garg (Professor); Roshni Kumari Kushwaha (B.Sc. Student); Varsha Kumari (B.Sc. Student); Srijita Singh (B.Sc. Student).
          </figcaption>
        </figure>

        {/* Official Footer Strip */}
        <footer className="pt-4 sm:pt-6 border-t border-gray-200 text-center text-[11px] sm:text-xs md:text-sm text-gray-500 space-y-1">
          <p>&copy; {new Date().getFullYear()} Mahila Mahavidyalaya, Banaras Hindu University. All rights reserved.</p>
          <p>MMV Sarthi - Official Student Advisory & Information Portal</p>
        </footer>

      </div>
    </main>
  );
};

export default AboutSarthi;