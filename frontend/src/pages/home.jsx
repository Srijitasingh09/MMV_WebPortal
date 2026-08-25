import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import WelcomeSplash from '../components/WelcomeSplash';

// ─── Design tokens ────────────────────────────────────────────────────────────
// Navy   #0D1F3C / #0F3358 — institution authority, headings, dark surfaces
// Ivory  #FAF7F2 / #EAEFF5 — warm background, alternating sections
// Terra  #7D311F / #C4561A — BHU terracotta heritage accent, numbers, icons
// Gold   #D4AF37 / #E8C97A — thin accent rules, subtle highlights
// White  #FFFFFF — cards, clean surfaces
// Body   #1A1A1A — near-black readable text

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── ANIMATED STAT COUNTER ───────────────────────────────────────────────────
const CountUpStat = ({ targetStr, label, startFrom = 0 }) => {
  const [count, setCount] = useState(startFrom);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  const rawNumber = parseInt(targetStr.replace(/[^0-9]/g, ''), 10) || 0;
  const hasComma = targetStr.includes(',');
  const suffix = targetStr.includes('+') ? '+' : (targetStr.replace(/[0-9,]/g, '').trim());

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 1800; // 1.8 seconds
          let animationFrameId;
          const startTime = performance.now();

          const animate = (now) => {
            const elapsedTime = now - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.floor(startFrom + easeProgress * (rawNumber - startFrom));
            setCount(currentVal);

            if (progress < 1) {
              animationFrameId = requestAnimationFrame(animate);
            } else {
              setCount(rawNumber);
            }
          };

          animationFrameId = requestAnimationFrame(animate);
          return () => cancelAnimationFrame(animationFrameId);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rawNumber, startFrom, hasAnimated]);

  const formattedValue = hasComma ? count.toLocaleString('en-IN') : count.toString();

  return (
    <div
      ref={ref}
      className="group bg-white rounded-xl py-4 sm:py-7 px-3 sm:px-5 text-center border-2 border-[#0f3358]/20 hover:border-[#d4af37] shadow-xs hover:shadow-xl hover:shadow-amber-500/20 active:scale-95 active:border-[#d4af37] active:bg-amber-50/40 transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-[1.04] cursor-pointer"
    >
      <div className="font-cormorant text-2xl sm:text-4xl md:text-5xl font-bold text-[#7d311f] group-hover:scale-105 transition-transform mb-1">
        {formattedValue}{suffix}
      </div>
      <div className="font-lato text-[10px] sm:text-xs text-[#0f3358] font-bold uppercase tracking-wider group-hover:text-[#7d311f] transition-colors">
        {label}
      </div>
    </div>
  );
};

// ─── HERO ─────────────────────────────────────────────────────────────────────
const Hero = () => (
  <section className="relative w-full overflow-hidden bg-[#1f1510]">
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;600;700&display=swap');
      .font-cormorant { font-family: 'Mirava', 'Mirava Sans', 'Plus Jakarta Sans', 'Manrope', 'Montserrat', sans-serif; }
      .font-lato { font-family: 'Lato', sans-serif; }
      .font-hero-cormorant { font-family: 'Cormorant Garamond', 'Georgia', serif; }
    `}</style>
    
    <div className="relative min-h-[95vh] sm:min-h-[115vh] md:min-h-[130vh] lg:min-h-[140vh] flex flex-col justify-center items-center p-6 sm:p-16 md:p-24 lg:p-32">
      <div className="absolute inset-0 w-full h-full">
        <img
          src="/bhu/web (1).png"
          alt="Mahila Mahavidyalaya BHU Campus"
          className="w-full h-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(35, 18, 14, 0.65) 0%, rgba(25, 12, 16, 0.45) 50%, rgba(35, 15, 14, 0.75) 100%)'
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto w-full flex flex-col items-center text-center">
        <div className="mb-4 sm:mb-6">
          <div className="w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-48 lg:h-48 rounded-full p-2 bg-white ring-4 ring-[#D4AF37] shadow-2xl flex items-center justify-center mx-auto overflow-hidden">
            <img
              src="/mmvlogo.jpeg"
              alt="MMV BHU Crest"
              className="w-full h-full object-contain rounded-full bg-white"
            />
          </div>
        </div>

        <p className="font-serif text-[#D4AF37] text-base sm:text-lg md:text-xl font-semibold tracking-normal mb-1.5 drop-shadow-sm">
          महिला महाविद्यालय • काशी हिन्दू विश्वविद्यालय
        </p>

        <h1 className="font-hero-cormorant text-3xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight mb-2 sm:mb-3 drop-shadow-md">
          Mahila Mahavidyalaya
        </h1>

        <p className="font-lato text-amber-100/95 text-sm sm:text-lg md:text-xl font-medium tracking-wide max-w-2xl mb-4 drop-shadow-xs">
          Banaras Hindu University • Premier Institution for Women's Education (Est. 1929)
        </p>

        <div className="flex items-center gap-3 w-48 mx-auto my-3">
          <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent flex-1" />
          <span className="text-[#D4AF37] text-xs font-serif">✦</span>
          <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent flex-1" />
        </div>

        <p className="font-hero-cormorant italic text-sm sm:text-base text-slate-200 max-w-xl mb-8 leading-relaxed drop-shadow-xs">
          "Vidya Dadati Vinayam" - Empowering women through holistic education, leadership, and moral values.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-4">
         <a
            href="https://namaste.bhu.edu.in/login-namaste"
            target="_blank"
            rel="noopener noreferrer"
            className="font-lato text-xs sm:text-sm font-bold bg-[#7D311F] text-white px-6 py-3 rounded-full hover:bg-[#963b25] border border-[#D4AF37]/50 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <span>➤</span> Namaste BHU
          </a>
          <a
            href="https://bhu.samarth.edu.in/index.php/site/login"
            target="_blank"
            rel="noopener noreferrer"
            className="font-lato text-xs sm:text-sm font-bold bg-[#7D311F] text-white px-6 py-3 rounded-full hover:bg-[#963b25] border border-[#D4AF37]/50 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <span>➤</span> Samarth Portal
          </a>
        </div>

        <div className="mt-2">
          <a
            href="#live-notices-news"
            className="inline-block font-lato text-xs sm:text-sm font-semibold bg-black/30 hover:bg-black/50 text-amber-100 hover:text-white border border-amber-200/30 px-6 py-2.5 rounded-full backdrop-blur-xs transition-all transform hover:-translate-y-0.5"
          >
            Explore Latest Notices & News ↓
          </a>
        </div>
      </div>
    </div>
  </section>
);

// ─── NOTICES & NEWS BOARD (FULL WIDTH & OPTIMIZED SPACING) ──────────────────
const NoticesAndNews = () => {
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);

  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoadingNotices(true);
        const res = await fetch(`${API_BASE}/notices`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const formatted = data.map((n) => {
              const rawDate = n.created_at || n.date || n.published_at;
              const dateObj = rawDate ? new Date(rawDate) : null;
              const isValid = dateObj && !isNaN(dateObj.getTime());
              return {
                id: n.id,
                title: n.title,
                date: isValid
                  ? dateObj.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
                  : 'Recent',
                isNew: isValid
                  ? (new Date() - dateObj) / (1000 * 60 * 60 * 24) <= 14
                  : false
              };
            });
            setNotices(formatted);
          } else {
            setNotices([]);
          }
        } else {
          setNotices([]);
        }
      } catch (err) {
        console.error('Failed to fetch notices:', err);
        setNotices([]);
      } finally {
        setLoadingNotices(false);
      }
    };

    const fetchNews = async () => {
      try {
        setLoadingNews(true);
        const res = await fetch(`${API_BASE}/news`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const formatted = data.map((n) => {
              const rawDate = n.created_at || n.date || n.published_at;
              const dateObj = rawDate ? new Date(rawDate) : null;
              const isValid = dateObj && !isNaN(dateObj.getTime());
              return {
                id: n.id,
                title: n.title,
                date: isValid
                  ? dateObj.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
                  : 'Recent',
                isNew: isValid
                  ? (new Date() - dateObj) / (1000 * 60 * 60 * 24) <= 14
                  : false
              };
            });
            setNews(formatted);
          } else {
            setNews([]);
          }
        } else {
          setNews([]);
        }
      } catch (err) {
        console.error('Failed to fetch news:', err);
        setNews([]);
      } finally {
        setLoadingNews(false);
      }
    };

    fetchNotices();
    fetchNews();
  }, []);

  return (
    <section id="live-notices-news" className="bg-[#FAF7F2] pt-8 sm:pt-12 pb-6 sm:pb-8 px-4 sm:px-6 md:px-8 border-b border-slate-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-4 sm:mb-6">
          <p className="font-lato font-semibold text-2xs tracking-[0.2em] uppercase text-[#7d311f] mb-1.5">
            Official Bulletin Hub
          </p>
          <h2 className="font-cormorant text-2xl sm:text-4xl md:text-5xl font-bold text-[#0f3358] mb-2 leading-snug">
            Campus Notices & News
          </h2>
          <div className="w-12 h-0.5 bg-[#d4af37] mx-auto" />
        </div>

        {/* Dual Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* Left Column: NOTICES CARD */}
          <div className="bg-white rounded-xl border-2 border-[#0f3358]/20 p-5 sm:p-6 shadow-xs flex flex-col justify-between min-h-[420px]">
            <div>
              <h3 className="font-cormorant text-xl sm:text-2xl font-bold text-[#0f3358] leading-snug mb-3 pb-2 border-b border-slate-200 flex items-center justify-between">
                <span>Notices & Circulars</span>
                <span className="text-xs font-lato font-semibold text-[#7d311f] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Live</span>
              </h3>

              {/* Notice Stream */}
              <div className="max-h-[320px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-300">
                {loadingNotices ? (
                  <div className="py-8 text-center">
                    <div className="w-7 h-7 border-3 border-[#0f3358] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="font-lato text-xs text-slate-500 font-medium">Loading Notices...</p>
                  </div>
                ) : notices.length > 0 ? (
                  notices.map((n) => (
                    <div key={n.id} className="border-b border-dotted border-slate-200 pb-3">
                      <Link
                        to={`/notices?id=${n.id}`}
                        className="font-lato text-xs sm:text-sm font-semibold text-[#0f3358] hover:text-[#7d311f] transition-colors leading-snug line-clamp-2 block mb-1"
                      >
                        {n.title}
                      </Link>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[11px] font-medium">{n.date}</span>
                          {n.isNew && (
                            <span className="bg-red-600 text-white font-extrabold text-[9px] px-1.5 py-0.2 rounded uppercase animate-pulse">
                              NEW
                            </span>
                          )}
                        </div>
                        <Link
                          to={`/notices?id=${n.id}`}
                          className="text-[#7d311f] font-bold text-xs hover:underline"
                        >
                          Read More →
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-500 font-lato text-xs">
                    No notices available at present.
                  </div>
                )}
              </div>
            </div>

            {/* Single Read More Footer */}
            <div className="mt-3 pt-3 border-t border-slate-100 text-right">
              <Link
                to="/notices"
                className="inline-flex items-center gap-1.5 font-lato text-xs sm:text-sm font-bold text-[#0f3358] hover:text-[#7d311f] transition-colors"
              >
                <span>Read More Notices</span>
                <span className="text-base font-bold">→</span>
              </Link>
            </div>
          </div>

          {/* Right Column: NEWS CARD */}
          <div className="bg-white rounded-xl border-2 border-[#0f3358]/20 p-5 sm:p-6 shadow-xs flex flex-col justify-between min-h-[420px]">
            <div>
              <h3 className="font-cormorant text-xl sm:text-2xl font-bold text-[#0f3358] leading-snug mb-3 pb-2 border-b border-slate-200 flex items-center justify-between">
                <span>Latest Campus News</span>
                <span className="text-xs font-lato font-semibold text-[#7d311f] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Updates</span>
              </h3>

              {/* News Stream */}
              <div className="max-h-[320px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-300">
                {loadingNews ? (
                  <div className="py-8 text-center">
                    <div className="w-7 h-7 border-3 border-[#0f3358] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="font-lato text-xs text-slate-500 font-medium">Loading News...</p>
                  </div>
                ) : news.length > 0 ? (
                  news.map((n) => (
                    <div key={n.id} className="border-b border-dotted border-slate-200 pb-3">
                      <Link
                        to={`/news?id=${n.id}`}
                        className="font-lato text-xs sm:text-sm font-semibold text-[#0f3358] hover:text-[#7d311f] transition-colors leading-snug line-clamp-2 block mb-1"
                      >
                        {n.title}
                      </Link>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[11px] font-medium">{n.date}</span>
                          {n.isNew && (
                            <span className="bg-red-600 text-white font-extrabold text-[9px] px-1.5 py-0.2 rounded uppercase animate-pulse">
                              NEW
                            </span>
                          )}
                        </div>
                        <Link
                          to={`/news?id=${n.id}`}
                          className="text-[#7d311f] font-bold text-xs hover:underline"
                        >
                          Read More →
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-500 font-lato text-xs">
                    No news updates available at present.
                  </div>
                )}
              </div>
            </div>

            {/* Single Read More Footer */}
            <div className="mt-3 pt-3 border-t border-slate-100 text-right">
              <Link
                to="/news"
                className="inline-flex items-center gap-1.5 font-lato text-xs sm:text-sm font-bold text-[#0f3358] hover:text-[#7d311f] transition-colors"
              >
                <span>Read More News</span>
                <span className="text-base font-bold">→</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

// ─── ABOUT (Alternating Slate/Blue Shade #EAEFF5) ─────────────────────────────
const About = () => (
  <section id="about" className="bg-[#EAEFF5] py-12 sm:py-20 px-4 sm:px-6">
    <div className="max-w-5xl mx-auto">
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
          Mahila Mahavidyalaya. Whether you need your syllabus, hostel details,
          administrative contacts, or the latest notices - it is all organized here.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
        {[
          ['1929', 'Year Established', 1900],
          ['30+',  'Departments', 0],
          ['2,500+', 'Students Enrolled', 1000],
          ['120+', 'Faculty Members', 0],
        ].map(([n, l, s]) => (
          <CountUpStat key={l} targetStr={n} label={l} startFrom={s} />
        ))}
      </div>
    </div>
  </section>
);

// ─── FACILITIES HIGHLIGHT (Alternating Warm Ivory #FAF7F2) ───────────────────
const facilities = [
  { label: 'Hostels',       detail: 'Five on-campus hostels with mess, security & Wi-Fi.', link: '/facilities/hostels' },
  { label: 'Libraries',     detail: 'MMV, Central & Cyber Library - 1 lakh+ books & digital access.', link: '/facilities/library/mmvlibrary' },
  { label: 'Sports',        detail: 'Courts, athletics track, gymnasium & sports ground', link: '/facilities/sports/mmvsports' },
  { label: 'Health Centre', detail: 'On-campus medical facilities, Sir Sundarlal Hospital & Trauma Centre.', link: '/facilities/medical/health' },
  { label: 'Canteen',       detail: 'Access to affordable, hygienic meals and snacks within the campus.', link: '/facilities/canteen/mmvcanteen' },
  { label: 'MMV Pahal',     detail: 'Assist students in addressing academic, personal, and social challenges.', link: '/facilities/wellbeing/mmvwell' },
  { label: 'Auditorium',    detail: 'Spacious halls and facilities for seminars, cultural programmes, and guest lectures.', link: '/facilities/other/auditorium' },
  { label: 'Transport',     detail: 'BHU bus routes connecting all campus points.', link: '/facilities/other/transportation' },
];

const Facilities = () => (
  <section id="facilities" className="bg-[#FAF7F2] py-12 sm:py-16 px-4 sm:px-6 border-y border-slate-200">
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
          <Link
            key={f.label}
            to={f.link}
            className="group bg-white border-2 border-[#0f3358]/20 hover:border-[#d4af37] rounded-xl p-3.5 sm:p-5 shadow-xs hover:shadow-xl hover:shadow-amber-500/20 active:scale-95 active:border-[#d4af37] active:bg-amber-50/40 transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-[1.03] cursor-pointer block text-left"
          >
            <div className="font-cormorant text-sm sm:text-lg font-bold text-[#0f3358] group-hover:text-[#7d311f] transition-colors mb-1 sm:mb-2">
              {f.label}
            </div>
            <div className="font-lato text-[11px] sm:text-sm text-slate-600 leading-relaxed">{f.detail}</div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

// ─── ACADEMICS FEATURE (Alternating Slate/Blue Shade #EAEFF5) ─────────────────
const Academics = () => (
  <section id="academics" className="bg-[#EAEFF5] py-10 sm:py-16 px-4 sm:px-6 border-b border-slate-200/60">
    <div className="max-w-5xl mx-auto flex flex-row gap-3 sm:gap-8 items-center">
      <div className="w-1/3 sm:w-5/12 flex-shrink-0 rounded-xl overflow-hidden shadow-sm border border-slate-200">
        <img src="/bhu/academic2.jpeg" alt="Academics" className="w-full h-36 sm:h-72 md:h-80 object-cover object-center" />
      </div>

      <div className="w-2/3 sm:w-7/12 min-w-0 flex-1">
        <p className="font-lato text-[10px] sm:text-2xs font-bold tracking-[0.15em] uppercase text-[#7d311f] mb-1 sm:mb-2">
          Academics
        </p>
        <h2 className="font-cormorant text-lg sm:text-3xl md:text-4xl font-bold text-[#0f3358] mb-1 sm:mb-2 leading-snug">
          Academic Information
        </h2>
        <div className="w-8 h-0.5 bg-[#d4af37] mb-2 sm:mb-4" />
        <p className="font-lato text-xs sm:text-[16px] text-slate-700 leading-relaxed mb-3 sm:mb-5 line-clamp-3 sm:line-clamp-none">
          All academic resources for every department at MMV - semester syllabi,
          annual schedules, and contact details of Incharge.
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

// ─── ADMINISTRATION FEATURE (Alternating Warm Ivory #FAF7F2) ──────────────────
const Administration = () => (
  <section id="administration" className="bg-[#FAF7F2] py-10 sm:py-16 px-4 sm:px-6 border-b border-slate-200/60">
    <div className="max-w-5xl mx-auto flex flex-row-reverse gap-3 sm:gap-8 items-center">
      <div className="w-1/3 sm:w-5/12 flex-shrink-0 rounded-xl overflow-hidden shadow-sm border border-slate-200">
        <img src="/bhu/administration2.jpg" alt="Administration" className="w-full h-36 sm:h-72 md:h-80 object-cover object-center" />
      </div>

      <div className="w-2/3 sm:w-7/12 min-w-0 flex-1">
        <p className="font-lato text-[10px] sm:text-2xs font-bold tracking-[0.15em] uppercase text-[#7d311f] mb-1 sm:mb-2">
          Administration
        </p>
        
        <h2 className="font-cormorant text-lg sm:text-3xl md:text-4xl font-bold text-[#0f3358] mb-1 sm:mb-2 leading-snug">
          Leadership & Administration
        </h2>
        
        <div className="w-8 h-0.5 bg-[#d4af37] mb-2 sm:mb-4" />

        <p className="font-lato text-xs sm:text-[16px] text-slate-700 leading-relaxed mb-3 sm:mb-5 line-clamp-3 sm:line-clamp-none">
          Official information about the administrative structure -
          Principal's Office, administrative departments, staff, and institutional policies.
        </p>

        <ul className="space-y-1.5 sm:space-y-3">
          {[
            ["Principal's Office", 'Contact details & communications.'],
            ['Controller of Exam', 'Semester exam queries.'],
            ['Staff Directory', 'Teaching & administrative staff directory.'],
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



// ─── HOME PAGE ────────────────────────────────────────────────────────────────
const Home = () => (
  <div className="font-lato">
    <WelcomeSplash />
    <Hero />
    <NoticesAndNews />
    <About />
    <Facilities />
    <Academics />
    <Administration />
  </div>
);

export default Home;