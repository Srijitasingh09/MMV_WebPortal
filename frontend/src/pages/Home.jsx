import React from 'react';
import { Link } from 'react-router-dom';

// ─── Design tokens ────────────────────────────────────────────────────────────
// Navy   #0D1F3C   — institution authority, headings, dark surfaces
// Ivory  #FAF7F2   — warm background, alternating sections
// Terra  #C4561A   — BHU terracotta heritage accent, numbers, icons
// Gold   #E8C97A   — thin accent rules, subtle highlights
// White  #FFFFFF   — cards, clean surfaces
// Body   #1A1A1A   — near-black readable text

// ─── HERO ─────────────────────────────────────────────────────────────────────
const Hero = () => (
  <section className="relative w-full overflow-hidden h-[92vh] sm:h-[95vh] md:h-[105vh]">
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Lato:wght@300;400;600;700&display=swap');
      .font-cormorant { font-family: 'Mirava', 'Mirava Sans', 'Plus Jakarta Sans', 'Manrope', 'Montserrat', sans-serif; }
      .font-lato { font-family: 'Lato', sans-serif; }
      @keyframes fade-up {
        from { opacity: 0; transform: translateY(24px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .anim-fade-up { animation: fade-up 0.9s ease forwards; }
      .anim-fade-up-2 { animation: fade-up 0.9s 0.2s ease forwards; opacity: 0; }
      .anim-fade-up-3 { animation: fade-up 0.9s 0.4s ease forwards; opacity: 0; }
    `}</style>

    {/* Background image — right 60% */}
    <div className="absolute inset-0 right-0 w-full h-full">
      <img
        src="/bhu/web (3).png"
        alt="MMV Campus"
        className="w-full h-full object-cover object-center"
      />
      {/* Gradient overlay so left panel bleeds naturally */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, #0D1F3C 38%, #0D1F3C99 58%, transparent 80%)'
        }}
      />
    </div>

    {/* Left text panel */}
    <div className="relative z-10 h-full flex items-center">
      <div className="px-6 sm:px-10 md:px-20 max-w-xl">
        <div className="h-20 w-20 sm:h-28 sm:w-28 md:h-40 md:w-40 rounded-full overflow-hidden flex items-center justify-left">
          <img
            src="/bhu/mmv logo.png"
            alt="MMV Logo"
            className="h-20 w-20 sm:h-28 sm:w-28 md:h-40 md:w-40 rounded-full object-contain m-2 sm:m-3 md:m-4"
          />
        </div>

        {/* Eyebrow */}
        <p className="font-lato text-xl sm:text-3xl md:text-5xl tracking-[0.1em] sm:tracking-[0.18em] md:tracking-[0.25em] uppercase text-[#E8C97A] mb-3 sm:mb-4 md:mb-5 anim-fade-up">
          Mahila Maha Vidyalaya
        </p>
        <p className="font-lato text-sm sm:text-lg md:text-2xl tracking-[0.1em] sm:tracking-[0.18em] md:tracking-[0.25em] uppercase text-[#E8C97A] mb-3 sm:mb-4 md:mb-5 anim-fade-up">
         BHU · Est. 1929
        </p>

        {/* Gold rule */}
        <div className="w-12 h-px bg-[#E8C97A] mb-4 sm:mb-5 md:mb-6 anim-fade-up" />

        {/* Main heading */}
        <h1
          className="font-cormorant text-xl sm:text-2xl md:text-3xl font-medium text-white leading-tight mb-4 sm:mb-5 anim-fade-up-2"
          style={{ letterSpacing: '-0.01em' }}
        >
          Your Complete<br />
          <em className="not-italic text-[#E8C97A]">MMV Portal</em>
        </h1>

        {/* Subtext */}
        <p className="font-lato text-sm sm:text-[15px] text-blue-100 leading-relaxed mb-6 sm:mb-8 max-w-sm anim-fade-up-3">
          Syllabus, notices, administration, hostel, library —
          everything you need, in one place.
        </p>

        {/* CTA */}
        <div className="flex flex-wrap gap-3 anim-fade-up-3">
          <Link
            to="/ai-assistant"
            className="font-lato text-xs sm:text-sm font-semibold bg-[#C4561A] text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-full hover:bg-[#a34315] transition-colors"
          >
            Ask MMVerse AI →
          </Link>
          <a
            href="#about"
            className="font-lato text-xs sm:text-sm font-semibold border border-white/40 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-full hover:bg-white/10 transition-colors"
          >
            Explore Portal
          </a>
        </div>
      </div>
    </div>
  </section>
);


// ─── ABOUT ────────────────────────────────────────────────────────────────────
const About = () => (
  <section id="about" className="bg-[#FAF7F2] py-12 sm:py-20 px-4 sm:px-6">
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="text-center mb-8 sm:mb-14">
        <p className="font-lato font-semibold text-2xs tracking-[0.2em] uppercase text-[#7d311f] mb-2">
          About the Portal
        </p>
        <h2 className="font-cormorant text-2xl sm:text-4xl md:text-5xl font-semibold text-[#0f3358] mb-4 leading-snug">
          One Portal, Every Answer
        </h2>
        <div className="w-12 h-0.5 bg-[#d4af37] mx-auto mb-5" />
        <p className="font-lato text-xs sm:text-[17px] text-[#1A1A1A] leading-relaxed max-w-2xl mx-auto">
          The MMV Student Portal is the centralized information hub for all students of
          Mahila Maha Vidyalaya. Whether you need your syllabus, hostel details,
          administrative contacts, or the latest notices — it is all organized here.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
        {[
          ['1929', 'Year Established'],
          ['30+',  'Departments'],
          ['2,500+', 'Students Enrolled'],
          ['75+', 'Faculty Members'],
        ].map(([n, l]) => (
          <div
            key={l}
            className="bg-white rounded-xl py-4 sm:py-7 px-3 sm:px-5 text-center border-2 border-[#0f3358]/20 shadow-xs"
          >
            <div className="font-cormorant text-2xl sm:text-4xl md:text-5xl font-bold text-[#7d311f] mb-1">{n}</div>
            <div className="font-lato text-[10px] sm:text-xs text-[#0f3358] font-bold uppercase tracking-wider">{l}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);


// ─── FACILITIES HIGHLIGHT ─────────────────────────────────────────────────────
const facilities = [
  { label: 'Hostels',       detail: 'Five on-campus hostels with mess, security & Wi-Fi.' },
  { label: 'Libraries',     detail: 'MMV, Central & Cyber Library — 1 lakh+ books & digital access.' },
  { label: 'Sports',        detail: 'Courts, athletics track, gymnasium & sports ground' },
  { label: 'Health Centre', detail: 'On-campus medical facilities, Sir Sundarlal Hospital & Trauma Centre.' },
  { label: 'Canteen',       detail: 'Access to affordable, hygienic meals and snacks within the campus.' },
  { label: 'Computer Labs', detail: 'High-speed internet connectivity with well-equipped computer facilities.' },
  { label: 'Auditorium',    detail: 'Spacious halls and facilities for seminars, cultural programmes, and guest lectures.' },
  { label: 'Transport',     detail: 'BHU bus routes connecting all campus points.' },
];

const Facilities = () => (
  <section id="facilities" className="bg-[#EAEFF5] py-12 sm:py-16 px-4 sm:px-6 border-y border-slate-200">
    <div className="max-w-5xl mx-auto">

      <div className="text-center mb-8 sm:mb-12">
        <p className="font-lato text-2xs font-bold tracking-[0.2em] uppercase text-[#7d311f] mb-2">
          Campus Resources
        </p>
        <h2 className="font-cormorant text-2xl sm:text-4xl md:text-5xl font-bold text-[#0f3358] leading-snug mb-3">
          Facilities at MMV
        </h2>
        <div className="w-12 h-0.5 bg-[#d4af37] mx-auto mb-4" />
        <p className="font-lato text-xs sm:text-[16px] text-slate-600 leading-relaxed max-w-xl mx-auto">
          MMV provides a comprehensive range of campus facilities to support students'
          academic, physical, and personal well-being.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {facilities.map((f) => (
          <div
            key={f.label}
            className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-5 shadow-xs hover:border-[#d4af37] hover:shadow-md transition-all"
          >
            <div className="font-cormorant text-sm sm:text-lg font-bold text-[#0f3358] mb-1 sm:mb-2">
              {f.label}
            </div>
            <div className="font-lato text-[11px] sm:text-sm text-slate-600 leading-relaxed">{f.detail}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);


// ─── ACADEMICS FEATURE — Side-by-side on mobile ──────────────────────────────
const Academics = () => (
  <section id="academics" className="bg-[#FAF7F2] py-10 sm:py-16 px-4 sm:px-6 border-b border-slate-200/60">
    <div className="max-w-5xl mx-auto flex flex-row gap-3 sm:gap-8 items-center">

      {/* Photo left side on mobile & desktop */}
      <div className="w-1/3 sm:w-5/12 flex-shrink-0 rounded-xl overflow-hidden shadow-sm border border-slate-200">
        <img src="/bhu/academics.png" alt="Academics" className="w-full h-28 sm:h-72 md:h-80 object-cover" />
      </div>

      {/* Text right side on mobile & desktop */}
      <div className="w-2/3 sm:w-7/12 min-w-0 flex-1">
        <p className="font-lato text-[10px] sm:text-2xs font-bold tracking-[0.15em] uppercase text-[#7d311f] mb-1 sm:mb-2">
          Academics
        </p>
        <h2 className="font-cormorant text-lg sm:text-3xl md:text-4xl font-bold text-[#0f3358] mb-1 sm:mb-2 leading-snug">
          Academic Information
        </h2>
        <div className="w-8 h-0.5 bg-[#d4af37] mb-2 sm:mb-4" />
        <p className="font-lato text-xs sm:text-[16px] text-slate-700 leading-relaxed mb-3 sm:mb-5 line-clamp-3 sm:line-clamp-none">
          All academic resources for every department at MMV — semester syllabi,
          annual schedules, and contact details of section In-charge.
        </p>
        <ul className="space-y-1.5 sm:space-y-3">
          {[
            ['Syllabus',         'UG & PG semester syllabus.'],
            ['Annual Calendar',  'Exam list & holiday calendar.'],
            ['NEP 2020',         'Curriculum credit structure.'],
          ].map(([label, detail]) => (
            <li key={label} className="flex items-start gap-1.5 sm:gap-3 text-xs sm:text-[15px]">
              <span className="text-[#7d311f] font-bold flex-shrink-0">✦</span>
              <div className="font-lato text-slate-800">
                <span className="font-bold text-[#0f3358]">{label}: </span>
                <span className="hidden sm:inline">{detail}</span>
                <span className="sm:hidden text-[11px]">{detail}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);


// ─── ADMINISTRATION FEATURE — Side-by-side on mobile ─────────────────────────
const Administration = () => (
  <section id="administration" className="bg-[#EAEFF5] py-10 sm:py-16 px-4 sm:px-6 border-b border-slate-200/60">
    <div className="max-w-5xl mx-auto flex flex-row-reverse gap-3 sm:gap-8 items-center">

      {/* Photo right side on mobile & desktop */}
      <div className="w-1/3 sm:w-5/12 flex-shrink-0 rounded-xl overflow-hidden shadow-sm border border-slate-200">
        <img src="/bhu/admin.png" alt="Administration" className="w-full h-28 sm:h-72 md:h-80 object-cover" />
      </div>

      {/* Text left side on mobile & desktop */}
      <div className="w-2/3 sm:w-7/12 min-w-0 flex-1">
        <p className="font-lato text-[10px] sm:text-2xs font-bold tracking-[0.15em] uppercase text-[#7d311f] mb-1 sm:mb-2">
          Administration
        </p>
        <h2 className="font-cormorant text-lg sm:text-3xl md:text-4xl font-bold text-[#0f3358] mb-1 sm:mb-2 leading-snug">
          Governance & Leadership
        </h2>
        <div className="w-8 h-0.5 bg-[#d4af37] mb-2 sm:mb-4" />
        <p className="font-lato text-xs sm:text-[16px] text-slate-700 leading-relaxed mb-3 sm:mb-5 line-clamp-3 sm:line-clamp-none">
          Official information about the governance structure —
          Principal office, administrative departments, and institutional policies.
        </p>
        <ul className="space-y-1.5 sm:space-y-3">
          {[
            ["Principal's Office",        'Contact details & communications.'],
            ['Controller of Exam',        'Semester exam queries.'],
            ['Staff Directory',           'Teaching & admin staff directory.'],
          ].map(([label, detail]) => (
            <li key={label} className="flex items-start gap-1.5 sm:gap-3 text-xs sm:text-[15px]">
              <span className="text-[#7d311f] font-bold flex-shrink-0">✦</span>
              <div className="font-lato text-slate-800">
                <span className="font-bold text-[#0f3358]">{label}: </span>
                <span className="hidden sm:inline">{detail}</span>
                <span className="sm:hidden text-[11px]">{detail}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);


// ─── NOTICES FEATURE — Side-by-side on mobile ────────────────────────────────
const Notices = () => (
  <section id="notices" className="bg-[#FAF7F2] py-10 sm:py-16 px-4 sm:px-6 border-b border-slate-200/60">
    <div className="max-w-5xl mx-auto flex flex-row gap-3 sm:gap-8 items-center">

      {/* Photo left side on mobile & desktop */}
      <div className="w-1/3 sm:w-5/12 flex-shrink-0 rounded-xl overflow-hidden shadow-sm border border-slate-200">
        <img src="/bhu/notice.png" alt="Notices" className="w-full h-28 sm:h-72 md:h-80 object-cover" />
      </div>

      {/* Text right side on mobile & desktop */}
      <div className="w-2/3 sm:w-7/12 min-w-0 flex-1">
        <p className="font-lato text-[10px] sm:text-2xs font-bold tracking-[0.15em] uppercase text-[#7d311f] mb-1 sm:mb-2">
          Notices
        </p>
        <h2 className="font-cormorant text-lg sm:text-3xl md:text-4xl font-bold text-[#0f3358] mb-1 sm:mb-2 leading-snug">
          Announcements & Circulars
        </h2>
        <div className="w-8 h-0.5 bg-[#d4af37] mb-2 sm:mb-4" />
        <p className="font-lato text-xs sm:text-[16px] text-slate-700 leading-relaxed mb-3 sm:mb-5 line-clamp-3 sm:line-clamp-none">
          The official communication board of MMV — exam notifications,
          event schedules, fee deadlines, and urgent circulars.
        </p>
        <ul className="space-y-1.5 sm:space-y-3">
          {[
            ['Urgent Notices', 'Time-sensitive exam & fee updates.'],
            ['Examination',    'Schedule notifications & results.'],
            ['Circulars',      'Official orders from BHU & MMV.'],
          ].map(([label, detail]) => (
            <li key={label} className="flex items-start gap-1.5 sm:gap-3 text-xs sm:text-[15px]">
              <span className="text-[#7d311f] font-bold flex-shrink-0">✦</span>
              <div className="font-lato text-slate-800">
                <span className="font-bold text-[#0f3358]">{label}: </span>
                <span className="hidden sm:inline">{detail}</span>
                <span className="sm:hidden text-[11px]">{detail}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);


// ─── AI ASSISTANT ─────────────────────────────────────────────────────────────
const AIAssistant = () => (
  <section id="ai-assistant" className="bg-[#EAEFF5] py-12 sm:py-20 px-4 sm:px-6">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 sm:gap-10 md:gap-14 items-center">

      {/* Text */}
      <div className="md:w-7/12 w-full">
        <p className="font-lato text-2xs font-bold tracking-[0.2em] uppercase text-[#7d311f] mb-2">
          AI Assistant
        </p>
        <h2 className="font-cormorant text-2xl sm:text-4xl md:text-5xl font-bold text-[#0f3358] mb-2 leading-snug">
          Get Instant Answers with MMVerse
        </h2>
        <div className="w-12 h-0.5 bg-[#d4af37] mb-5" />
        <p className="font-lato text-xs sm:text-[17px] text-slate-700 leading-relaxed mb-6">
          MMVerse is a conversational AI assistant built specifically for MMV students.
          Instead of searching through multiple pages, simply type your question
          and get an accurate answer within seconds.
        </p>
        <ul className="space-y-3 mb-8">
          {[
            ['Natural Language',  'Ask in plain English — no keywords needed.'],
            ['Available 24/7',    'Get answers anytime, even outside office hours.'],
            ['MMV-Specific',      'Trained on MMV and BHU data, not generic answers.'],
          ].map(([label, detail]) => (
            <li key={label} className="flex items-start gap-3">
              <span className="text-[#7d311f] font-bold text-sm mt-0.5 flex-shrink-0">✦</span>
              <div className="font-lato text-xs sm:text-[16px] text-slate-800">
                <span className="font-bold text-[#0f3358]">{label}: </span>{detail}
              </div>
            </li>
          ))}
        </ul>
        <Link
          to="/ai-assistant"
          className="inline-block font-lato text-xs sm:text-sm font-bold bg-[#0f3358] text-[#fce8b2] border border-[#d4af37] px-6 sm:px-7 py-3 rounded-full hover:bg-[#174873] hover:text-white transition-all shadow-sm"
        >
          Open MMVerse AI →
        </Link>
      </div>

      {/* Chat preview — matches real MMVerse page colors 100% */}
      <div className="md:w-5/12 w-full max-w-sm sm:max-w-none mx-auto">
        <div className="bg-[#FAF7F2] rounded-2xl shadow-xl border-2 border-[#0D1F3C]/30 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2.5 sm:gap-3 bg-[#0D1F3C] px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-[#E3B94F]/40">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FBF1DA] ring-2 ring-[#E3B94F] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xs">
              <img src="/bhu/AI-icon.png" alt="MMVerse AI" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"
                onError={(e) => { e.target.style.display='none'; e.target.parentNode.innerText='🤖'; }} />
            </div>
            <div>
              <div className="font-lato text-sm sm:text-base font-bold text-white leading-none">MMVerse</div>
              <div className="font-lato text-2xs sm:text-xs text-[#E3B94F] mt-0.5 font-semibold">AI Campus Assistant</div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="font-lato text-2xs sm:text-xs text-[#FBF1DA] font-medium">Online</span>
            </div>
          </div>

          {/* Messages — exact real MMVerse bubble colors (#E5C29C & #0D1F3C) */}
          <div className="p-3.5 sm:p-4 space-y-2.5 sm:space-y-3 bg-[#FAF7F2]">
            {[
              { from: 'user', text: 'What are the Cyber Library timings?' },
              { from: 'bot',  text: 'The Cyber Library is open Monday–Saturday, 8:00 AM to 5:00 PM.' },
              { from: 'user', text: 'Where do I get my hostel allotment form?' },
              { from: 'bot',  text: 'Hostel allotment forms are available at the Hostel Office in MMV Campus.' },
            ].map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`font-lato text-xs sm:text-sm rounded-2xl px-3.5 sm:px-4 py-2.5 max-w-[85%] leading-relaxed shadow-xs
                  ${m.from === 'user'
                    ? 'bg-[#0D1F3C] text-white rounded-br-xs'
                    : 'bg-[#E5C29C] text-black font-medium rounded-bl-xs'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-2 bg-[#FAF7F2] border-t border-slate-200">
            <div className="flex gap-2">
              <div className="flex-1 bg-white rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 font-lato text-xs sm:text-sm text-slate-400 border-2 border-[#0D1F3C]/40">
                Ask a question...
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#C4561A] hover:bg-[#a3450f] rounded-xl flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow-xs">→</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
const Home = () => (
  <div className="font-lato">
    <Hero />
    <About />
    <Facilities />
    {/* <PortalSections /> */}
    <Academics />
    <Administration />
    <Notices />
    {/* <Facilities /> */}
    <AIAssistant />
  </div>
);

export default Home;