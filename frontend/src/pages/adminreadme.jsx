import React, { useState } from 'react';


const SECTIONS = [
  { id: 'title', label: 'Page Title' },
  { id: 'headings', label: 'Headings' },
  { id: 'bold-links', label: 'Bold & Links' },
  { id: 'bullets', label: 'Bullet Lists' },
  { id: 'divider', label: 'Divider Line' },
  { id: 'notes', label: 'Note Boxes' },
  { id: 'accordion', label: 'Collapsible Sections' },
  { id: 'tables', label: 'Tables' },
  { id: 'photos', label: 'Photos' },
  { id: 'profile', label: 'Profile Photo' },
  { id: 'slideshow', label: 'Slideshow' },
];

// Monospace "type this" block
const CodeBlock = ({ children }) => (
  <pre className="bg-[#0F3358] text-[#cfe0f3] text-sm leading-relaxed rounded-lg px-4 py-3 overflow-x-auto whitespace-pre-wrap font-mono">
    {children}
  </pre>
);

// Two-column row: raw syntax on the left, rendered result on the right.
const Example = ({ syntax, children }) => (
  <div className="grid md:grid-cols-2 gap-4 items-start">
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Type this</p>
      <CodeBlock>{syntax}</CodeBlock>
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">You get</p>
      <div className="border border-gray-200 rounded-lg px-4 py-3 bg-white">
        {children}
      </div>
    </div>
  </div>
);

const Section = ({ id, title, note, children }) => (
  <section id={id} className="scroll-mt-24 space-y-4">
    <h3 className="text-2xl font-bold text-[#174873] border-b-2 border-[#174873]/20 pb-2">
      {title}
    </h3>
    {note && <p className="text-[#1F2937] text-md leading-relaxed">{note}</p>}
    {children}
  </section>
);

const AdminContentGuide = () => {
  const [activeId, setActiveId] = useState('title');

  const scrollTo = (id) => {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* ---- HEADER ---- */}
      <div className="mb-8">
        <h1 className="text-4xl font-semibold text-[#0F3A5F] tracking-tight">
          Content Formatting Guide
        </h1>
        <p className="text-[#1F2937] text-lg mt-2 max-w-3xl">
          What to type in the description box, and what it turns into.
        </p>
      </div>

      <div className="grid lg:grid-cols-[200px_1fr] gap-8">

        {/* ---- STICKY SIDE NAV ---- */}
        <nav className="lg:sticky lg:top-6 lg:self-start">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">
            On this page
          </p>
          <ul className="space-y-0.5">
            {SECTIONS.map(s => (
              <li key={s.id}>
                <button
                  onClick={() => scrollTo(s.id)}
                  className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                    activeId === s.id
                      ? 'bg-[#174873]/[10%] text-[#174873] font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* ---- CONTENT ---- */}
        <div className="space-y-12">

          {/* PAGE TITLE */}
          <Section
            id="title"
            title="Page Title"
            note="The first line you type becomes the big page heading. No symbol needed."
          >
            <Example syntax={`Central Library`}>
              <h2 className="text-2xl font-semibold text-[#0F3A5F] text-center border-b-2 border-[#174873]/20 pb-2">
                Central Library
              </h2>
            </Example>
          </Section>

          {/* HEADINGS */}
          <Section
            id="headings"
            title="Headings"
            note="## makes a subheading, ### makes a smaller one."
          >
            <Example syntax={`## Library Timings\n### Weekdays`}>
              <h3 className="text-xl font-bold text-[#174873]">Library Timings</h3>
              <h4 className="text-md font-semibold text-[#2E6DA4] mt-1">Weekdays</h4>
            </Example>
          </Section>

          {/* BOLD & LINKS */}
          <Section
            id="bold-links"
            title="Bold & Links"
            note="**text** bolds it. [text](url) makes a link. Plain https:// links work too."
          >
            <Example syntax={`**Open 24x7**. Apply here: [Samarth](https://mmv.samarth.edu.in)`}>
              <p className="text-[#1F2937]">
                <strong className="font-bold">Open 24x7</strong>. Apply here:{' '}
                <span className="text-blue-600 underline">Samarth</span>
              </p>
            </Example>
          </Section>

          {/* BULLETS */}
          <Section
            id="bullets"
            title="Bullet Lists"
            note="Start a line with - to make a bullet. Back-to-back lines group into one list."
          >
            <Example syntax={`- Ground floor: Reading hall\n- First floor: Reference section`}>
              <ul className="list-disc list-inside space-y-1 text-[#1F2937] marker:text-[#174873] marker:font-bold">
                <li>Ground floor: Reading hall</li>
                <li>First floor: Reference section</li>
              </ul>
            </Example>
          </Section>

          {/* DIVIDER */}
          <Section
            id="divider"
            title="Divider Line"
            note="Three dashes alone on a line draws a horizontal rule."
          >
            <Example syntax={`---`}>
              <hr className="border-gray-300" />
            </Example>
          </Section>

          {/* NOTES */}
          <Section
            id="notes"
            title="Note Boxes"
            note="> text < makes a highlighted note box. For longer notes, put > alone on its own line to open, and < at the end to close."
          >
            <Example syntax={`> Applications close on 30 June. <`}>
              <div className="bg-[#200000]/[8%] border-l-4 border-[#174873] pl-4 py-2 rounded-r-lg text-black italic">
                Applications close on 30 June.
              </div>
            </Example>
          </Section>

          {/* ACCORDION */}
          <Section
            id="accordion"
            title="Collapsible Sections"
            note="+++ Title ... +++ hides content behind a click-to-expand bar. Headings (##) and dividers (---) don't work inside it — bullets, bold, and links do."
          >
            <Example syntax={`+++ Eligibility Criteria\n- Minimum 75% attendance\n- No pending dues\n+++`}>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-[#174873]/[6%]">
                  <span className="text-md font-semibold text-[#174873]">Eligibility Criteria</span>
                  <span className="text-[#174873] text-sm">▶</span>
                </div>
                <div className="px-4 py-3 space-y-1 border-t border-gray-100 text-sm">
                  <ul className="list-disc list-inside space-y-1 marker:text-[#174873] marker:font-bold">
                    <li>Minimum 75% attendance</li>
                    <li>No pending dues</li>
                  </ul>
                </div>
              </div>
            </Example>
          </Section>

          {/* TABLES */}
          <Section
            id="tables"
            title="Tables"
            note="Wrap each row in | pipes |. First row is the header. This is separate from the ▲/▼ admin row-tables used on pages like Notices."
          >
            <Example syntax={`| Day | Timing |\n| Mon–Sat | 8 AM – 8 PM |`}>
              <table className="w-full text-sm text-left">
                <thead className="bg-[#fadccf]">
                  <tr><th className="px-3 py-2 font-medium">Day</th><th className="px-3 py-2 font-medium">Timing</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="px-3 py-2">Mon–Sat</td><td className="px-3 py-2">8 AM – 8 PM</td></tr>
                </tbody>
              </table>
            </Example>
          </Section>

          {/* PHOTOS */}
          <Section
            id="photos"
            title="Photos"
            note="The edit icon near a photo section sets photos per row (1–3), position (left/right/top), and size. Use the Upload Photo button to add images."
          ></Section>

          {/* PROFILE PHOTO */}
          <Section
            id="profile"
            title="Profile Photo vs. Gallery Photos"
            note="Profile-card pages (VC, Principal, Wardens) have two Upload Photo buttons: one on the profile card sets that person's photo, one in the gallery adds a regular photo. Pick the right one — it's automatic otherwise."
          ></Section>

          {/* SLIDESHOW */}
          <Section
            id="slideshow"
            title="Slideshow"
            note="Its own edit icon (separate from the photo gallery) sets height and max width. Add photos the same way, via Upload Photo."
          ></Section>

        </div>
      </div>
    </div>
  );
};

export default AdminContentGuide;