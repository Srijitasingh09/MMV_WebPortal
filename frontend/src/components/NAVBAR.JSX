// import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
      <div className="flex items-center justify-between px-1 py-1
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
      <div className="flex items-center justify-between px-2 py-1
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
     <button className="flex items-center gap-1 px-3 py-1 text-white
                   text-1.5xl font-medium hover:bg-[#406BC7] 
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
                className="block px-3 py-1 text-sm text-white
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
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    navigate('/login');
  };

  return (
    <div className="relative z-[999]">       

      {/* ---- TOP BAR ---- */}
      <div className="bg-[#0f3358] text-xs text-blue-200 px-6 py-1
                      flex justify-end gap-6">
        {token && isAdmin ? (
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-blue-200 hover:text-white">
              Admin Panel
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 py-0.5 rounded hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <a href="/login" className="text-[#0f3358] hover:text-white">
            Admin Login
          </a>
        )}
      </div>

      {/* ---- COLLEGE HEADER ---- */}
      <div className="bg-white px-4 py-1 flex items-center justify-between ">
       
        {/* RIGHT SIDE - BHU Logo */}
       <div className="flex items-end gap-2 pl-0">
       <img
       src="/bhu/logo_bhu.png"
       alt="BHU Logo"
       className="h-18 rounded-full object-contain bg-white"
  />  

  {/* <div className="flex flex-col">
    <h1 className="text-white text-lg font-medium">
      Banaras Hindu University
    </h1> */}

    {/* <p className="text-blue-200 text-xs">
      Varanasi — 221005
    </p> */}
  {/* </div> */}
</div>
        {/* <div className="bg-white px-4 py-1 flex items-center justify-between">
       
        # website logo
       <div className="flex items-center gap-2 pl-0">
       <img
       src="/bhu/logo.png"
       alt="BHU Logo"
       className="h-54 rounded-full object-contain bg-white"
  /> 
  </div>
  </div> */}
         {/* CENTER - MMV SAARTHI LOGO */}
         <div>
          <img 
            src="/mmv_saarthi_logo.png" 
            alt="mmv-saarthi-logo"
            className="w-50 h-20 object-contain bg-white" />
         </div>
      
         {/* LEFT SIDE - MMV Logo + Name */}
         <div className="flex items-center gap-1">
          <div>
            <h1 className="text-gray-700 text-lg font-3xs">
              Mahila Maha Vidyalaya
            </h1>
          </div>
          <img
            src="/mmvlogo.jpeg"
            alt="MMV Logo"
            className="w-20 h-18 rounded-full object-contain bg-white"
          />
        </div>
        
      </div>

       {/* ---- NAVIGATION BAR ---- */}
      <nav className="bg-[#0f3358] flex px-2 border-b border-gray-200 relative justify-end">
        {/* Added Logo */}
        {/* <img 
        src="./mmv_saarthi_logo.png" 
        alt="mmv-saarthi-logo"
        className='h-12 pl-0' /> */}

        <div className='flex relative justify-end'>
          <Link to="/"
            className="px-5 py-3 text-white text-1.5xl font-medium
                    hover:bg-[#406BC7] hover:text-white
                    transition-colors duration-200">
            Home
          </Link>
          <Link to="/about"
            className="px-5 py-3 text-white text-1.5xl font-medium
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
                { label: "University Proctorial Board", path: "/administration/proctorial/uniboard" },
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
                { label: "Clubs", path: "/facilities/extracurricular/clubs" },
                { label: "Diploma & Certificate Courses", path: "/facilities/extracurricular/diplomacourses" },
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
                { label: "Banks & Post Offices", path: "/facilities/other/banks" },
                { label: "Guest Houses", path: "/facilities/other/guesthouses" },
                { label: "Auditorium", path: "/facilities/other/auditorium" },
              ]},
            ]}
          />

          <Link to="/notices"
            className="px-5 py-3 text-white text-1.5xl font-medium
                    hover:bg-[#406BC7] hover:text-white
                    transition-colors duration-200">
            Notices
          </Link>

          <Link to="/ai-assistant"
            className="px-5 py-3 text-white text-1.5xl font-medium
                    hover:bg-[#406BC7] hover:text-white
                    transition-colors duration-200">
            AI Assistant
          </Link>

          <Link to="/contact"
            className="px-5 py-3 text-white text-1.5xl font-medium
                    hover:bg-[#406BC7] hover:text-white
                    transition-colors duration-200">
            Contact
          </Link>
        </div>

        

      </nav>

    </div>
  );
};

export default Navbar;