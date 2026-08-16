import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react'

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
  { label: "Proctorial Board", children: [
    { label: "Chief Proctor", path: "/administration/proctorial/chief" },
    { label: "University Proctorial Board", path: "/administration/proctorial/uniboard" },
  ]},
  { label: "Controller of Examination", children: [
    { label: "University", path: "/administration/examination/universityexam" },
    { label: "MMV", path: "/administration/examination/mmvexam" },
  ]},
  { label: "MMV Office Staff", path: "/administration/staff" },
];

const academicsItems = [
  { label: "NEP", path: "/academics/nep" },
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
  { label: "SWAYAM Courses", path: "/academics/swayam" },
  { label: "Section Incharge", children: [
    { label: "Science", path: "/academics/section-incharge/science"},
    { label: "Social Science", path: "/academics/section-incharge/socialscience"},
    { label: "Arts", path: "/academics/section-incharge/arts"}
  ]},
  { label: "Academic Calendar", path: "/academics/calendar" },
  { label: "Holiday List", path: "/academics/holidays" },
];

const facilitiesItems = [
  { label: "Hostels", children: [
    { label: "Chief Warden", path: "/facilities/hostels/chiefwarden" },
    { label: "Hostel Coordinator", path: "/facilities/hostels/coordinator" },
    { label: "Swasti Kunj Hostel", path: "/facilities/hostels/swastikunj" },
    { label: "Kirti Kunj Hostel", path: "/facilities/hostels/kirtikunj" },
    { label: "Kundan Devi Malviya Hostel", path: "/facilities/hostels/kundandevi" },
    { label: "Pragya Kunj Hostel", path: "/facilities/hostels/pragyakunj" },
    { label: "Jyoti Kunj Hostel", path: "/facilities/hostels/jyotikunj" },
  ]},
  { label: "Library", children: [
    { label: "Central Library", path: "/facilities/library/central" },
    { label: "Cyber Library", path: "/facilities/library/cyber" },
    { label: "MMV Library", path: "/facilities/library/mmvlibrary" },
  ]},
  { label: "Sports", children: [
    { label: "University Sports Board", path: "/facilities/sports/universitysports" },
    { label: "MMV Sports Board", path: "/facilities/sports/mmvsports" },
    { label: "Open Gym", path: "/facilities/sports/gym" },
  ]},
  { label: "Well-Being", children: [
    { label: "WBSC", path: "/facilities/wellbeing/wbsc" },
    { label: "MMV Pahal", path: "/facilities/wellbeing/mmvwell" },
  ]},
  { label: "Training & Placement", children: [
    { label: "University T&P", path: "/facilities/trainingplacement/universitytraining" },
    { label: "MMV T&P", path: "/facilities/trainingplacement/mmvtraining" },
  ]},
  { label: "Central Discovery Centre", path: "/facilities/cdc" },
  { label: "Medical", children: [
    { label: "Sir Sundarlal Hospital", path: "/facilities/medical/ssh" },
    { label: "Trauma Center", path: "/facilities/medical/tc" },
    { label: "Student Health Center", path: "/facilities/medical/health" },
  ]},
  { label: "Extra Curricular", children: [
    { label: "NCC", path: "/facilities/extracurricular/ncc" },
    { label: "NSS", path: "/facilities/extracurricular/nss" },
    { label: "NLSC", path: "/facilities/extracurricular/nlsc" },
    { label: "Diploma & Certificate Courses", path: "/facilities/extracurricular/diplomacourses" },
  ]},
  { label: "Samarth Portal", path: "/facilities/samarth" },
  { label: "Namaste BHU App", path: "/facilities/namaste" },
  { label: "Canteen", children: [
    { label: "University", path: "/facilities/canteen/universitycanteen" },
    { label: "MMV", path: "/facilities/canteen/mmvcanteen" },
  ]},
  { label: "City Delegacy", path: "/facilities/citydelegacy" },
  { label: "Other Amenities", children: [
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

// const SubSubMenu = ({ label, children }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   return (
//     <div
//   className="relative"
//   onMouseEnter={() => setIsOpen(true)}
//   onMouseLeave={() => setIsOpen(false)}
// >
//       <div className="flex items-center justify-between px-3 py-1.5
//                       text-xs lg:text-sm text-white hover:bg-[#2d54a8]
//                       border-b border-blue-800 cursor-pointer whitespace-nowrap">
//         {label}
//         <span className="text-xs ml-4">►</span>
//       </div>

//       {isOpen && (
//         <div className="absolute top-0 left-full bg-[#406BC7]
//                         shadow-lg min-w-48 z-[999] border border-blue-900">
//           {children.map((item) => (
//             <Link
//               key={item.path}
//               to={item.path}
//               className="block px-4 py-2 text-xs lg:text-sm text-white
//                          hover:bg-[#2d54a8] border-b border-blue-800 whitespace-nowrap"
//             >
//               {item.label}
//             </Link>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

const SubSubMenu = ({ label, children }) => {
  return (
    <div className="relative group/subsub">
      <div className="flex items-center justify-between px-3 py-1.5 text-xs lg:text-sm text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/60 cursor-pointer whitespace-nowrap font-medium transition-colors">
        <span>{label}</span>
        <span className="text-xs ml-3 text-white">►</span>
      </div>

      <div className="absolute top-0 left-full bg-[#0f3358] shadow-lg min-w-48 lg:min-w-48 z-[1000] border-2 border-[#d4af37] rounded-xl hidden group-hover/subsub:block">
        {children.map((item, idx) => (
          <Link
            key={item.path || idx}
            to={item.path}
            className={`block px-4 py-2 text-xs lg:text-sm text-slate-100 hover:bg-[#174873] hover:text-white border-b border-blue-900/60 whitespace-nowrap transition-colors ${idx === 0 ? "rounded-t-lg" : ""} ${idx === children.length - 1 ? "rounded-b-lg border-b-0" : ""}`}
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

// const SubMenu = ({ label, children }) => {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <div
//       className="relative"
//       onMouseEnter={() => setIsOpen(true)}
//       onMouseLeave={() => setIsOpen(false)}   
//     >
//       <div className="flex items-center justify-between px-3 py-1.5
//                       text-xs lg:text-sm text-white hover:bg-[#2d54a8]
//                       border-b border-blue-800 cursor-pointer whitespace-nowrap">
//         {label}
//         <span className="text-xs ml-4">►</span>
//       </div>

//       {isOpen && (
//         <div className="absolute top-0 left-full bg-[#406BC7]
//                         shadow-lg min-w-48 z-[999] border border-blue-900">
//           {children.map((item) =>
//             item.children ? (
//               <SubSubMenu
//                 key={item.label}
//                 label={item.label}
//                 children={item.children}
//               />
//             ) : (
//               <Link
//                 key={item.path}
//                 to={item.path}
//                 className="block px-4 py-2 text-xs lg:text-sm text-white
//                            hover:bg-[#2d54a8] border-b border-blue-800 whitespace-nowrap"
//               >
//                 {item.label}
//               </Link>
//             )
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

const SubMenu = ({ label, children }) => {
  return (
    <div className="relative group/sub">
      <div className="flex items-center justify-between px-2 py-1.5 
                      text-xs lg:text-sm text-slate-100 hover:bg-[#174873] hover:text-white border-b
                    border-blue-900/60 cursor-pointer whitespace-nowrap font-medium transition-colors">
        <span>{label}</span>
        <span className="text-xs ml-3 text-white">►</span>
      </div>

      <div className="absolute top-0 left-full bg-[#0f3358] shadow-lg min-w-48 lg:min-w-48 
                      z-[999] border-2 border-[#d4af37] rounded-xl hidden group-hover/sub:block">
        {children.map((item, idx) =>
          item.children ? (
            <SubSubMenu
              key={item.label || idx}
              label={item.label}
              children={item.children}
            />
          ) : (
            <Link
              key={item.path || idx}
              to={item.path}
              className={`block px-3 py-2 text-xs lg:text-sm text-slate-100 
                        hover:bg-[#174873] hover:text-white border-b border-blue-900/60 whitespace-nowrap 
                        transition-colors ${idx === 0 ? "rounded-t-lg" : ""} ${idx === children.length - 1 ? "rounded-b-lg border-b-0" : ""}`}
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

// const DropdownMenu = ({ title, items }) => {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <div
//       className="relative"
//       onMouseEnter={() => setIsOpen(true)}   
//       onMouseLeave={() => setIsOpen(false)}
//     >
//      <button className="flex items-center gap-1 px-2 lg:px-3 py-3 text-white
//                    text-xs lg:text-sm font-medium hover:bg-[#406BC7] 
//                    hover:text-white transition-colors duration-200 
//                    h-full whitespace-nowrap">
//         {title}
//         <span className="text-xs">▼</span>
//       </button>

//       {isOpen && (
//         <div className="absolute top-full left-0 bg-[#406BC7] shadow-lg
//                         min-w-48 z-[999] border border-blue-900">
//           {items.map((item) =>
//             item.children ? (
//               <SubMenu
//                 key={item.label}
//                 label={item.label}
//                 children={item.children}
//               />
//             ) : (
//               <Link
//                 key={item.path}
//                 to={item.path}
//                 className="block px-3 py-1.5 text-xs lg:text-sm text-white
//                            hover:bg-[#2d54a8] border-b border-blue-800 whitespace-nowrap"
//               >
//                 {item.label}
//               </Link>
//             )
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

const DropdownMenu = ({ title, items }) => {
  return (
    <div className="relative group/main">
      <button className="flex items-center gap-1.5 px-3 lg:px-5 py-3 text-white text-sm lg:text-sm font-bold 
                       hover:bg-[#174873] transition-all duration-200 h-full whitespace-nowrap cursor-pointer">
        {title}
        <span className="text-sm text-white font-bold">▼</span>
      </button>

      <div className="absolute top-full left-0 bg-[#0f3358] shadow-2xl min-w-48 lg:min-w-48 z-[999] 
                      border-2 border-[#d4af37] rounded-b-xl hidden group-hover/main:block">
        {items.map((item, idx) =>
          item.children ? (
            <SubMenu
              key={item.label || idx}
              label={item.label}
              children={item.children}
            />
          ) : (
            <Link
              key={item.path || idx}
              to={item.path}
              className={`block px-3 py-1.5 text-xs lg:text-sm text-slate-100 hover:bg-[#174873] 
                        hover:text-white border-b border-blue-900/60 whitespace-nowrap 
                        transition-colors ${idx === items.length - 1 ? "rounded-b-lg border-b-0" : ""}`}
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
// MOBILE — recursive accordion item (click-based, works on touch)
// One component handles every depth (top-level, sub, sub-sub) since it's
// just checking "does this item have children" rather than being three
// separate hover-flyout components — flyouts don't make sense on a
// narrow screen anyway, an inline expanding list does.
// ============================================
const MobileMenuItem = ({ item, depth = 0, onNavigate }) => {
  const [open, setOpen] = useState(false);

  if (item.children) {
    return (
      <div className="border-b border-blue-800/60">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between py-2 pr-3 text-sm text-white text-left"
          style={{ paddingLeft: `${16 + depth * 14}px` }}
        >
          <span>{item.label}</span>
          <span className={`text-sm transition-transform duration-200 flex-shrink-0 ml-2 ${open ? "rotate-90" : ""}`}>►</span>
        </button>
        {open && (
          <div className="bg-[#0c2a49]">
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
      className="block py-2 pr-3 text-sm text-blue-100 border-b border-blue-800/40 hover:text-white"
      style={{ paddingLeft: `${16 + depth * 14}px` }}
    >
      {item.label}
    </Link>
  );
};

// ============================================
// MOBILE — slide-in menu panel
// ============================================
const MobileMenu = ({ isOpen, onClose }) => {
  // Lock page scroll behind the panel while it's open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 z-[998] transition-opacity duration-200 md:hidden
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[82%] max-w-sm bg-[#0f3358] z-[999] shadow-2xl
          overflow-y-auto transition-transform duration-300 md:hidden
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-blue-800 sticky top-0 bg-[#0f3358] z-10">
          <span className="text-white font-semibold text-base">Menu</span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="text-white text-2xl leading-none w-6 h-6 flex font-bold items-center justify-center"
          >
            ✕
          </button>
        </div>
        <div>
          {mobileNavItems.map((item) => (
            <MobileMenuItem key={item.label} item={item} onNavigate={onClose} />
          ))}
        </div>
      </div>
    </>
  );
};


// ============================================
// THE FULL NAVBAR
// ============================================
const Navbar = () => {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const token = localStorage.getItem('token');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notices, setNotices] = useState([]);

  // const [menuOpen, setMenuOpen] = useState(false);

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
    <header className="relative z-[999] shadow-lg">         

      {/* ---- TOP BAR ---- */}
      <div className="bg-[#0f3358] text-xs sm:text-xs text-blue-200 px-3 sm:px-6 py-1.5
                      flex justify-between items-center border-b border-[#d4af37]/40">
        <div className="flex items-center gap-3">
          <span className="text-[#d4af37] font-semibold text-[11px] uppercase tracking-wider hidden sm:inline-block">
            Banaras Hindu University
          </span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-300 text-[11px] font-semibold uppercase tracking-wider sm:inline-block">Mahila Maha Vidyalaya</span>
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

      {/* ---- COLLEGE HEADER ---- */}
      <div className="bg-white px-2 sm:px-3 md:px-6 sm:py-2 flex items-center justify-between gap-1.5 sm:gap-2 md:gap-3
                        border-b border-[#d4af37]/40 shadow-sm overflow-hidden">
       
        {/* BHU Logo */}
        <div className="flex-shrink-0">
          <img
            src="/bhu/logo_bhu.png"
            alt="BHU Logo"
            className="h-10 min-[390px]:h-11 sm:h-12 md:h-16 object-contain"
        /> 
        </div> 

        {/* CENTER - MMV SAARTHI LOGO — hidden below sm so the two core
            identity logos (BHU + MMV) keep priority for space on phones */}
        <div className="flex-1 min-w-0 flex justify-center">
          <img 
            src="/mmv_saarthi_logo.png" 
            alt="mmv-saarthi-logo"
            className="w-24 h-10  min-[390px]:w-28 min-[390px]:h-11 sm:w-32 sm:h-12 md:w-44 md:h-16 object-contain" 
          />
        </div>
      
         {/* MMV Logo + Name */}
         <div className="flex items-center flex-shrink-0">
          {/* College name — desktop only */}
          <h1 className="hidden lg:block text-[#182b4f] text-lg xl:text-2xl font-bold font-cinzel leading-tight uppercase tracking-wide whitespace-nowrap mr-2">
            Mahila Maha Vidyalaya
          </h1>
          
          {/* MMV Logo */}
          <img
            src="/mmvlogo.jpeg"
            alt="MMV Logo"
            className="h-9 w-9 min-[390px]:h-10 min-[390px]:w-10 sm:h-12 sm:w-12 md:w-14 md:h-14 object-contain"
          />
        </div>

        {/* Hamburger — mobile/tablet only */}
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="lg:hidden flex-shrink-0 w-8 h-8 flex flex-col items-center justify-center gap-1 rounded hover:bg-gray-100 active:bg-gray-200"
        >
          <span className="block w-5 h-0.5 bg-[#0f3358]" />
          <span className="block w-5 h-0.5 bg-[#0f3358]" />
          <span className="block w-5 h-0.5 bg-[#0f3358]" />
        </button>
      </div>

      {/* ---- DYNAMIC MOVING NOTICE TICKER STRIP (#0f3358) ---- */}
      <div className="bg-[#0f3358] border-t border-b border-[#d4af37]/40 text-xs sm:text-sm flex items-center shadow-inner overflow-hidden relative z-20">
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
                  to="/notices"
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

      {/* ---- NAVIGATION BAR (desktop / tablet-landscape) ---- */}
      <nav className="hidden xl:flex bg-[#0f3358] px-2 border-b-2 border-[#d4af37] relative justify-end shadow-md">

        <div className='flex relative justify-end items-center'>
          <Link to="/"
            className="px-3 lg:px-5 py-3.5 text-white text-xs lg:text-sm font-bold
                    hover:bg-[#174873] hover:text-white
                    transition-colors duration-200 whitespace-nowrap">
            Home
          </Link>
          <Link to="/about"
            className="px-3 lg:px-5 py-3.5 text-white text-xs lg:text-sm font-bold
                    hover:bg-[#174873] hover:text-white
                    transition-colors duration-200 whitespace-nowrap">
            About MMV
          </Link>

          <DropdownMenu title="Administration" items={administrationItems} />
          <DropdownMenu title="Academics" items={academicsItems} />
          <DropdownMenu title="Facilities" items={facilitiesItems} />

          <Link to="/notices"
            className="px-3 lg:px-5 py-3.5 text-white text-xs lg:text-sm font-bold
                    hover:bg-[#174873] hover:text-white
                    transition-colors duration-200 whitespace-nowrap">
            Notices
        </Link>

          <Link to="/ai-assistant"
            className="px-3 lg:px-5 py-3.5 text-white text-xs lg:text-sm font-bold
                    hover:bg-[#174873] hover:text-white
                    transition-colors duration-200 whitespace-nowrap">
            AI Assistant
          </Link>

          <Link to="/contact"
            className="px-3 lg:px-5 py-3.5 text-white text-xs lg:text-sm font-bold
                    hover:bg-[#174873] hover:text-white
                    transition-colors duration-200 whitespace-nowrap">
            Contact
        </Link>
        </div>

      </nav>

      {/* ---- MOBILE MENU PANEL ---- */}
      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

    </header>
  );
};

export default Navbar;