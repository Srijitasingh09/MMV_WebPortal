import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { getToken, isAdmin as isAdminSession, clearSession } from '../utils/auth';

// ============================================
// SHARED MENU DATA
// Only items with REAL pages have a `path` property.
// Items with children that have NO page omit `path`.
// ============================================
// Helper to detect external URLs (starting with http:// or https://)
const isExternalUrl = (url) => {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
};

const administrationItems = [
  { label: "Vice Chancellor", path: "https://www.bhu.ac.in/Site/Page/1_3251_4734_Main-Site-Vice-Chancellor", target: "_blank" },
  { label: "MMV Principal", path: "https://www.bhu.ac.in/Site/Page/1_184_1233_436_Mahila-Maha-Vidyalaya-Principal", target : "_blank" },
  { label: "Dean of Students", path: "https://bhu.ac.in/Site/UnitHomeTemplate/1_3256_6912_Dean-of-Students-Home" , target : "_blank" },
  { label: "Student Advisor", path: "/administration/advisor" },
  { label: "Proctorial Board", children: [
    { label: "Chief Proctor", path: "https://www.bhu.ac.in/Site/UnitHomeTemplate/1_3258_6569_Main-Site-Chief-Proctor" , target : "_blank" },
    { label: "University Proctorial Board", path: "https://www.bhu.ac.in/Site/Page/1_3258_4738_Chief-Proctor-Office-Proctorial-Board", target : "_blank" },
  ]},
  { label: "Controller of Examination", children: [
    { label: "University", path: "https://bhu.ac.in/Site/UnitHomeTemplate/1_3255_4727_Controller-of-Examinations-Home" , target : "_blank"},
    { label: "MMV", path: "/administration/examination/mmvexam" },
  ]},
  { label: "MMV Office Staff", path: "/administration/staff" },
];

const academicsItems = [
  { label: "NEP", path: "/academics/nep"},
  { label: "Syllabus", children: [
    { label: "Under Graduate", children: [
      { label: "Science", path: "/academics/syllabus/ug/science" },
      { label: "Social Science", path: "/academics/syllabus/ug/socialscience" },
      { label: "Arts", path: "/academics/syllabus/ug/arts" },
    ]},
    { label: "Post Graduate", children: [
      { label: "Bioinformatics", path: "/academics/syllabus/pg/bioinformatics" },
      { label: "Home Science", path: "/academics/syllabus/pg/homescience" },
      { label: "Education", path: "/academics/syllabus/pg/education" },
    ]},
  ]},
  { label: "Electives", path: "/academics/electives" },
  { label: "SWAYAM Courses", path: "https://www.bhu.ac.in/Site/UnitHomeTemplate/1_3402_7001" , target :"_blank" },
  { label: "Incharge", children: [
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
//    { label: "Library", children: [
// -    { label: "Central Library", path: "/facilities/library/central" },
// -    { label: "Cyber Library", path: "/facilities/library/cyber" },
  { label: "Libraries",path : "/facilities/library" },
  ,
  { label: "Sports", children: [
    { label: "University Sports Board", path: "https://www.bhu.ac.in/site/UnitHomeTemplate/1_3281_4800_Main-Site-University-Sports-Boards" , target:"_blank" },
    { label: "MMV Sports Board", path: "/facilities/sports/mmvsports" },
    { label: "Gym", path: "/facilities/sports/gym" },
  ]},
  { label: "Well-Being", children: [
    { label: "WBSC", path: "https://www.bhu.ac.in/site/UnitHomeTemplate/2_3247_4690_Well-Being-Services-Cell-(WBSC)-Home",target:"_blank" },
    { label: "MMV Pahal", path: "/facilities/wellbeing/mmvwell" },
  ]},
  { label: "Training & Placement", children: [
    { label: "University T&P", path: "https://www.bhu.ac.in/Site/Page/1_3246_4682_Placement-and-Internship-Cell-Home",target:"_blank" },
    { label: "MMV T&P", path: "/facilities/trainingplacement/mmvtraining" },
  ]},
  { label: "Central Discovery Centre", path: "https://bhu.ac.in/Site/UnitHomeTemplate/1_3364_6480_Main-Site-CDC",target:"_blank" },
  // { label: "Medical", children: [
  //   { label: "Sir Sundarlal Hospital", path: "/facilities/medical/ssh" },
  //   { label: "Trauma Center", path: "/facilities/medical/tc" },
  //   { label: "Student Health Center", path: "/facilities/medical/health" },
  // ]},

   { label: "Medical",path : "/facilities/medical" },

    { label: "Extra Curricular",path : "/facilities/extracurricular" },
  
  // { label: "Extra Curricular", children: [
  //   { label: "NCC", path: "/facilities/extracurricular/ncc" },
  //   { label: "NSS", path: "/facilities/extracurricular/nss" },
  //   { label: "NLSC", path: "/facilities/extracurricular/nlsc" },
  //   { label: "Diploma & Certificate Courses", path: "/facilities/extracurricular/diplomacourses" },
  // ]},
  { label: "Samarth Portal", path: "/facilities/samarth" },
  { label: "Namaste BHU App", path: "/facilities/namaste" },
  { label: "Canteen", children: [
    { label: "University", path: "/facilities/canteen/universitycanteen" },
    { label: "MMV", path: "/facilities/canteen/mmvcanteen" },
  ]},
  { label: "City Delegacy", path: "https://bhu.ac.in/Site/UnitHomeTemplate/1_3400_6944_City-Delegacies-Home",target:"_blank" },
 
   { label: "Other Amenties",path : "/facilities/other" }, 
  // { label: "Other Amenities", children: [
  //   { label: "Vishwanath Temple", path: "/facilities/other/vt" },
  //   { label: "Bharat Kala Bhawan", path: "/facilities/other/bkb" },
  //   { label: "Transportation", path: "/facilities/other/transportation" },
  //   { label: "Banks & Post Offices", path: "/facilities/other/banks" },
  //   { label: "Guest Houses", path: "/facilities/other/guesthouses" },
  //   { label: "Auditorium", path: "/facilities/other/auditorium" },
  // ]},
];

// Mobile menu structure with valid top-level routes.
const mobileNavItems = [
  { label: "Home", path: "/" },
  { label: "About MMV", path: "/about" },
  { label: "Administration", path: "/administration", children: administrationItems },
  { label: "Academics", path: "/academics", children: academicsItems },
  { label: "Facilities", path: "/facilities", children: facilitiesItems },
  { label: "Notices", path: "/notices" },
  { label: "News", path: "/news" },
  { label: "Contact", path: "/contact" },
  { label: "Feedback", path: "/feedback" },
];

// ============================================
// DESKTOP — LEVEL 3
// ============================================
const SubSubMenu = ({ label, path, children }) => {
  const isExt = isExternalUrl(path);
  return (
    <div className="relative group/subsub">
      {path ? (
        isExt ? (
          <a
            href={path}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 cursor-pointer whitespace-nowrap font-medium transition-colors"
          >
            <span>{label}</span>
            <span className="text-[10px] ml-2.5 text-[#d4af37]">►</span>
          </a>
        ) : (
          <Link
            to={path}
            className="flex items-center justify-between px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 cursor-pointer whitespace-nowrap font-medium transition-colors"
          >
            <span>{label}</span>
            <span className="text-[10px] ml-2.5 text-[#d4af37]">►</span>
          </Link>
        )
      ) : (
        <div className="flex items-center justify-between px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 cursor-default whitespace-nowrap font-medium transition-colors">
          <span>{label}</span>
          <span className="text-[10px] ml-2.5 text-[#d4af37]">►</span>
        </div>
      )}

      <div className="absolute top-0 left-full bg-[#0f3358] shadow-2xl min-w-52 lg:min-w-60 z-[1000] border-2 border-[#d4af37] rounded-xl hidden group-hover/subsub:block">
        {children.map((item, idx) => {
          const isItemExt = isExternalUrl(item.path) || item.target === '_blank';
          return item.children ? (
            <SubSubMenu key={item.label || idx} label={item.label} path={item.path} children={item.children} />
          ) : isItemExt ? (
            <a
              key={item.path || idx}
              href={item.path || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`block px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 whitespace-nowrap transition-colors ${idx === 0 ? "rounded-t-lg" : ""} ${idx === children.length - 1 ? "rounded-b-lg border-b-0" : ""}`}
            >
              {item.label}
            </a>
          ) : (
            <Link
              key={item.path || idx}
              to={item.path || "#"}
              onClick={(e) => { if (!item.path) e.preventDefault(); }}
              className={`block px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 whitespace-nowrap transition-colors ${idx === 0 ? "rounded-t-lg" : ""} ${idx === children.length - 1 ? "rounded-b-lg border-b-0" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// DESKTOP — LEVEL 2
// ============================================
const SubMenu = ({ label, path, children }) => {
  const isExt = isExternalUrl(path);
  return (
    <div className="relative group/sub">
      {path ? (
        isExt ? (
          <a
            href={path}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 cursor-pointer whitespace-nowrap font-medium transition-colors"
          >
            <span>{label}</span>
            <span className="text-[10px] ml-2.5 text-[#d4af37]">►</span>
          </a>
        ) : (
          <Link
            to={path}
            className="flex items-center justify-between px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 cursor-pointer whitespace-nowrap font-medium transition-colors"
          >
            <span>{label}</span>
            <span className="text-[10px] ml-2.5 text-[#d4af37]">►</span>
          </Link>
        )
      ) : (
        <div className="flex items-center justify-between px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 cursor-default whitespace-nowrap font-medium transition-colors">
          <span>{label}</span>
          <span className="text-[10px] ml-2.5 text-[#d4af37]">►</span>
        </div>
      )}

      <div className="absolute top-0 left-full bg-[#0f3358] shadow-2xl min-w-52 lg:min-w-60 z-[1000] border-2 border-[#d4af37] rounded-xl hidden group-hover/sub:block">
        {children.map((item, idx) => {
          const isItemExt = isExternalUrl(item.path) || item.target === '_blank';
          return item.children ? (
            <SubSubMenu
              key={item.label || idx}
              label={item.label}
              path={item.path}
              children={item.children}
            />
          ) : isItemExt ? (
            <a
              key={item.path || idx}
              href={item.path || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`block px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 whitespace-nowrap transition-colors ${idx === 0 ? "rounded-t-lg" : ""} ${idx === children.length - 1 ? "rounded-b-lg border-b-0" : ""}`}
            >
              {item.label}
            </a>
          ) : (
            <Link
              key={item.path || idx}
              to={item.path || "#"}
              onClick={(e) => { if (!item.path) e.preventDefault(); }}
              className={`block px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 whitespace-nowrap transition-colors ${idx === 0 ? "rounded-t-lg" : ""} ${idx === children.length - 1 ? "rounded-b-lg border-b-0" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// DESKTOP — LEVEL 1
// ============================================
const DropdownMenu = ({ title, path, items }) => {
  const isExt = isExternalUrl(path);
  return (
    <div className="relative group/main">
      {isExt ? (
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 lg:px-4 py-2 sm:py-2.5 text-white text-xs lg:text-sm font-bold hover:bg-[#174873] hover:text-[#d4af37] transition-all duration-200 h-full whitespace-nowrap cursor-pointer"
        >
          {title}
          <span className="text-[9px] text-[#d4af37] font-bold">▼</span>
        </a>
      ) : (
        <Link 
          to={path}
          className="flex items-center gap-1.5 px-3 lg:px-4 py-2 sm:py-2.5 text-white text-xs lg:text-sm font-bold hover:bg-[#174873] hover:text-[#d4af37] transition-all duration-200 h-full whitespace-nowrap cursor-pointer"
        >
          {title}
          <span className="text-[9px] text-[#d4af37] font-bold">▼</span>
        </Link>
      )}

      <div className="absolute top-full left-0 bg-[#0f3358] shadow-2xl min-w-52 lg:min-w-60 z-[999] border-2 border-[#d4af37] rounded-b-xl hidden group-hover/main:block">
        {items.map((item, idx) => {
          const isItemExt = isExternalUrl(item.path) || item.target === '_blank';
          return item.children ? (
            <SubMenu
              key={item.label || idx}
              label={item.label}
              path={item.path}
              children={item.children}
            />
          ) : isItemExt ? (
            <a
              key={item.path || idx}
              href={item.path || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`block px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 whitespace-nowrap transition-colors ${idx === items.length - 1 ? "rounded-b-lg border-b-0" : ""}`}
            >
              {item.label}
            </a>
          ) : (
            <Link
              key={item.path || idx}
              to={item.path || "#"}
              onClick={(e) => { if (!item.path) e.preventDefault(); }}
              className={`block px-3.5 py-1.5 text-xs lg:text-[13px] text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/50 whitespace-nowrap transition-colors ${idx === items.length - 1 ? "rounded-b-lg border-b-0" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// MOBILE MENU ITEM
// ============================================
const depthStyles = [
  {
    bg: "bg-[#0f3358]",
    text: "text-white",
    weight: "font-bold",
    hover: "hover:bg-[#174873] hover:text-[#d4af37]",
  },
  {
    bg: "bg-[#133a63]",
    text: "text-slate-100",
    weight: "font-semibold",
    hover: "hover:bg-[#1b4d7e] hover:text-[#f4d580]",
  },
  {
    bg: "bg-[#091f38]",
    text: "text-amber-200",
    weight: "font-medium",
    hover: "hover:bg-[#12314f] hover:text-[#fce8b2]",
  },
];

const highlightStyle = {
  bg: "bg-amber-300",
  text: "text-[#0f3358]",
  weight: "font-bold",
  hover: "hover:bg-amber-400",
};

const MobileMenuItem = ({ item, depth = 0, onNavigate }) => {
  const [open, setOpen] = useState(false);

  const style = item.highlight ? highlightStyle : depthStyles[Math.min(depth, depthStyles.length - 1)];
  const indentPad = 16 + depth * 14;
  const isExt = isExternalUrl(item.path) || item.target === '_blank';

  if (item.children) {
    return (
      <div>
        <div className="flex items-center justify-between">
          {item.path ? (
            isExt ? (
              <a
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onNavigate}
                className={`flex-1 py-3 text-xs sm:text-sm text-left transition-colors cursor-pointer ${style.bg} ${style.text} ${style.weight} ${style.hover}`}
                style={{ paddingLeft: `${indentPad}px` }}
              >
                <span className={depth === 0 ? "font-cinzel tracking-wide" : ""}>{item.label}</span>
              </a>
            ) : (
              <Link
                to={item.path}
                onClick={onNavigate}
                className={`flex-1 py-3 text-xs sm:text-sm text-left transition-colors cursor-pointer ${style.bg} ${style.text} ${style.weight} ${style.hover}`}
                style={{ paddingLeft: `${indentPad}px` }}
              >
                <span className={depth === 0 ? "font-cinzel tracking-wide" : ""}>{item.label}</span>
              </Link>
            )
          ) : (
            <span
              onClick={() => setOpen((o) => !o)}
              className={`flex-1 py-3 text-xs sm:text-sm text-left transition-colors cursor-pointer ${style.bg} ${style.text} ${style.weight}`}
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

  if (isExt) {
    return (
      <a
        href={item.path}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className={`block py-3 pr-4 text-xs sm:text-sm transition-colors ${style.bg} ${style.text} ${style.weight} ${style.hover}`}
        style={{ paddingLeft: `${indentPad}px` }}
      >
        <span className={depth === 0 ? "font-cinzel tracking-wide" : ""}>{item.label}</span>
      </a>
    );
  }

  return (
    <Link
      to={item.path || "#"}
      onClick={(e) => {
        if (!item.path) {
          e.preventDefault();
        } else {
          onNavigate();
        }
      }}
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
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-[1299] transition-opacity duration-200 md:hidden
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />
      <div
        className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-[#081a2f] z-[1300] shadow-2xl
          overflow-y-auto transition-transform duration-300 md:hidden border-l-2 border-[#d4af37]
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-[#d4af37] sticky top-0 bg-[#0f3358] z-10 shadow-md">
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
  const isHomePage = location.pathname.toLowerCase() === '/' || location.pathname.toLowerCase() === '/home';
  // Read per-tab (sessionStorage) and derived from the signed JWT, so this
  // no longer flips just because some other tab in the browser logged in
  // or out as admin.
  const isAdmin = isAdminSession();
  const isAdminPage = location.pathname.toLowerCase().startsWith('/admin');
  const token = getToken();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notices, setNotices] = useState([]);

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  const isDisableCollapse = isHomePage || isMobile || isAdmin || isAdminPage;

  const [headerVisible, setHeaderVisible] = useState(true);
  const autoHideTimerRef = useRef(null);
  const hoverTimerRef = useRef(null);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handleChange = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

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

  useEffect(() => {
    clearTimers();
    setHeaderVisible(true);

    if (!isDisableCollapse) {
      autoHideTimerRef.current = setTimeout(() => {
        setHeaderVisible(false);
      }, 5000);
    }

    return () => clearTimers();
  }, [location.pathname, isDisableCollapse]);

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
    clearSession();
    navigate('/login');
  };

  const handleMouseMove = (e) => {
    if (isDisableCollapse) return;

    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }

    const isOverButton = Boolean(e.target.closest('a, button, [role="button"], input, select'));

    if (isOverButton) {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    } else {
      if (!hoverTimerRef.current && !headerVisible) {
        hoverTimerRef.current = setTimeout(() => {
          setHeaderVisible(true);
        }, 2000);
      }
    }
  };

  const handleMouseLeave = () => {
    if (isDisableCollapse) return;

    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

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
          headerVisible || isDisableCollapse
            ? "grid-rows-[1fr] opacity-100" 
            : "grid-rows-[0fr] opacity-0 overflow-hidden pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <header className="w-full bg-[#0f3358]">
            {/* Top-most view line */}
            <div className="bg-[#0f3358] text-xs text-slate-200 px-3 sm:px-6 py-1.5 flex justify-between items-center border-b border-[#d4af37]/40">
              <div className="flex items-center gap-3">
                <span className="text-[#d4af37] text-xs sm:text-xs font-bold font-cinzel leading-tight tracking-wide whitespace-normal block">
                  <span className="sm:hidden">Mahila Mahavidyalaya</span>
                  <span className="hidden sm:inline">Banaras Hindu University | Mahila Mahavidyalaya</span>
                </span>
              </div>

              {token && isAdmin && (
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
              )}
            </div>

            {/* Main Branding Header Bar */}
            <div className="relative bg-white px-3 sm:px-8 py-3 flex items-center justify-between gap-2 sm:gap-3 border-b border-[#d4af37]/40 shadow-sm">
              <div className="flex-shrink-0">
                 <a href="https://www.bhu.ac.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit BHU Website">
                  <img
                    src="/bhu/logo_bhu.png"
                    alt="BHU Logo"
                    className="h-9 sm:h-14 md:h-16 rounded-2xl object-contain cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </a>
              </div>

              {/* Sarthi Logo */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex-shrink-0">
                <img
                  src="/bhu/MMV SarthiLogo.jpeg"
                  alt="Center Logo"
                  className="h-9 sm:h-14 md:h-13 rounded-2xl object-contain scale-150"
                />
              </div>

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
                  <a href="https://www.bhu.ac.in/site/UnitHomeTemplate/1_184_1231_Mahila-Maha-Vidyalaya-Home"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit BHU Website">
                  <img
                    src="/mmvlogo.jpeg"
                    alt="MMV Logo"
                    className="h-9 w-9 sm:h-14 sm:w-14 md:w-16 md:h-16 rounded-2xl object-contain"
                  />
                  </a>
                </div>
              </div>

              {/* Mobile View Right Side: MMV Logo only (no text) + Menu Toggle Button */}
              <div className="md:hidden flex items-center gap-2 flex-shrink-0">
                <div className="min-w-0 text-right">
                  <h1 className="text-[#353375] text-xs sm:text-md md:text-2xl font-bold font-cinzel leading-tight tracking-wide whitespace-normal">
                    Mahila Mahavidyalaya
                  </h1>
                  <p className="text-[9px] sm:text-xs text-[#353375] font-semibold tracking-wider uppercase whitespace-normal">
                    Varanasi
                  </p>
                </div>
                 <a href="https://www.bhu.ac.in/site/UnitHomeTemplate/1_184_1231_Mahila-Maha-Vidyalaya-Home"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit BHU Website">
                <img
                  src="/mmvlogo.jpeg"
                  alt="MMV Logo"
                  className="h-9 w-9 rounded-2xl object-contain"
                />
                </a>
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
                      <span className="text-[#d4af37] font-semibold">Welcome to Mahila Mahavidyalaya (MMV) Portal — Banaras Hindu University</span>
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
        {/* Desktop Navigation Row */}
        <div className="hidden md:flex relative justify-end items-center">
          <Link to="/"
            className="px-3 lg:px-4 py-2 sm:py-2.5 text-white text-xs lg:text-sm font-bold
                    hover:bg-[#174873] hover:text-[#d4af37]
                    transition-all duration-200 whitespace-nowrap">
            Home
          </Link>
          <Link to="/OurVision"
            className="px-3 lg:px-4 py-2 sm:py-2.5 text-white text-xs lg:text-sm font-bold
                    hover:bg-[#174873] hover:text-[#d4af37]
                    transition-all duration-200 whitespace-nowrap">
            Our Vision
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

          <Link to="/News"
            className="px-3 lg:px-4 py-2 sm:py-2.5 text-white text-xs lg:text-sm font-bold
                    hover:bg-[#174873] hover:text-[#d4af37]
                    transition-all duration-200 whitespace-nowrap">
            News
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
    </div>
  );
};

export default Navbar;