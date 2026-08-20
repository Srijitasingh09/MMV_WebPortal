import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

// ============================================
// SHARED MENU DATA
// Category headers given a path string will navigate to their overview page when clicked.
// ============================================
const administrationItems = [
  { label: "Vice Chancellor", path: "/administration/vc" },
  { label: "MMV Principal", path: "/administration/principal" },
  { label: "Dean of Students", path: "/administration/dean" },
  { label: "Student Advisor", path: "/administration/advisor" },
  { label: "Proctorial Board", path: null, children: [
    { label: "Chief Proctor", path: "/administration/proctorial/chief" },
    { label: "University Proctorial Board", path: "/administration/proctorial/uniboard" },
  ]},
  { label: "Controller of Examination", path: null, children: [
    { label: "University", path: "/administration/examination/universityexam" },
    { label: "MMV", path: "/administration/examination/mmvexam" },
  ]},
  { label: "MMV Office Staff", path: "/administration/staff" },
];

const academicsItems = [
  { label: "NEP", path: "/academics/nep" },
  { label: "Syllabus", path: null, children: [
    { label: "Under Graduate", path: null, children: [
      { label: "Science", path: "/academics/syllabus/ug/science" },
      { label: "Social Science", path: "/academics/syllabus/ug/socialscience" },
      { label: "Arts", path: "/academics/syllabus/ug/arts" },
    ]},
    { label: "Post Graduate", path: null, children: [
      { label: "Bioinformatics", path: "/academics/syllabus/pg/bioinformatics" },
      { label: "Home Science", path: "/academics/syllabus/pg/homescience" },
      { label: "Education", path: "/academics/syllabus/pg/education" },
    ]},
  ]},
  { label: "Electives", path: "/academics/electives" },
  { label: "SWAYAM Courses", path: "/academics/swayam" },
  { label: "Section Incharge", path: null, children: [
    { label: "Science", path: "/academics/section-incharge/science"},
    { label: "Social Science", path: "/academics/section-incharge/socialscience"},
    { label: "Arts", path: "/academics/section-incharge/arts"}
  ]},
  { label: "Academic Calendar", path: "/academics/calendar" },
  { label: "Holiday List", path: "/academics/holidays" },
];

const facilitiesItems = [
  // ── Example for Hostels: Path added so clicking "Hostels" opens /facilities/hostels page ──
  { label: "Hostels", path: "/facilities/hostels", children: [
    { label: "Chief Warden", path: "/facilities/hostels/chiefwarden" },
    { label: "Hostel Coordinator", path: "/facilities/hostels/coordinator" },
    { label: "Swasti Kunj Hostel", path: "/facilities/hostels/swastikunj" },
    { label: "Kirti Kunj Hostel", path: "/facilities/hostels/kirtikunj" },
    { label: "Kundan Devi Malviya Hostel", path: "/facilities/hostels/kundandevi" },
    { label: "Pragya Kunj Hostel", path: "/facilities/hostels/pragyakunj" },
    { label: "Jyoti Kunj Hostel", path: "/facilities/hostels/jyotikunj" },
  ]},
  { label: "Library", path: null, children: [
    { label: "Central Library", path: "/facilities/library/central" },
    { label: "Cyber Library", path: "/facilities/library/cyber" },
    { label: "MMV Library", path: "/facilities/library/mmvlibrary" },
  ]},
  { label: "Sports", path: null, children: [
    { label: "University Sports Board", path: "/facilities/sports/universitysports" },
    { label: "MMV Sports Board", path: "/facilities/sports/mmvsports" },
    { label: "Open Gym & Indoor Gym", path: "/facilities/sports/gym" },
  ]},
  { label: "Well-Being", path: null, children: [
    { label: "WBSC", path: "/facilities/wellbeing/wbsc" },
    { label: "MMV Pahal", path: "/facilities/wellbeing/mmvwell" },
  ]},
  { label: "Training & Placement", path: null, children: [
    { label: "University T&P", path: "/facilities/trainingplacement/universitytraining" },
    { label: "MMV T&P", path: "/facilities/trainingplacement/mmvtraining" },
  ]},
  { label: "Central Discovery Centre", path: "/facilities/cdc" },
  { label: "Medical", path: null, children: [
    { label: "Sir Sundarlal Hospital", path: "/facilities/medical/ssh" },
    { label: "Trauma Center", path: "/facilities/medical/tc" },
    { label: "Student Health Center", path: "/facilities/medical/health" },
  ]},
  { label: "Extra Curricular", path: null, children: [
    { label: "NCC", path: "/facilities/extracurricular/ncc" },
    { label: "NSS", path: "/facilities/extracurricular/nss" },
    { label: "NLSC", path: "/facilities/extracurricular/nlsc" },
    { label: "Diploma & Certificate Courses", path: "/facilities/extracurricular/diplomacourses" },
  ]},
  { label: "Samarth Portal", path: "/facilities/samarth" },
  { label: "Namaste BHU App", path: "/facilities/namaste" },
  { label: "Canteen", path: null, children: [
    { label: "University", path: "/facilities/canteen/universitycanteen" },
    { label: "MMV", path: "/facilities/canteen/mmvcanteen" },
  ]},
  { label: "City Delegacy", path: "/facilities/citydelegacy" },
  { label: "Other Amenities", path: null, children: [
    { label: "Vishwanath Temple", path: "/facilities/other/vt" },
    { label: "Bharat Kala Bhawan", path: "/facilities/other/bkb" },
    { label: "Transportation", path: "/facilities/other/transportation" },
    { label: "Banks & Post Offices", path: "/facilities/other/banks" },
    { label: "Guest Houses", path: "/facilities/other/guesthouses" },
    { label: "Auditorium", path: "/facilities/other/auditorium" },
  ]},
];

// ── Added paths to mobileNavItems so Academics, Administration, Facilities navigate on mobile too ──
const mobileNavItems = [
  { label: "Home", path: "/" },
  { label: "About MMV", path: "/about" },
  { label: "Administration", path: "/administration", children: administrationItems },
  { label: "Academics", path: "/academics", children: academicsItems },
  { label: "Facilities", path: "/facilities", children: facilitiesItems },
  { label: "Notices", path: "/notices" },
  { label: "AI Assistant", path: "/ai-assistant" },
  { label: "Contact", path: "/contact" },
];

// ============================================
// DESKTOP — LEVEL 3 - Deepest submenu
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
        <div className="flex items-center justify-between px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 cursor-default whitespace-nowrap font-medium transition-colors">
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
// DESKTOP — LEVEL 2 - Middle submenu
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
        <div className="flex items-center justify-between px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 cursor-default whitespace-nowrap font-medium transition-colors">
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
// DESKTOP — LEVEL 1 - Main dropdown menu
// ============================================
const DropdownMenu = ({ title, path, items }) => {
  return (
    <div className="relative group/main">
      {path ? (
        <Link 
          to={path}
          className="flex items-center gap-1.5 px-3 lg:px-4 py-2 sm:py-2.5 text-white text-xs lg:text-sm font-bold hover:bg-[#174873] hover:text-[#d4af37] transition-all duration-200 h-full whitespace-nowrap cursor-pointer"
        >
          {title}
          <span className="text-[9px] text-[#d4af37] font-bold">▼</span>
        </Link>
      ) : (
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 lg:px-4 py-2 sm:py-2.5 text-white text-xs lg:text-sm font-bold hover:bg-[#174873] hover:text-[#d4af37] transition-all duration-200 h-full whitespace-nowrap cursor-default"
        >
          {title}
          <span className="text-[9px] text-[#d4af37] font-bold">▼</span>
        </button>
      )}

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
// MOBILE MENU ITEM
// ============================================
const depthStyles = [
  { bg: "bg-[#0f3358]", text: "text-white", weight: "font-bold", hover: "hover:bg-[#174873] hover:text-[#d4af37]" },
  { bg: "bg-[#133a63]", text: "text-slate-100", weight: "font-semibold", hover: "hover:bg-[#1b4d7e] hover:text-[#f4d580]" },
  { bg: "bg-[#091f38]", text: "text-amber-200", weight: "font-medium", hover: "hover:bg-[#12314f] hover:text-[#fce8b2]" },
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
              className={`flex-1 py-3 text-xs sm:text-sm text-left transition-colors cursor-default ${style.bg} ${style.text} ${style.weight}`}
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
// MOBILE MENU PANEL
// ============================================
const MobileMenu = ({ isOpen, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-[998] transition-opacity duration-200 md:hidden
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />
      <div
        className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-[#081a2f] z-[999] shadow-2xl
          overflow-y-auto transition-transform duration-300 md:hidden border-l-2 border-[#d4af37]
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-[#d4af37] bg-[#0f3358] z-10 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37]" />
            <span className="text-white font-bold font-cinzel text-base tracking-wide">MMV Menu</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="text-slate-300 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700 bg-white/5"
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
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const token = localStorage.getItem('token');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notices, setNotices] = useState([]);
  const [headerVisible, setHeaderVisible] = useState(true);

  const isHomePage = location.pathname === '/';
  const autoHideTimerRef = useRef(null);
  const hoverTimerRef = useRef(null);

  const clearTimers = () => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  // Auto-hide header after 5 seconds on non-home pages upon page load or navigation
  useEffect(() => {
    clearTimers();
    setHeaderVisible(true);

    if (!isHomePage) {
      autoHideTimerRef.current = setTimeout(() => {
        setHeaderVisible(false);
      }, 5000);
    }

    return () => clearTimers();
  }, [location.pathname, isHomePage]);

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
        // Fallback gracefully
      }
    };
    fetchNotices();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    navigate('/login');
  };

  const handleMouseMove = (e) => {
    if (isHomePage) return;

    // Clear auto-hide timer if active
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }

    // Check if user is hovering over interactive buttons / links / dropdown items
    const isOverButton = Boolean(e.target.closest('a, button, [role="button"], input, select'));

    if (isOverButton) {
      // If hovering over buttons/links, cancel the 3-second reveal timer so header stays hidden
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    } else {
      // If hovering over empty background space (not buttons), start 3-second timer to reveal header
      if (!hoverTimerRef.current && !headerVisible) {
        hoverTimerRef.current = setTimeout(() => {
          setHeaderVisible(true);
        }, 3000);
      }
    }
  };

  const handleMouseLeave = () => {
    if (isHomePage) return;

    // Clear hover timer if mouse leaves
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    // Auto-hide header 5 seconds after mouse leaves
    if (!autoHideTimerRef.current) {
      autoHideTimerRef.current = setTimeout(() => {
        setHeaderVisible(false);
      }, 5000);
    }
  };

  return (
    <div 
      onMouseMove={handleMouseMove} 
      onMouseLeave={handleMouseLeave}
      className="w-full sticky top-0 z-[990] bg-[#0f3358]"
    >
      {/* Collapsible Header Container */}
      <div 
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${
          headerVisible || isHomePage 
            ? "grid-rows-[1fr] opacity-100" 
            : "grid-rows-[0fr] opacity-0 overflow-hidden pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <header className="w-full bg-[#0f3358]">
            {/* Top-most view line */}
            <div className="bg-[#0f3358] text-xs text-slate-200 px-3 sm:px-6 py-1.5 flex justify-between items-center border-b border-[#d4af37]/40">
              <div className="flex items-center gap-3">
               <span className="text-[#d4af37] text-xs sm:text-sm font-bold font-cinzel leading-tight tracking-wide whitespace-normal block">
                 Mahila Mahavidyalaya
               </span>
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

            {/* Main Branding Header Bar */}
            <div className="bg-white px-3 sm:px-8 py-3 flex items-center justify-between gap-2 sm:gap-3 border-b border-[#d4af37]/40 shadow-sm">
              {/* Desktop & Mobile Left: BHU Logo */}
              <div className="flex-shrink-0">
                <img
                  src="/bhu/logo_bhu.png"
                  alt="BHU Logo"
                  className="h-9 sm:h-14 md:h-16 rounded-2xl object-contain"
                />
              </div>

              {/* Desktop Center: MMV Saarthi Logo (hidden on mobile) */}
              <div className="hidden md:block flex-shrink-0 bg-transparent">
                <img 
                  src="/mmv_saarthi_logo.png" 
                  alt="mmv-saarthi-logo"
                  className="w-24 h-9 sm:w-32 sm:h-12 md:w-40 md:h-14 object-contain rounded-2xl" 
                />
              </div>

              {/* Desktop Right: MMV Title + MMV Logo (hidden on mobile) */}
              <div className="hidden md:flex items-center gap-2 sm:gap-3 min-w-0">
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
                    className="h-9 w-9 sm:h-14 sm:w-14 md:w-16 md:h-16 rounded-2xl object-contain"
                  />
                </div>
              </div>

              {/* Mobile Right: MMV Saarthi Logo + Hamburger Button (hidden on desktop) */}
              <div className="md:hidden flex items-center gap-2 flex-shrink-0">
                <img 
                  src="/mmv_saarthi_logo.png" 
                  alt="mmv-saarthi-logo"
                  className="w-24 h-9 sm:w-32 object-contain rounded-2xl" 
                />
                <button
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
                  className="p-2 rounded-lg hover:bg-slate-100 text-[#353375] border border-[#353375]/20"
                >
                  <span className="block w-6 h-0.5 bg-[#353375] mb-1" />
                  <span className="block w-6 h-0.5 bg-[#353375] mb-1" />
                  <span className="block w-6 h-0.5 bg-[#353375]" />
                </button>
              </div>
            </div>

            {/* Announcements Bar */}
            <div className="bg-[#0f3358] border-t border-b-2 border-[#d4af37] md:border-b md:border-[#d4af37]/40 text-xs sm:text-sm flex items-center shadow-inner overflow-hidden relative z-20">
              <div className="bg-[#7d311f] text-white px-3 sm:px-4 py-1.5 font-bold uppercase tracking-wider flex items-center gap-2 z-30 shadow-md flex-shrink-0 border-r border-[#d4af37]/50">
                <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-ping" />
                <span className="text-[10px] sm:text-xs font-cinzel text-[#fce8b2]">Announcements</span>
              </div>

              <div className="overflow-hidden whitespace-nowrap py-1.5 flex-1 relative bg-[#0f3358]">
                <div className="inline-flex animate-marquee hover:[animation-play-state:paused] items-center">
                  {notices.length > 0 ? (
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
        </div>
      </div>

      {/* ── Navigation Bar (Stays visible at top) ── */}
      <nav className="bg-[#0f3358] px-4 border-b-2 border-[#d4af37] shadow-lg">
        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-between py-2 px-1">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-[#d4af37] font-bold font-cinzel text-sm tracking-wide">MMV BHU</span>
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="p-1.5 rounded-lg hover:bg-slate-700 text-white border border-[#d4af37]/40 flex items-center gap-1.5 text-xs font-semibold"
          >
            <span>Menu</span>
            <span className="block w-4 h-0.5 bg-[#d4af37] my-0.5"></span>
          </button>
        </div>

        {/* Desktop Navigation Row */}
        <div className="hidden md:flex relative justify-end items-center">
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

      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </div>
  );
};

export default Navbar;
