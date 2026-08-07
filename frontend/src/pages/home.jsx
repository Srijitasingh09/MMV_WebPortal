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
  <section className="relative w-full overflow-hidden" style={{ height: '105vh' }}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Lato:wght@300;400;600;700&display=swap');
      .font-cormorant { font-family: 'Cormorant Garamond', serif; }
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
      <div className="px-10 md:px-20 max-w-xl">
        <div className="h-40 w-40 rounded-full overflow-hiddenflex items-center justify-left">
          <img
            src="/bhu/mmv logo.png"
            alt="MMV Logo"
            className="h-40 w-40 rounded-full object-contain m-4"
          />
        </div>

        {/* Eyebrow */}
        <p className="font-lato text-4xl md:text-5xl tracking-[0.25em] uppercase text-[#E8C97A] mb-5 anim-fade-up">
          Mahila Maha Vidyalaya
        </p>
        <p className="font-lato text-xl md:text-2xl tracking-[0.25em] uppercase text-[#E8C97A] mb-5 anim-fade-up">
         BHU · Est. 1929
        </p>

        {/* Gold rule */}
        <div className="w-12 h-px bg-[#E8C97A] mb-6 anim-fade-up" />

        {/* Main heading */}
        <h1
          className="font-cormorant text-2xl md:text-3xl font-medium text-white leading-tight mb-5 anim-fade-up-2"
          style={{ letterSpacing: '-0.01em' }}
        >
          Your Complete<br />
          <em className="not-italic text-[#E8C97A]">MMV Portal</em>
        </h1>

        {/* Subtext */}
        <p className="font-lato text-[15px] text-blue-100 leading-relaxed mb-8 max-w-sm anim-fade-up-3">
          Syllabus, notices, administration, hostel, library —
          everything you need, in one place.
        </p>

        {/* CTA */}
        <div className="flex gap-3 anim-fade-up-3">
          <Link
            to="/ai-assistant"
            className="font-lato text-sm font-semibold bg-[#C4561A] text-white px-6 py-3 rounded-full hover:bg-[#a34315] transition-colors"
          >
            Ask MMVerse AI →
          </Link>
          <a
            href="#about"
            className="font-lato text-sm font-semibold border border-white/40 text-white px-6 py-3 rounded-full hover:bg-white/10 transition-colors"
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
  <section id="about" className="bg-[#FAF7F2] py-20 px-6">
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="text-center mb-14">
        <p className="font-lato font-semibold text-2xs tracking-[0.2em] uppercase text-[#C4561A] mb-3">
          About the Portal
        </p>
        <h2 className="font-cormorant text-4xl md:text-5xl font-semibold text-[#0D1F3C] mb-5 leading-snug">
          One Portal, Every Answer
        </h2>
        <div className="w-10 h-px bg-[#E8C97A] mx-auto mb-6" />
        <p className="font-lato text-[17px] text-[#1A1A1A] leading-relaxed max-w-2xl mx-auto">
          The MMV Student Portal is the centralized information hub for all students of
          Mahila Maha Vidyalaya. Whether you need your syllabus, hostel details,
          administrative contacts, or the latest notices — it is all organized here.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          ['1929', 'Year Established'],
          ['30+',  'Departments'],
          ['2,500+', 'Students Enrolled'],
          ['200+', 'Faculty Members'],
        ].map(([n, l]) => (
          <div
            key={l}
            className="bg-[#FFDEA9] rounded-2xl py-8 px-5 text-center border border-[#0D1F3C]/10"
          >
            <div className="font-cormorant text-5xl font-semibold text-[#C4561A] mb-1">{n}</div>
            <div className="font-lato text-2xs text-[#0D1F3C] font-semibold uppercase tracking-wider">{l}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);


// ─── WHAT'S IN THE PORTAL — 3-column feature grid ─────────────────────────────
const portalSections = [
  {
    eyebrow: 'Academics',
    heading: 'Syllabi, Exams & NEP',
    body: 'Download UG & PG syllabi for every department. Find exam schedules, NEP 2020 credit structure, academic calendar, and SWAYAM course details.',
    icon: '📚',
    href: '/academics/nep',
  },
  {
    eyebrow: 'Administration',
    heading: 'Offices & Key Contacts',
    body: 'Principal, Dean, Vice Chancellor, Student Advisor, Chief Proctor — profiles, contact numbers, and office details for every administrative role.',
    icon: '🏛️',
    href: '/administration/principal',
  },
  {
    eyebrow: 'Notices',
    heading: 'Latest Announcements',
    body: 'Stay updated with exam notifications, fee deadlines, admission windows, and urgent circulars from MMV and BHU administration.',
    icon: '📢',
    href: '/Notices',
  },
  {
    eyebrow: 'Hostels',
    heading: 'Hostel Life & Wardens',
    body: 'Details for all five MMV hostels — Chief Warden, Hostel Coordinator, room types, and warden contacts for Jyoti Kunj, Kirti Kunj, and more.',
    icon: '🏠',
    href: '/facilities/hostels/chiefwarden',
  },
  {
    eyebrow: 'Library',
    heading: 'Books, OPAC & Hours',
    body: 'MMV Library, BHU Central Library, and Cyber Library — collection size, borrowing rules, staff contacts, and digital access details.',
    icon: '📖',
    href: '/facilities/library/mmvlibrary',
  },
  {
    eyebrow: 'Medical & Sports',
    heading: 'Health & Campus Life',
    body: 'Sir Sundarlal Hospital, Trauma Centre, Health Centre, Gymnasium, and Sports Board — facilities, timings, and contact information.',
    icon: '⚕️',
    href: '/facilities/medical/health',
  },
];

const PortalSections = () => (
  <section className="bg-white py-20 px-6">
    <div className="max-w-5xl mx-auto">

      <div className="text-center mb-14">
        <p className="font-lato font-semibold text-2xs tracking-[0.2em] uppercase text-[#C4561A] mb-3">
          What's Inside
        </p>
        <h2 className="font-cormorant text-4xl md:text-5xl font-semibold text-[#0D1F3C] leading-snug mb-4">
          Everything Organized for You
        </h2>
        <div className="w-10 h-px bg-[#E8C97A] mx-auto" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {portalSections.map((s) => (
          <Link
            key={s.eyebrow}
            to={s.href}
            className="group bg-[#FFD9BF] rounded-2xl p-7 border border-transparent hover:border-[#0D1F3C]/20 hover:bg-white hover:shadow-md transition-all duration-200"
          >
            <div className="text-3xl mb-4">{s.icon}</div>
            <p className="font-lato text-xs font-semibold tracking-[0.18em] uppercase text-[#C4561A] mb-1 font-semibold">
              {s.eyebrow}
            </p>
            <h3 className="font-cormorant text-2xl font-semibold text-[#0D1F3C] mb-3 leading-snug group-hover:text-[#0D1F3C] transition-colors">
              {s.heading}
            </h3>
            <p className="font-lato text-[15px] text-[#1A1A1A] leading-relaxed">
              {s.body}
            </p>
            <div className="mt-4 font-lato text-2xs font-semibold text-[#C4561A] group-hover:underline">
              View section →
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);


// ─── FACILITIES HIGHLIGHT ─────────────────────────────────────────────────────
const facilities = [
  { label: 'Hostels',       detail: 'Five on-campus hostels with mess, security & Wi-Fi.' },
  { label: 'Libraries',     detail: 'MMV, Central & Cyber Library — 1 lakh+ books & digital access.' },
  { label: 'Sports',        detail: 'Courts, athletics track, gymnasium & yoga centre.' },
  { label: 'Health Centre', detail: 'On-campus doctor, Sir Sundarlal Hospital & Trauma Centre.' },
  { label: 'Canteen',       detail: 'Subsidised meals and snacks within the campus.' },
  { label: 'Computer Labs', detail: 'High-speed internet, licensed software & printing.' },
  { label: 'Auditorium',    detail: 'Seminars, cultural programmes & guest lectures.' },
  { label: 'Transport',     detail: 'BHU bus routes connecting all campus points.' },
];

const Facilities = () => (
  <section id="facilities" className="bg-[#0D1F3C] py-20 px-6">
    <div className="max-w-5xl mx-auto">

      <div className="text-center mb-14">
        <p className="font-lato text-2xs font-semibold tracking-[0.2em] uppercase text-[#E8C97A] mb-3">
          Campus Resources
        </p>
        <h2 className="font-cormorant text-5xl md:text-5xl font-semibold text-white leading-snug mb-4">
          Facilities at MMV
        </h2>
        <div className="w-10 h-px bg-[#E8C97A] mx-auto mb-5" />
        <p className="font-lato text-[16px] text-blue-200 leading-relaxed max-w-xl mx-auto">
          MMV provides a comprehensive range of campus facilities to support students'
          academic, physical, and personal well-being.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {facilities.map((f) => (
          <div
            key={f.label}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors"
          >
            <div className="font-cormorant text-lg font-semibold text-[#E8C97A] mb-2">
              {f.label}
            </div>
            <div className="font-lato text-sm text-white leading-relaxed">{f.detail}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);


// ─── ACADEMICS FEATURE ────────────────────────────────────────────────────────
const Academics = () => (
  <section id="academics" className="bg-[#FAF7F2] py-20 px-6">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-14 items-center">

      <div className="md:w-5/12 w-full rounded-2xl overflow-hidden shadow-sm">
        <img src="/bhu/academics.png" alt="Academics" className="w-full h-80 object-cover" />
      </div>

      <div className="md:w-7/12 w-full">
        <p className="font-lato text-2xs font-semibold tracking-[0.2em] uppercase text-[#C4561A] mb-3 font-semibold">
          Academics
        </p>
        <h2 className="font-cormorant text-5xl font-semibold text-[#0D1F3C] mb-2 leading-snug">
          Academic Information
        </h2>
        <div className="w-8 h-px bg-[#E8C97A] mb-5" />
        <p className="font-lato text-[17px] text-[#1A1A1A] leading-relaxed mb-6">
          All academic resources for every department at MMV — semester syllabi,
          examination schedules, and updates related to the NEP 2020 curriculum,
          organized by department for easy navigation.
        </p>
        <ul className="space-y-3">
          {[
            ['Syllabus',         'Semester syllabus for all UG & PG programmes.'],
            ['Annual Calendar',  'Holiday list and academic calendar updated each semester.'],
            ['Exam Schedule',    'Internal assessment and university examination date sheets.'],
            ['NEP 2020',         'Revised curriculum details and credit structure.'],
          ].map(([label, detail]) => (
            <li key={label} className="flex items-start gap-3">
              <span className="text-[#C4561A] font-bold mt-0.5 flex-shrink-0">➥</span>
              <div className="font-lato text-[16px] text-[#1A1A1A]">
                <span className="font-semibold">{label}: </span>{detail}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);


// ─── ADMINISTRATION FEATURE ───────────────────────────────────────────────────
const Administration = () => (
  <section id="administration" className="bg-white py-20 px-6">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row-reverse gap-14 items-center">

      <div className="md:w-5/12 w-full rounded-2xl overflow-hidden shadow-sm">
        <img src="/bhu/admin.png" alt="Administration" className="w-full h-80 object-cover" />
      </div>

      <div className="md:w-7/12 w-full">
        <p className="font-lato text-2xs font-semibold tracking-[0.2em] uppercase text-[#C4561A] mb-3 font-semibold">
          Administration
        </p>
        <h2 className="font-cormorant text-5xl font-semibold text-[#0D1F3C] mb-2 leading-snug">
          College Administration & Governance
        </h2>
        <div className="w-8 h-px bg-[#E8C97A] mb-5" />
        <p className="font-lato text-[17px] text-[#1A1A1A] leading-relaxed mb-6">
          Official information about the college's governance structure —
          contacts for the Principal's office, administrative departments,
          committees, and institutional policies.
        </p>
        <ul className="space-y-3">
          {[
            ["Principal's Office",        'Contact details, notices, and official communications.'],
            ['Controller of Examination', 'Queries related to semester examinations.'],
            ['Staff Directory',           'Administrative and teaching staff contact information.'],
            ['Student Advisor',           'Student conduct rules, attendance policies, and guidelines.'],
          ].map(([label, detail]) => (
            <li key={label} className="flex items-start gap-3">
              <span className="text-[#C4561A] font-bold mt-0.5 flex-shrink-0">➥</span>
              <div className="font-lato text-[16px] text-[#1A1A1A]">
                <span className="font-semibold">{label}: </span>{detail}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);


// ─── NOTICES FEATURE ──────────────────────────────────────────────────────────
const Notices = () => (
  <section id="notices" className="bg-[#FAF7F2] py-20 px-6">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-14 items-center">

      <div className="md:w-5/12 w-full rounded-2xl overflow-hidden shadow-sm">
        <img src="/bhu/notice.png" alt="Notices" className="w-full h-80 object-cover" />
      </div>

      <div className="md:w-7/12 w-full">
        <p className="font-lato text-2xs tracking-[0.2em] uppercase text-[#C4561A] mb-3 font-semibold">
          Notices
        </p>
        <h2 className="font-cormorant text-5xl font-semibold text-[#0D1F3C] mb-2 leading-snug">
          Latest Announcements & Circulars
        </h2>
        <div className="w-8 h-px bg-[#E8C97A] mb-5" />
        <p className="font-lato text-[17px] text-[#1A1A1A] leading-relaxed mb-6">
          The official communication board of MMV — exam notifications, admission updates,
          event schedules, fee deadlines, and urgent circulars organized by category and date.
        </p>
        <ul className="space-y-3">
          {[
            ['Urgent Notices', 'Time-sensitive updates like exam changes or fee deadlines.'],
            ['Admissions',     'Open application windows for UG, PG, and Research programmes.'],
            ['Circulars',      'Official orders from BHU administration and MMV management.'],
          ].map(([label, detail]) => (
            <li key={label} className="flex items-start gap-3">
              <span className="text-[#C4561A] font-bold mt-0.5 flex-shrink-0">➥</span>
              <div className="font-lato text-[16px] text-[#1A1A1A]">
                <span className="font-semibold">{label}: </span>{detail}
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
  <section id="ai-assistant" className="bg-white py-20 px-6">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-14 items-center">

      {/* Text */}
      <div className="md:w-7/12 w-full">
        <p className="font-lato text-2xs font-semibold tracking-[0.2em] uppercase text-[#C4561A] mb-3 font-semibold">
          AI Assistant
        </p>
        <h2 className="font-cormorant text-5xl font-semibold text-[#0D1F3C] mb-2 leading-snug">
          Get Instant Answers with MMVerse
        </h2>
        <div className="w-8 h-px bg-[#E8C97A] mb-5" />
        <p className="font-lato text-[17px] text-[#1A1A1A] leading-relaxed mb-6">
          MMVerse is a conversational AI assistant built specifically for MMV students.
          Instead of searching through multiple pages, simply type your question
          and get an accurate answer within seconds.
        </p>
        <ul className="space-y-3 mb-8">
          {[
            ['➥', 'Natural Language',  'Ask in plain English — no keywords needed.'],
            ['➥', 'Available 24/7',    'Get answers anytime, even outside office hours.'],
            ['➥', 'MMV-Specific',      'Trained on MMV and BHU data, not generic answers.'],
          ].map(([icon, label, detail]) => (
            <li key={label} className="flex items-start gap-3">
              <span className="text-xl mt-0.5 flex-shrink-0">{icon}</span>
              <div className="font-lato text-[16px] text-[#1A1A1A]">
                <span className="font-semibold">{label}: </span>{detail}
              </div>
            </li>
          ))}
        </ul>
        <Link
          to="/ai-assistant"
          className="inline-block font-lato text-sm font-semibold bg-[#0D1F3C] text-white px-7 py-3 rounded-full hover:bg-[#C4561A] transition-colors"
        >
          Open MMVerse →
        </Link>
      </div>

      {/* Chat preview — matches MMVerse design */}
      <div className="md:w-5/12 w-full">
        <div className="bg-white rounded-2xl shadow-md border-4 border-[#0D1F3C]">
          {/* Header */}
          <div className="flex items-center gap-3 bg-[#132C58] rounded-t-xl px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-[#EEF3FC] flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src="/bhu/AI-icon.png" alt="MMVerse" className="w-10 h-10 rounded-full object-cover"
                onError={(e) => { e.target.style.display='none'; e.target.parentNode.innerText='🤖'; }} />
            </div>
            <div>
              <div className="font-lato text-base font-bold text-white leading-none">MMVerse</div>
              <div className="font-lato text-xs text-blue-200 mt-0.5">AI Campus Assistant</div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="font-lato text-xs text-blue-200">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="p-4 space-y-3">
            {[
              { from: 'user', text: 'What are the Cyber Library timings?' },
              { from: 'bot',  text: 'The Cyber Library is open Monday–Saturday, 8:00 AM to 5:00 PM.' },
              { from: 'user', text: 'Where do I get my hostel allotment form?' },
              { from: 'bot',  text: 'Hostel allotment forms are available at the Hostel Office in the MMV Campus. You can also find details in the Facilities section of this portal.' },
            ].map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`font-lato text-sm rounded-2xl px-4 py-2.5 max-w-[82%] leading-relaxed
                  ${m.from === 'user'
                    ? 'bg-[#02226E] text-white rounded-br-sm'
                    : 'bg-[#FFC6AD] text-black rounded-bl-sm'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 pb-4">
            <div className="flex gap-2">
              <div className="flex-1 bg-white rounded-xl px-4 py-2.5 font-lato text-sm text-gray-400 border-2 border-[#02226E]">
                Ask a question...
              </div>
              <div className="w-10 h-10 bg-[#02226E] rounded-xl flex items-center justify-center text-white text-base">→</div>
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
    <PortalSections />
    <Academics />
    <Administration />
    <Notices />
    <Facilities />
    <AIAssistant />
  </div>
);

export default Home;