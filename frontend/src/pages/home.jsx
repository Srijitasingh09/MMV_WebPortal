import React from 'react';

const Hero = () => (
  <section className="relative w-[100%] h-[160vh] overflow-hidden">

    <div
      className="absolute inset-0 bg-contain bg-no-repeat"
      style={{ backgroundImage:"url('/bhu/web (3).png')" }}
    />

    {/* Keyframe injection */}
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Lato:wght@300;400;600&display=swap');
      @keyframes hero-zoom {
        0%   { transform: scale(0.88);  }
        20%  {  }
        100% { transform: scale(1.0); }
      }
      .animate-hero-zoom {
        animation: hero-zoom 4s ease forwards;
      }
    `}</style>
  </section>
);


// ============================================
// ABOUT — Brief intro to the portal & college
// ============================================
const About = () => (
  <section className="bg-white py-10 px-6">
    <div className="max-w-5xl mx-auto text-center">
      <span className="inline-block bg-[#EEF3FC] text-[#2d54a8] text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
        About the Portal
      </span>
      <h2 className="text-4xl font-semibold text-[#1a3a6b] mb-6 leading-snug"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        Your Complete Guide to MMV
      </h2>
      <p className="text-gray-500 text-[15px] leading-relaxed max-w-3xl mx-auto mb-12">
        The MMV Student Portal is a centralized information hub for all students of Mahila Maha
        Vidyalaya, Banaras Hindu University. Whether you're looking for your department's
        syllabus, hostel information, administrative contacts, or the latest notices —
        everything is organized and accessible in one place.
      </p>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          ['1929', 'Year Established'],
          ['30+', 'Departments'],
          ['2,500+', 'Students Enrolled'],
          ['200+', 'Faculty Members'],
        ].map(([n, l]) => (
          <div key={l} className="bg-[#f4f7fd] rounded-2xl py-7 px-4">
            <div className="text-2xl font-bold text-[#406BC7] mb-1">{n}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">{l}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);


// ============================================
// SECTION COMPONENT — reusable layout block
// ============================================
const FeatureSection = ({ id, title, description, points, image, reverse, accentColor, tagBg, tagText }) => (
  <section id={id} className={`py-10 px-6 ${reverse ? 'bg-white' : 'bg-[#f4f7fd]'}`}>
    <div className={`max-w-5xl mx-auto flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-14 items-center`}>

      {/* Visual placeholder */}
      <div className="md:w-5/12 w-full">
        <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          {image
            ? <img src={image} alt={title} className="w-full h-100 object-cover" />
            : (
              <div className={`w-full h-64 flex items-center justify-center text-6xl`}
                   style={{ background: tagBg }}>
                {points[0]?.icon || '📄'}
              </div>
            )
          }
        </div>
      </div>

      {/* Text */}
      <div className="md:w-7/12 w-full">
        <span className="inline-block text-3xl font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 leading-snug"
              style={{ background: tagBg, color: tagText, fontFamily: "'Cormorant Garamond', serif"}}>
          {title}
        </span>
        <p className="text-gray-500 text-[14px] leading-relaxed mb-6">
          {description}
        </p>
        <ul className="space-y-3">
          {points.map((p, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-xl leading-none mt-0.5">{p.icon}</span>
              <div>
                <span className="text-sm font-semibold text-[#1a3a6b]">{p.label}: </span>
                <span className="text-sm text-gray-500">{p.detail}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

// ============================================
// FACILITIES SECTION
// ============================================
const Facilities = () => (
  <section id="facilities" className="py-10 px-6 bg-white">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-14">
        <span className="inline-block bg-[#F5EEFF] text-[#6b3fa0] text-3xl font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Campus Facilities & Resources
        </span>
        <p className="text-gray-500 text-[14px] leading-relaxed max-w-2xl mx-auto">
          MMV provides a comprehensive range of campus facilities to support students' academic,
          physical, and personal well-being. The Facilities section gives detailed information
          about each resource available on campus.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          { icon: '📖', label: 'Central Library', detail: 'Over 1 lakh books, journals, and digital resources.' },
          { icon: '🏠', label: 'Hostels', detail: 'On-campus residential facilities with mess, 24/7 security, and Wi-Fi.' },
          { icon: '⚽', label: 'Sports Complex', detail: 'Courts for badminton, volleyball, athletics track, and yoga centre.' },
          { icon: '🔬', label: 'Research Labs', detail: 'Departmental labs equipped for Science, Computers, and Language research.' },
          { icon: '🏥', label: 'Health Centre', detail: 'On-campus medical facility with a resident doctor and first-aid support.' },
          { icon: '🎭', label: 'Cultural Hall', detail: 'Auditorium for seminars, cultural programmes, and guest lectures.' },
          { icon: '💻', label: 'Computer Labs', detail: 'High-speed internet, licensed software, and printing facilities.' },
          { icon: '🍽️', label: 'Canteen', detail: 'Subsidised meals and snacks for students within the campus.' },
        ].map((f) => (
          <div key={f.label}
               className="bg-[#f4f7fd] rounded-2xl p-5 border border-[#406BC7] transition-all duration-200 group">
            <div className="text-3xl mb-3">{f.icon}</div>
            <div className="text-sm font-semibold text-[#1a3a6b] mb-1 transition-colors">
              {f.label}
            </div>
            <div className="text-xs text-gray-500 leading-relaxed">{f.detail}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);


// ============================================
// ACADEMICS SECTION
// ============================================
const Academics = () => (
  <FeatureSection
    id="academics"
    image="/bhu/academics.png"
    title="Academic Information"
    description="The Academics section covers all academic resources for every department at MMV. Students can find their semester syllabus, examination schedules, and updates related to the NEP 2020 curriculum — organized by department for easy navigation."
    points={[
      { icon: '📘', label: 'Syllabus', detail: 'Semester syllabus for all UG & PG programmes.' },
      { icon: '🗓️', label: 'Annual Calender', detail: 'Information about annual holidays and academic calender updated each semester.' },
      { icon: '📝', label: 'Exam Schedule', detail: 'Internal assessment and university examination date sheets.' },
      { icon: '📐', label: 'NEP 2020', detail: 'Revised curriculum details and credit structure under NEP guidelines.' },
    ]}
    reverse={false}
    tagBg="#d0daed"
    tagText="#2d54a8"
  />
);


// ============================================
// ADMINISTRATION SECTION
// ============================================
const Administration = () => (
  <FeatureSection
    id="administration"
    image="/bhu/administration.png"
    title="College Administration & Governance"
    description="The Administration section provides students with official information about the college's governance structure. This includes contacts for the Principal's office, administrative departments, committees, and institutional policies — making it easy to know who to reach for any matter."
    points={[
      { icon: '🏛️', label: "Principal's Office", detail: 'Contact details, messages, and official communications.' },
      { icon: '📋', label: 'Controller of Examination', detail: 'Any queries related with semester examination ' },
      { icon: '📞', label: 'Staff Directory', detail: 'Administrative and teaching staff contact information.' },
      { icon: '📜', label: 'Dean of Students', detail: 'Student conduct rules, attendance policies, and college guidelines.' },
    ]}
    reverse={true}
    tagBg="#dbf2e6"
    tagText="#1a8a5c"
  />
);


// ============================================
// NOTICES SECTION
// ============================================
const Notices = () => (
  <FeatureSection
    id="notices"
    image="/bhu/notices.png"
    title="Latest Announcements & Circulars"
    description="The Notices section is the official communication board of MMV. All important institutional announcements — including exam notifications, admission updates, event schedules, fee deadlines, and urgent circulars — are posted here and organized by category and date."
    points={[
      { icon: '🔴', label: 'Urgent Notices', detail: 'Time-sensitive updates like exam date changes or fee deadlines.' },
      { icon: '🎓', label: 'Admissions', detail: 'Open application windows for UG, PG, and Research programmes.' },
      // { icon: '🎭', label: 'Events', detail: 'Cultural programmes, seminars, workshops, and sports events.' },
      { icon: '📄', label: 'Circulars', detail: 'Official orders from BHU administration and MMV management.' },
    ]}
    reverse={false}
    accentColor="#c07d18"
    tagBg="#faefdb"
    tagText="#c07d18"
  />
);


// ============================================
// AI ASSISTANT SECTION
// ============================================
const AIAssistant = () => (
  <section id="ai-assistant" className="py-10 px-6 bg-[#f4f7fd]">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-14 items-center">

      {/* Text */}
      <div className="md:w-7/12 w-full">
        <span className="inline-block bg-[#E6E6FF] text-[#2d54a8] text-3xl font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 leading-snug"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Get Instant Answers with the MMV AI-Bot
        </span>
        <p className="text-gray-500 text-[14px] leading-relaxed mb-6">
          The MMV AI Assistant is a conversational chatbot built specifically for students
          of Mahila Maha Vidyalaya. Instead of searching through multiple pages, simply
          type your question and get an accurate answer within seconds.
        </p>
        <ul className="space-y-3">
          {[
            { icon: '💬', label: 'Natural Language', detail: 'Ask questions in plain English — no need for specific keywords.' },
            { icon: '🕐', label: 'Available 24/7', detail: 'Get answers anytime — outside office hours, during exams, anytime.' },
            { icon: '🏫', label: 'MMV-Specific', detail: 'Trained on MMV and BHU information — not generic internet answers.' },
          ].map((p, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-xl leading-none mt-0.5">{p.icon}</span>
              <div>
                <span className="text-sm font-semibold text-[#1a3a6b]">{p.label}: </span>
                <span className="text-sm text-gray-500">{p.detail}</span>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-gray-400 italic">
          Navigate to the AI Assistant section from the portal menu to start a conversation.
        </p>
      </div>

      {/* Visual */}
      <div className="md:w-5/12 w-full">
        <div className="bg-white rounded-2xl p-6 border-7 border-[#E6E6FF]-100 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-full bg-[#EEF3FC] flex items-center justify-content text-lg">🤖</div>
              <div className="text-sm font-semibold text-[#1a3a6b]">MMVerse</div>
          </div>
          <div className="space-y-3">
            {[
              { from: 'user', text: 'What are the Cyber library timings?' },
              { from: 'bot', text: 'The Cyber Library is open Monday–Saturday, 8:00 AM to 5:00 AM.' },
              { from: 'user', text: 'Where do I get my hostel allotment form?' },
              { from: 'bot', text: 'Hostel allotment forms are available at the Hostel Office in the MMV Campus. You can also find the details in the Facilities section of this portal.' },
            ].map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`text-xs rounded-2xl px-4 py-2.5 max-w-[80%] leading-relaxed
                  ${m.from === 'user'
                    ? 'bg-[#406BC7] text-white rounded-br-sm'
                    : 'bg-[#EEF3FC] text-[#1a3a6b] rounded-bl-sm'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <div className="flex-1 bg-gray-50 rounded-lg px-4 py-2.5 text-xs text-gray-400 border-3 border-[#2d54a8]-200">
              Ask a question...
            </div>
            <div className="w-8 h-8 bg-[#406BC7] rounded-lg flex items-center justify-center text-white text-xs mt-0.5">→</div>
          </div>
        </div>
      </div>

    </div>
  </section>
);


// ============================================
// SECTION NAV — sticky page index
// ============================================
const sections = [
  { id: 'academics', label: 'Academics' },
  { id: 'administration', label: 'Administration' },
  { id: 'notices', label: 'Notices' },
  { id: 'facilities', label: 'Facilities' },
  { id: 'ai-assistant', label: 'AI Assistant' },
];

const SectionNav = () => (
  <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
    <div className="max-w-5xl mx-auto px-6 flex gap-1 overflow-x-auto scrollbar-hide py-0">
      {/* {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="flex-shrink-0 text-xs font-semibold text-gray-500 hover:text-[#406BC7] px-4 py-3.5 border-b-2 border-transparent hover:border-[#406BC7] transition-all duration-150 uppercase tracking-wider"
        >
          {s.label}
        </a>
      ))} */}
    </div>
  </nav>
);


// ============================================
// HOME PAGE
// ============================================
const Home = () => (
  <div className="font-[Lato]">
    <Hero />
    <About />
    <SectionNav />
    {/* <Facilities /> */}
    <Academics />
    <Administration />
    <Notices />
    <Facilities />
    <AIAssistant />
  </div>
);

export default Home;