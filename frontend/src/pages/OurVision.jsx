import React from 'react';
import { useNavigate } from 'react-router-dom';

const AboutSection = () => {
  return (
    <div className="space-y-10 sm:space-y-12">
      {/* ── Section 1: About MMV Sarthi ── */}
      <section aria-labelledby="about-heading" className="bg-white rounded-3xl border border-gray-200/80 shadow-md p-6 sm:p-10 lg:p-12 space-y-8 relative overflow-hidden">
        {/* Ambient Decorative Background Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#0f3358]/5 via-[#d4af37]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#7d311f]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Header Block */}
        <div className="text-center relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#0f3358]/10 text-[#0f3358]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7d311f]" />
            Digital Companion & Student Guide
          </span>
          
          <h2
            id="mmv-sarthi"
            className="text-2xl sm:text-3xl md:text-4xl font-cinzel font-bold text-[#0f3358] tracking-tight"
          >
            About MMV Sarthi
          </h2>

          {/* Visible Decorative Accent Line */}
          <div className="flex items-center justify-center gap-2 pt-0.5">
            <span className="h-0.5 w-8 bg-gradient-to-r from-transparent to-[#7d311f]" />
            <span className="h-1 w-12 bg-[#7d311f] rounded-full" />
            <span className="h-0.5 w-8 bg-gradient-to-l from-transparent to-[#7d311f]" />
          </div>
        </div>

        {/* Narrative & Content */}
        <div className="relative z-10 space-y-6 text-black text-base leading-relaxed">
          <p className="text-gray-800 text-base sm:text-lg leading-relaxed text-justify">
            MMV Sarthi was born from a simple yet powerful idea: every girl who steps through the gates of Mahila Mahavidyalaya deserves a companion who makes her journey easier, not harder. This website is a safe, welcoming space built especially with the perspective of first-year students in mind — a place where no question feels too small and no information feels out of reach.
          </p>

          {/* Subheading & Sarthi Meaning Content */}
          <div className="space-y-2 pt-2">
            <h3 className="text-md sm:text-xl font-cinzel font-bold text-[#0f3358]">
              The Meaning Behind "Sarthi"
            </h3>
            <p className="text-gray-800 text-base sm:text-lg leading-relaxed text-justify">
              The name MMV Sarthi carries the very essence of what this platform stands for. Just as Lord Krishna was the Sarthi — the charioteer, guide, and steady presence — for Arjuna on the battlefield, MMV Sarthi walks beside every student through the exciting, occasionally overwhelming, and always memorable adventure that is college life.
            </p>
          </div>

          {/* Feature Highlights Grid (Clean SVG Icons - No Emojis) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div className="bg-[#FAF7F2]/80 border border-amber-950/10 p-6 rounded-2xl space-y-2 hover:shadow-md transition-shadow">
              <div className="w-9 h-9 rounded-xl bg-[#7d311f]/10 text-[#7d311f] flex items-center justify-center font-bold">
                <svg className="w-5 h-5 text-[#7d311f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#0f3358]">Our Vision</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                For freshers, it becomes a trusted introduction to the college: its academic structure, departments, rules, and services. For existing students, it remains a reliable companion for everyday academic and administrative needs.  
              </p>
            </div>

            <div className="bg-[#EAEFF5]/80 border border-blue-950/10 p-6 rounded-2xl space-y-2 hover:shadow-md transition-shadow">
              <div className="w-9 h-9 rounded-xl bg-[#0f3358]/10 text-[#0f3358] flex items-center justify-center font-bold">
                <svg className="w-5 h-5 text-[#0f3358]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#0f3358]">Our Motto</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                At its heart, MMV Sarthi exists to dissolve the confusion that so often accompanies the search for information — bringing every essential MMV resource under one roof.
              </p>
            </div>
          </div>

          {/* Closing Promise Pill */}
          <div className="text-center pt-4">
            <p className="text-[#0f3358] text-base sm:text-lg font-semibold italic bg-gradient-to-r from-transparent via-[#FAF7F2] to-transparent py-3 px-6 rounded-xl border-y border-amber-900/10 inline-block shadow-xs">
              MMV Sarthi isn't just a website — it's a guide, a companion, and a quiet promise that no student walks her MMV journey alone.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 2: Meet Our Team ── */}
      <section aria-labelledby="our-team-heading" className="bg-white rounded-3xl border border-gray-200/80 shadow-md p-6 sm:p-10 lg:p-12 space-y-8 relative overflow-hidden">
        {/* Header Block */}
        <div className="text-center space-y-3 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#7d311f]/10 text-[#7d311f]">
            The Minds Behind the Platform
          </span>

          <h2
            id="our-team-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-cinzel font-bold text-[#0f3358] tracking-tight"
          >
            Meet Our Team
          </h2>

          {/* Visible Accent Line Below Heading */}
          <div className="flex items-center justify-center gap-2 pt-0.5">
            <span className="h-0.5 w-8 bg-gradient-to-r from-transparent to-[#0f3358]" />
            <span className="h-1 w-12 bg-[#0f3358] rounded-full" />
            <span className="h-0.5 w-8 bg-gradient-to-l from-transparent to-[#0f3358]" />
          </div>

          {/* Subtitle */}
          <div className="text-gray-500 text-base sm:text-lg leading-snug font-medium max-w-xl mx-auto space-y-0.5 pt-1">
            <p>A perfect blend of creativity and technical wizardry.</p>
            <p>The best people formula for great websites!</p>
          </div>
        </div>

        {/* Team Photo Container */}
        <div className="flex flex-col items-center justify-center pt-2">
          <figure className="inline-flex flex-col items-center p-3 sm:p-4 rounded-3xl bg-gradient-to-b from-[#0f3358]/5 to-transparent border border-gray-200/70 shadow-md max-w-full w-fit">
            <img
              src="/malviyaold2.jpeg"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80';
              }}
              alt="MMV Sarthi Team"
              className="rounded-2xl max-h-[550px] max-w-full h-auto w-auto object-contain block"
            />

            <figcaption className="mt-4 px-6 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#d4af37]/40 shadow-xs text-center text-xs sm:text-sm font-semibold text-[#0f3358] tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7d311f]" />
              [ Caption to be decided ]
            </figcaption>
          </figure>
        </div>
      </section>
    </div>
  );
};

const OurVision = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#EAF0F6]">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <div className="border-b-2 border-[#d4af37] pb-2.5 sm:pb-4 flex items-end">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-1.5 sm:w-2 h-5 sm:h-8 md:h-9 bg-[#7d311f] rounded-full shrink-0" />
            <h1 className="text-[#0f3358] font-cinzel font-bold text-lg sm:text-2xl md:text-3xl lg:text-4xl tracking-tight leading-normal sm:leading-tight py-0.5 truncate sm:whitespace-normal">
              About Us
            </h1>
          </div>
        </div>

        <AboutSection />
      </div>
    </main>
  );
};

export default OurVision;