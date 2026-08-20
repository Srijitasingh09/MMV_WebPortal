import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react'


// ============================================
// SHARED MENU DATA
// Pulled out once so both the desktop hover-dropdowns AND the mobile
// accordion menu read from the same source — no more keeping two
// separate copies of this list in sync by hand.
// ============================================
const administrationItems = [
  { label: "Vice Chancellor", path: "/administration/vc" },
  { label: "MMV Principal", path: "/administration/principal" },
  { label: "Dean of Students", path: "/administration/dean" },
  { label: "Student Advisor", path: "/administration/advisor" },
  { label: "Proctorial Board", path: "/administration/proctorial", children: [
    { label: "Chief Proctor", path: "/administration/proctorial/chief" },
    { label: "University Proctorial Board", path: "/administration/proctorial/uniboard" },
  ]},
  { label: "Controller of Examination", path: "/administration/examination", children: [
    { label: "University", path: "/administration/examination/universityexam" },
    { label: "MMV", path: "/administration/examination/mmvexam" },
  ]},
  { label: "MMV Office Staff", path: "/administration/staff" },
];

const academicsItems = [
  { label: "NEP", path: "/academics/nep" },
  { label: "Syllabus", path: "/academics/syllabus", children: [
    { label: "Under Graduate", path: "/academics/syllabus/ug", children: [
      { label: "Science", path: "/academics/syllabus/ug/science" },
      { label: "Social Science", path: "/academics/syllabus/ug/socialscience" },
      { label: "Arts", path: "/academics/syllabus/ug/arts" },
    ]},
    { label: "Post Graduate", path: "/academics/syllabus/pg", children: [
      { label: "Bioinformatics", path: "/academics/syllabus/pg/bioinformatics" },
      { label: "Home Science", path: "/academics/syllabus/pg/homescience" },
      { label: "Education", path: "/academics/syllabus/pg/education" },
    ]},
  ]},
  { label: "Electives", path: "/academics/electives" },
  { label: "SWAYAM Courses", path: "/academics/swayam" },
  { label: "Section Incharge", path: "/academics/section-incharge", children: [
    { label: "Science", path: "/academics/section-incharge/science"},
    { label: "Social Science", path: "/academics/section-incharge/socialscience"},
    { label: "Arts", path: "/academics/section-incharge/arts"}
  ]},
  { label: "Academic Calendar", path: "/academics/calendar" },
  { label: "Holiday List", path: "/academics/holidays" },
];

const facilitiesItems = [
  { label: "Hostels", path: "/facilities/hostels", children: [
    { label: "Chief Warden", path: "/facilities/hostels/chiefwarden" },
    { label: "Hostel Coordinator", path: "/facilities/hostels/coordinator" },
    { label: "Swasti Kunj Hostel", path: "/facilities/hostels/swastikunj" },
    { label: "Kirti Kunj Hostel", path: "/facilities/hostels/kirtikunj" },
    { label: "Kundan Devi Malviya Hostel", path: "/facilities/hostels/kundandevi" },
    { label: "Pragya Kunj Hostel", path: "/facilities/hostels/pragyakunj" },
    { label: "Jyoti Kunj Hostel", path: "/facilities/hostels/jyotikunj" },
  ]},
  { label: "Library", path: "/facilities/library", children: [
    { label: "Central Library", path: "/facilities/library/central" },
    { label: "Cyber Library", path: "/facilities/library/cyber" },
    { label: "MMV Library", path: "/facilities/library/mmvlibrary" },
  ]},
  { label: "Sports", path: "/facilities/sports", children: [
    { label: "University Sports Board", path: "/facilities/sports/universitysports" },
    { label: "MMV Sports Board", path: "/facilities/sports/mmvsports" },
    { label: "Open Gym", path: "/facilities/sports/gym" },
  ]},
  { label: "Well-Being", path: "/facilities/wellbeing", children: [
    { label: "WBSC", path: "/facilities/wellbeing/wbsc" },
    { label: "MMV Pahal", path: "/facilities/wellbeing/mmvwell" },
  ]},
  { label: "Training & Placement", path: "/facilities/trainingplacement", children: [
    { label: "University T&P", path: "/facilities/trainingplacement/universitytraining" },
    { label: "MMV T&P", path: "/facilities/trainingplacement/mmvtraining" },
  ]},
  { label: "Central Discovery Centre", path: "/facilities/cdc" },
  { label: "Medical", path: "/facilities/medical", children: [
    { label: "Sir Sundarlal Hospital", path: "/facilities/medical/ssh" },
    { label: "Trauma Center", path: "/facilities/medical/tc" },
    { label: "Student Health Center", path: "/facilities/medical/health" },
  ]},
  { label: "Extra Curricular", path: "/facilities/extracurricular", children: [
    { label: "NCC", path: "/facilities/extracurricular/ncc" },
    { label: "NSS", path: "/facilities/extracurricular/nss" },
    { label: "NLSC", path: "/facilities/extracurricular/nlsc" },
    { label: "Diploma & Certificate Courses", path: "/facilities/extracurricular/diplomacourses" },
  ]},
  { label: "Samarth Portal", path: "/facilities/samarth" },
  { label: "Namaste BHU App", path: "/facilities/namaste" },
  { label: "Canteen", path: "/facilities/canteen", children: [
    { label: "University", path: "/facilities/canteen/universitycanteen" },
    { label: "MMV", path: "/facilities/canteen/mmvcanteen" },
  ]},
  { label: "City Delegacy", path: "/facilities/citydelegacy" },
  { label: "Other Amenities", path: "/facilities/other", children: [
    { label: "Vishwanath Temple", path: "/facilities/other/vt" },
    { label: "Bharat Kala Bhawan", path: "/facilities/other/bkb" },
    { label: "Transportation", path: "/facilities/other/transportation" },
    { label: "Banks & Post Offices", path: "/facilities/other/banks" },
    { label: "Guest Houses", path: "/facilities/other/guesthouses" },
    { label: "Auditorium", path: "/facilities/other/auditorium" },
  ]},
];

// Flat list used to build the mobile accordion menu — same data as the
// desktop dropdowns above, plus the plain top-level links that live
// directly in the nav bar (Home, About, Notices, etc.)
const mobileNavItems = [
  { label: "Home", path: "/" },
  { label: "About MMV", path: "/about" },
  { label: "Administration", children: administrationItems },
  { label: "Academics", children: academicsItems },
  { label: "Facilities", children: facilitiesItems },
  { label: "Notices", path: "/notices" },
  { label: "AI Assistant", path: "/ai-assistant" },
  { label: "Contact", path: "/contact" },
];

// ============================================
// DESKTOP — LEVEL 3 - Deepest submenu (hover flyout)
// ============================================
const SubSubMenu = ({ label, path, children }) => {
  return (
    <div className="relative group/subsub">
      {path ? (
        <Link
          to={path}
          className="flex items-center justify-between px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 cursor-pointer whitespace-nowrap font-medium transition-colors"
        >
          <span>{label}</span>
          <span className="text-[10px] ml-2.5 text-[#d4af37]">►</span>
        </Link>
      ) : (
        <div className="flex items-center justify-between px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 cursor-pointer whitespace-nowrap font-medium transition-colors">
          <span>{label}</span>
          <span className="text-[10px] ml-2.5 text-[#d4af37]">►</span>
        </div>
      )}

      <div className="absolute top-0 left-full bg-[#0f3358] shadow-2xl min-w-52 lg:min-w-60 z-[1000] border-2 border-[#d4af37] rounded-xl hidden group-hover/subsub:block">
        {children.map((item, idx) => (
          <Link
            key={item.path || idx}
            to={item.path}
            className={`block px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 whitespace-nowrap transition-colors ${idx === 0 ? "rounded-t-lg" : ""} ${idx === children.length - 1 ? "rounded-b-lg border-b-0" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
};


// ============================================
// DESKTOP — LEVEL 2 - Middle submenu (hover flyout)
// ============================================
const SubMenu = ({ label, path, children }) => {
  return (
    <div className="relative group/sub">
      {path ? (
        <Link
          to={path}
          className="flex items-center justify-between px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 cursor-pointer whitespace-nowrap font-medium transition-colors"
        >
          <span>{label}</span>
          <span className="text-[10px] ml-2.5 text-[#d4af37]">►</span>
        </Link>
      ) : (
        <div className="flex items-center justify-between px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 cursor-pointer whitespace-nowrap font-medium transition-colors">
          <span>{label}</span>
          <span className="text-[10px] ml-2.5 text-[#d4af37]">►</span>
        </div>
      )}

      <div className="absolute top-0 left-full bg-[#0f3358] shadow-2xl min-w-52 lg:min-w-60 z-[1000] border-2 border-[#d4af37] rounded-xl hidden group-hover/sub:block">
        {children.map((item, idx) =>
          item.children ? (
            <SubSubMenu
              key={item.label || idx}
              label={item.label}
              path={item.path}
              children={item.children}
            />
          ) : (
            <Link
              key={item.path || idx}
              to={item.path}
              className={`block px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 whitespace-nowrap transition-colors ${idx === 0 ? "rounded-t-lg" : ""} ${idx === children.length - 1 ? "rounded-b-lg border-b-0" : ""}`}
            >
              {item.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
};


// ============================================
// DESKTOP — LEVEL 1 - Main dropdown menu (hover flyout)
// ============================================
const DropdownMenu = ({ title, path, items }) => {
  return (
    <div className="relative group/main">
      <Link 
        to={path}
        className="flex items-center gap-1.5 px-3 lg:px-4 py-2 sm:py-2.5 text-white text-xs lg:text-sm font-bold hover:bg-[#174873] hover:text-[#d4af37] transition-all duration-200 h-full whitespace-nowrap cursor-pointer"
      >
        {title}
        <span className="text-[9px] text-[#d4af37] font-bold">▼</span>
      </Link>

      <div className="absolute top-full left-0 bg-[#0f3358] shadow-2xl min-w-52 lg:min-w-60 z-[999] border-2 border-[#d4af37] rounded-b-xl hidden group-hover/main:block">
        {items.map((item, idx) =>
          item.children ? (
            <SubMenu
              key={item.label || idx}
              label={item.label}
              path={item.path}
              children={item.children}
            />
          ) : (
            <Link
              key={item.path || idx}
              to={item.path}
              className={`block px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 whitespace-nowrap transition-colors ${idx === items.length - 1 ? "rounded-b-lg border-b-0" : ""}`}
            >
              {item.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
};

// ============================================
// MOBILE — one combined golden-bordered menu, with each open section's
// content nested inside its own inner golden border (so opening
// Administration -> Proctorial Board shows border-within-border-within-
// border, visually spelling out the section > subsection > sub-subsection
// hierarchy). Depth keeps its own background + hover color, same as before.
// ============================================
const depthStyles = [
  {
    bg: "bg-[#0f3358]",
    text: "text-white",
    weight: "font-bold",
    hover: "hover:bg-[#174873] hover:text-[#d4af37]",
  }, // Level 1
  {
    bg: "bg-[#133a63]",
    text: "text-slate-100",
    weight: "font-semibold",
    hover: "hover:bg-[#1b4d7e] hover:text-[#f4d580]",
  }, // Level 2
  {
    bg: "bg-[#091f38]",
    text: "text-amber-200",
    weight: "font-medium",
    hover: "hover:bg-[#12314f] hover:text-[#fce8b2]",
  }, // Level 3
];

const MobileMenuItem = ({ item, depth = 0, onNavigate }) => {
  const [open, setOpen] = useState(false);

  const style = depthStyles[Math.min(depth, depthStyles.length - 1)];
  const indentPad = 16 + depth * 14;

  if (item.children) {
    return (
      <div>
        <div className="flex items-center justify-between">
          {item.path ? (
            <Link
              to={item.path}
              onClick={onNavigate}
              className={`flex-1 py-3 text-xs sm:text-sm text-left transition-colors cursor-pointer ${style.bg} ${style.text} ${style.weight} ${style.hover}`}
              style={{ paddingLeft: `${indentPad}px` }}
            >
              <span className={depth === 0 ? "font-cinzel tracking-wide" : ""}>{item.label}</span>
            </Link>
          ) : (
            <span
              className={`flex-1 py-3 text-xs sm:text-sm text-left transition-colors ${style.bg} ${style.text} ${style.weight}`}
              style={{ paddingLeft: `${indentPad}px` }}
            >
              <span className={depth === 0 ? "font-cinzel tracking-wide" : ""}>{item.label}</span>
            </span>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            className={`py-3 px-4 text-[#d4af37] ${style.bg} ${style.hover} cursor-pointer`}
          >
            <span className={`text-[10px] inline-block transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
              ►
            </span>
          </button>
        </div>
        {/* Nested golden border wraps this section's own content — so an
            opened sub-subsection appears as its own border INSIDE its
            parent's border, instead of everything sharing one flat box. */}
        {open && (
          <div className="border-2 border-[#d4af37] rounded-lg mx-2 my-1.5 overflow-hidden divide-y divide-[#d4af37]/25">
            {item.children.map((child) => (
              <MobileMenuItem
                key={child.label || child.path}
                item={child}
                depth={depth + 1}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.path}
      onClick={onNavigate}
      className={`block py-3 pr-4 text-xs sm:text-sm transition-colors ${style.bg} ${style.text} ${style.weight} ${style.hover}`}
      style={{ paddingLeft: `${indentPad}px` }}
    >
      <span className={depth === 0 ? "font-cinzel tracking-wide" : ""}>{item.label}</span>
    </Link>
  );
};

// ============================================
// MOBILE — slide-in menu panel
// ============================================
const MobileMenu = ({ isOpen, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-[998] transition-opacity duration-200 md:hidden
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-[#081a2f] z-[999] shadow-2xl
          overflow-y-auto transition-transform duration-300 md:hidden border-l-2 border-[#d4af37]
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-[#d4af37]  bg-[#0f3358] z-10 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37]" />
            <span className="text-white font-bold font-cinzel text-base tracking-wide">MMV Menu</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="text-slate-300 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-enditems-center rounded-lg border border-slate-700 bg-white/5"
          >
            ✕
          </button>
        </div>
        <div className="p-3">
          <div className="border-2 border-[#d4af37] rounded-xl overflow-hidden shadow-md bg-[#0f3358] divide-y divide-[#d4af37]/30">
            {mobileNavItems.map((item) => (
              <MobileMenuItem key={item.label} item={item} onNavigate={onClose} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};


// ============================================
// THE FULL NAVBAR
// ============================================
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname.toLowerCase() === '/' || location.pathname.toLowerCase() === '/home';
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const token = localStorage.getItem('token');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notices, setNotices] = useState([]);

  // ---- SCROLL-DRIVEN HEADER (Columbia-site style) ----
  // The <header> below is `sticky top-0`, so it's always pinned to the
  // viewport. The logo/banner/ticker block collapses away as soon as the
  // user scrolls DOWN, leaving just the Home / About / Administration /
  // Academics / Facilities / Notices / AI Assistant / Contact bar pinned
  // at the very top. Scrolling UP (or landing back at the top of the
  // page) brings the full banner back down.
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Start each new page with the full header showing, then let scrolling
  // take over from there.
  useEffect(() => {
    setHeaderVisible(true);
    lastScrollY.current = window.scrollY;
  }, [location.pathname]);

  useEffect(() => {
    const SCROLL_THRESHOLD = 6; // ignore tiny/jittery scroll deltas
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;

        if (currentY < 10) {
          // Back at the very top of the page — always show the full header
          setHeaderVisible(true);
        } else if (delta > SCROLL_THRESHOLD) {
          // Scrolling down — collapse the banner, nav bar stays pinned
          setHeaderVisible(false);
        } else if (delta < -SCROLL_THRESHOLD) {
          // Scrolling up — bring the banner back
          setHeaderVisible(true);
        }

        lastScrollY.current = currentY;
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await fetch(`${API_BASE}/notices`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setNotices(data);
          }
        }
      } catch (err) {
        // Fallback gracefully if API is un-reachable
      }
    };
    fetchNotices();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    navigate('/login');
  };

  return (
    <>
      {/* ---- TOP HEADER SECTION (Top Bar + College Banner + Notice Ticker) ---- */}
      <header className="w-full bg-[#0f3358]">
        {/* ---- TOP BAR ---- */}
        <div className="bg-[#0f3358] text-xs text-slate-200 px-3 sm:px-6 py-1.5 flex justify-between items-center border-b border-[#d4af37]/40">
          <div className="flex items-center gap-3">
          </div>

          <div>
            {token && isAdmin ? (
              <div className="flex items-center gap-3">
                <Link to="/admin" className="bg-[#174873] text-[#d4af37] px-2.5 py-0.5 rounded text-xs font-semibold hover:bg-[#1b5385] border border-[#d4af37]/40 transition-colors">
                  Admin Panel
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-[#7d311f] text-white px-2.5 py-0.5 rounded text-xs hover:bg-red-800 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              /* CAMOUFLAGED ADMIN LOGIN - Invisible by default, turns text-white on hover */
              <a
                href="/login"
                className="text-[#0f3358] hover:text-white transition-colors duration-200 text-xs font-medium cursor-default hover:cursor-pointer select-none"
                title="Admin Login"
              >
                Admin Login
              </a>
            )}
          </div>
        </div>

        {/* ---- COLLEGE HEADER (BLUE BACKGROUND #0f3358) ---- */}
        <div className="bg-white px-3 sm:px-8 py-3 flex items-center justify-between gap-2 sm:gap-3 border-b border-[#d4af37]/40 shadow-sm">
         
          {/* BHU Logo */}
          <img
            src="/bhu/logo_bhu.png"
            alt="BHU Logo"
            className="h-10 sm:h-14 md:h-16 rounded-2xl object-contain flex-shrink-0"
          />

          {/* CENTER - MMV SAARTHI LOGO (NO BACKGROUND) */}
          <div className="hidden sm:block flex-shrink-0 bg-transparent">
            <img 
              src="/mmv_saarthi_logo.png" 
              alt="mmv-saarthi-logo"
              className="w-24 h-9 md:w-40 md:h-14 object-contain rounded-2xl" 
            />
          </div>
        
          {/* MMV Logo + Name */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="min-w-0 text-right">
              <h1 className="text-[#353375] text-xs sm:text-lg md:text-2xl font-bold font-cinzel leading-tight tracking-wide whitespace-normal">
                Mahila Mahavidyalaya
              </h1>
              <p className="text-[9px] sm:text-xs text-[#353375] font-semibold tracking-wider uppercase whitespace-normal">
                Varanasi
              </p>
            </div>
            <div className="bg-transparent p-0 flex-shrink-0">
              <img
                src="/mmvlogo.jpeg"
                alt="MMV Logo"
                className="h-9 w-9 sm:h-14 sm:w-14 md:w-16 md:h-16 rounded-2xl object-contain "
              />
            </div>
          </div>

          {/* Hamburger — mobile/tablet only */}
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="md:hidden flex-shrink-0 ml-1 p-2 rounded-lg hover:bg-white/10 text-white border border-white/20"
          >
            <span className="block w-6 h-0.5 bg-[#353375] mb-1" />
            <span className="block w-6 h-0.5 bg-[#353375] mb-1" />
            <span className="block w-6 h-0.5 bg-[#353375]" />
          </button>
        </div>

        {/* ---- DYNAMIC MOVING NOTICE TICKER STRIP (#0f3358) ---- */}
        <div className="bg-[#0f3358] border-t border-b-2 border-[#d4af37] md:border-b md:border-[#d4af37]/40 text-xs sm:text-sm flex items-center shadow-inner overflow-hidden relative z-20">
          {/* Sticky Ticker Badge */}
          <div className="bg-[#7d311f] text-white px-3 sm:px-4 py-1.5 font-bold uppercase tracking-wider flex items-center gap-2 z-30 shadow-md flex-shrink-0 border-r border-[#d4af37]/50">
            <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-ping" />
            <span className="text-[10px] sm:text-xs font-cinzel text-[#fce8b2]">Announcements</span>
          </div>

          {/* Scrolling Marquee Container */}
          <div className="overflow-hidden whitespace-nowrap py-1.5 flex-1 relative bg-[#0f3358]">
            <div className="inline-flex animate-marquee hover:[animation-play-state:paused] items-center">
              {notices.length > 0 ? (
                // Duplicate array twice to create a seamless infinite marquee scroll loop
                [...notices, ...notices].map((n, idx) => (
                  <Link
                    key={`${n.id || idx}-${idx}`}
                    to={`/notices?id=${n.id}`}
                    className="inline-flex items-center gap-2 mx-6 text-slate-100 hover:text-[#d4af37] transition-colors font-medium cursor-pointer"
                  >
                    <span className="bg-[#174873] text-[#d4af37] px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-[#d4af37]/30 shadow-xs">
                      {n.category || 'Notice'}
                    </span>
                    <span className="hover:underline">{n.title}</span>
                    <span className="text-[#d4af37]/70 ml-3">•</span>
                  </Link>
                ))
              ) : (
                <div className="inline-flex items-center gap-4 px-6 text-slate-200 font-medium">
                  <span className="text-[#d4af37] font-semibold">Welcome to Mahila Maha Vidyalaya (MMV) Portal — Banaras Hindu University</span>
                  <span className="text-[#d4af37]">•</span>
                  <span>Visit the Notices section for real-time examination schedules and official notifications.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ---- NAVIGATION BAR (MAIN BLUE BACKGROUND #0f3358) ---- */}
      <nav className="hidden md:block bg-[#0f3358] px-4 border-b-2 border-[#d4af37] shadow-lg">
        {/* Desktop Nav Links */}
        <div className="flex relative justify-end items-center">
          <Link to="/"
            className="px-3 lg:px-4 py-2 sm:py-2.5 text-white text-xs lg:text-sm font-bold
                    hover:bg-[#174873] hover:text-[#d4af37]
                    transition-all duration-200 whitespace-nowrap">
            Home
          </Link>
          <Link to="/about"
            className="px-3 lg:px-4 py-2 sm:py-2.5 text-white text-xs lg:text-sm font-bold
                    hover:bg-[#174873] hover:text-[#d4af37]
                    transition-all duration-200 whitespace-nowrap">
            About MMV
          </Link>

          <DropdownMenu title="Administration" path="/administration" items={administrationItems} />
          <DropdownMenu title="Academics" path="/academics" items={academicsItems} />
          <DropdownMenu title="Facilities" path="/facilities" items={facilitiesItems} />

          <Link to="/notices"
            className="px-3 lg:px-4 py-2 sm:py-2.5 text-white text-xs lg:text-sm font-bold
                    hover:bg-[#174873] hover:text-[#d4af37]
                    transition-all duration-200 whitespace-nowrap">
            Notices
          </Link>

          <Link to="/ai-assistant"
            className="px-3 lg:px-4 py-2 sm:py-2.5 text-white text-xs lg:text-sm font-bold
                    hover:bg-[#174873] hover:text-[#d4af37]
                    transition-all duration-200 whitespace-nowrap">
            AI Assistant
          </Link>

          <Link to="/contact"
            className="px-3 lg:px-4 py-2 sm:py-2.5 text-white text-xs lg:text-sm font-bold
                    hover:bg-[#174873] hover:text-[#d4af37]
                    transition-all duration-200 whitespace-nowrap">
            Contact
          </Link>

          <Link to="/Feedback"
            className="px-3 lg:px-4 py-2 sm:py-2.5 text-white text-xs lg:text-sm font-bold
                    hover:bg-[#174873] hover:text-[#d4af37]
                    transition-all duration-200 whitespace-nowrap">
            Feedback
          </Link>
        </div>
      </nav>

      {/* ---- MOBILE MENU PANEL ---- */}
      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
};

export default Navbar;