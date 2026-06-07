// import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import React from 'react'
import { useState } from 'react'

// ============================================
// LEVEL 3 - Deepest submenu
// ============================================
const SubSubMenu = ({ label, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
  className="relative"
  onMouseEnter={() => setIsOpen(true)}
  onMouseLeave={() => setIsOpen(false)}
>
      <div className="flex items-center justify-between px-4 py-2
                      text-sm text-white hover:bg-[#2d54a8]
                      border-b border-blue-800 cursor-pointer">
        {label}
        <span className="text-xs ml-4">►</span>
      </div>

      {isOpen && (
        <div className="absolute top-0 left-full bg-[#406BC7]
                        shadow-lg min-w-48 z-[999] border border-blue-900">
          {children.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="block px-4 py-2 text-sm text-white
                         hover:bg-[#2d54a8] border-b border-blue-800"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};


// ============================================
// LEVEL 2 - Middle submenu
// ============================================
const SubMenu = ({ label, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="flex items-center justify-between px-4 py-2
                      text-sm text-white hover:bg-[#2d54a8]
                      border-b border-blue-800 cursor-pointer">
        {label}
        <span className="text-xs ml-4">►</span>
      </div>

      {isOpen && (
        <div className="absolute top-0 left-full bg-[#406BC7]
                        shadow-lg min-w-48 z-[999] border border-blue-900">
          {children.map((item) =>
            item.children ? (
              <SubSubMenu
                key={item.label}
                label={item.label}
                children={item.children}
              />
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className="block px-4 py-2 text-sm text-white
                           hover:bg-[#2d54a8] border-b border-blue-800"
              >
                {item.label}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
};


// ============================================
// LEVEL 1 - Main dropdown menu
// ============================================
const DropdownMenu = ({ title, items }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
     <button className="flex items-center gap-1 px-4 py-3 text-gray-800
                   text-sm font-medium hover:bg-[#406BC7]
                   hover:text-white transition-colors duration-200
                   h-full">
        {title}
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 bg-[#406BC7] shadow-lg
                        min-w-48 z-[999] border border-blue-900">
          {items.map((item) =>
            item.children ? (
              <SubMenu
                key={item.label}
                label={item.label}
                children={item.children}
              />
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className="block px-4 py-2 text-sm text-white
                           hover:bg-[#2d54a8] border-b border-blue-800"
              >
                {item.label}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
};


// ============================================
// THE FULL NAVBAR
// ============================================
const Navbar = () => {
  return (
    <div className="relative z-[999]">

      {/* ---- TOP BAR ---- */}
      <div className="bg-[#0f3358] text-xs text-blue-200 px-6 py-1
                      flex justify-end gap-6">
        {/* <span>Banaras Hindu University</span> */}
        <a href="/login" className="text-[#0f3358] hover:text-white">
          Admin
        </a>
      </div>

      {/* ---- COLLEGE HEADER ---- */}
      <div className="bg-[#174873] px-6 py-3 flex items-center justify-between">
       
        {/* RIGHT SIDE - BHU Logo */}
       <div className="flex items-center gap-3">
  <img
    src="/bhulogo.png"
    alt="BHU Logo"
    className="w-14 h-14 rounded-full object-contain bg-white"
  />

  <div className="flex flex-col">
    <h1 className="text-white text-lg font-medium">
      Banaras Hindu University
    </h1>

    <p className="text-blue-200 text-xs">
      Varanasi — 221005
    </p>
  </div>
</div>
         {/* LEFT SIDE - MMV Logo + Name */}
         <div className="flex items-center gap-4">
         
          <div>
            <h1 className="text-white text-lg font-medium">
              Mahila Maha Vidyalaya
            </h1>
            {/* <p className="text-blue-200 text-xs">
              Banaras Hindu University, Varanasi — Est. 1929
            </p> */}
          </div>
           <img
            src="/mmvlogo.jpeg"
            alt="MMV Logo"
            className="w-14 h-14 rounded-full object-contain bg-white"
          />
        </div>


      </div>

      {/* ---- NAVIGATION BAR ---- */}
      <nav className="bg-white flex px-4 border-b border-gray-200 relative">

        <Link to="/"
          className="px-4 py-3 text-gray-800 text-sm font-medium
                     hover:bg-[#406BC7] hover:text-white
                     transition-colors duration-200">
          Home
        </Link>
        <Link to="/about"
          className="px-4 py-3 text-gray-800 text-sm font-medium
                     hover:bg-[#406BC7] hover:text-white
                     transition-colors duration-200">
          About MMV
        </Link>



        <DropdownMenu
          title="Administration"
          items={[
            { label: "Vice Chancellor", path: "/administration/vc" },
            { label: "MMV Principal", path: "/administration/principal" },
            { label: "Dean of Students", path: "/administration/dean" },
            { label: "Student Advisor", path: "/administration/advisor" },
            { label: "Proctorial Board", children: [
              { label: "Chief Proctor", path: "/administration/proctorial/chief" },
              { label: "University Board", path: "/administration/proctorial/uniboard" },
            ]},
            { label: "Controller of Examination", children: [
              { label: "University", path: "/administration/examination/universityexam" },
              { label: "MMV", path: "/administration/examination/mmvexam" },
            ]},
            { label: "MMV Office Staff", path: "/administration/staff" },
          ]}
        />

        <DropdownMenu
          title="Academics"
          items={[
            { label: "NEP", path: "/academics/nep" },
            { label: "Syllabus", children: [
              { label: "UG", children: [
                { label: "Science", path: "/academics/syllabus/ug/science" },
                { label: "Social Science", path: "/academics/syllabus/ug/socialscience" },
                { label: "Arts", path: "/academics/syllabus/ug/arts" },
              ]},
              { label: "PG", path: "/academics/syllabus/pg" },
            ]},
            { label: "Electives", path: "/academics/electives" },
            { label: "SWAYAM Courses", path: "/academics/swayam" },
            { label: "Section Incharge", path: "/academics/section-incharge" },
            { label: "Academic Calendar", path: "/academics/calendar" },
            { label: "Holiday List", path: "/academics/holidays" },
          ]}
        />

        <DropdownMenu
          title="Facilities"
          items={[
            { label: "Hostels", children: [
              { label: "Chief Warden", path: "/facilities/hostels/chiefwarden" },
              { label: "Hostel Coordinator", path: "/facilities/hostels/coordinator" },
              { label: "Kirti Kunj", path: "/facilities/hostels/kirtikunj" },
              { label: "Swasti Kunj", path: "/facilities/hostels/swastikunj" },
              { label: "Pragya Kunj", path: "/facilities/hostels/pragyakunj" },
              { label: "Jyoti Kunj", path: "/facilities/hostels/jyotikunj" },
              { label: "Kundan Devi", path: "/facilities/hostels/kundandevi" },
            ]},
            { label: "Library", children: [
              { label: "Central", path: "/facilities/library/central" },
              { label: "Cyber", path: "/facilities/library/cyber" },
              { label: "MMV", path: "/facilities/library/mmvlibrary" },
            ]},
            { label: "Sports", children: [
              { label: "University", path: "/facilities/sports/universitysports" },
              { label: "MMV", path: "/facilities/sports/mmvsports" },
              { label: "Gym", path: "/facilities/sports/gym" },
            ]},
            { label: "Well-being", children: [
              { label: "University", path: "/facilities/wellbeing/universitywell" },
              { label: "MMV", path: "/facilities/wellbeing/mmvwell" },
            ]},
            { label: "Training & Placement", children: [
              { label: "University", path: "/facilities/trainingplacement/universitytraining" },
              { label: "MMV", path: "/facilities/trainingplacement/mmvtraining" },
            ]},
            { label: "CDC", path: "/facilities/cdc" },
            { label: "Medical", children: [
              { label: "Sir Sundarlal Hospital", path: "/facilities/medical/ssr" },
              { label: "Trauma Center", path: "/facilities/medical/tc" },
              { label: "Health Center", path: "/facilities/medical/health" },
            ]},
            { label: "Extra Curricular", children: [
              { label: "NCC", path: "/facilities/extracurricular/ncc" },
              { label: "NSS", path: "/facilities/extracurricular/nss" },
              { label: "Clubs", path: "/facilities/extracurricular/clubs" },
              { label: "Diploma Courses", path: "/facilities/extracurricular/diplomacourses" },
            ]},
            { label: "Samarth Portal", path: "/facilities/samarth" },
            { label: "Namaste App", path: "/facilities/namaste" },
            { label: "Canteen", children: [
              { label: "University", path: "/facilities/canteen/universitycanteen" },
              { label: "MMV", path: "/facilities/canteen/mmvcanteen" },
            ]},
            { label: "City Delegacy", path: "/facilities/citydelegacy" },
            { label: "Other Amenities", children: [
              { label: "Vishwanath Temple", path: "/facilities/other/vt" },
              { label: "Bharat Kala Bhawan", path: "/facilities/other/bkb" },
              { label: "Transportation", path: "/facilities/other/transportation" },
              { label: "Banks", path: "/facilities/other/banks" },
              { label: "Post Offices", path: "/facilities/other/po" },
              { label: "Guest Houses", path: "/facilities/other/guesthouses" },
              { label: "Auditoriun", path: "/facilities/other/auditorium" },

            ]},
          ]}
        />

        <Link to="/notices"
          className="px-4 py-3 text-gray-800 text-sm font-medium
                     hover:bg-[#406BC7] hover:text-white
                     transition-colors duration-200">
          Notices
        </Link>

        <Link to="/ai-assistant"
          className="px-4 py-3 text-gray-800 text-sm font-medium
                     hover:bg-[#406BC7] hover:text-white
                     transition-colors duration-200">
          AI Assistant
        </Link>

        <Link to="/contact"
          className="px-4 py-3 text-gray-800 text-sm font-medium
                     hover:bg-[#406BC7] hover:text-white
                     transition-colors duration-200">
          Contact
        </Link>

      </nav>

    </div>
  );
};

export default Navbar;
