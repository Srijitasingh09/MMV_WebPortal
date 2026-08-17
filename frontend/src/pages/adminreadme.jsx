import React from 'react';
import { FileText, Layout, Table, Image } from 'lucide-react';

const AdminReadme = () => {
  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16 font-lato">
      {/* Header Banner */}
      <div className="bg-[#0F3358] text-white py-10 sm:py-12 px-6 sm:px-8 border-b-4 border-[#D4AF37] shadow-sm mb-8">
        <div className="max-w-5xl mx-auto space-y-3">
          <span className="bg-[#D4AF37] text-[#0F3358] text-xs sm:text-sm font-bold uppercase tracking-wider px-3.5 py-1.5 rounded inline-block">
            MMV IT Cell Documentation
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif text-white">
            Administrator Operating Guide
          </h1>
          <p className="text-blue-100 text-sm sm:text-base md:text-lg max-w-3xl leading-relaxed">
            Technical documentation for managing page titles, markdown text syntax, profile cards, photo grid settings, and dynamic data tables.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-8 space-y-8">

        {/* Section 1 */}
        <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-[#174873] p-6 sm:p-8 md:p-10 shadow-sm space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#0F3358] flex items-center gap-3">
            <FileText size={26} className="text-[#2563EB] shrink-0" /> 1. Description Text & Markdown Formatting
          </h2>
          <div className="bg-[#F0F4F8] p-5 sm:p-6 rounded-xl border border-gray-200 text-sm sm:text-base font-mono space-y-3 text-gray-800 leading-relaxed">
            <p><strong className="text-[#0F3358]">First Line of Text:</strong> Becomes the main big section title.</p>
            <p><strong className="text-[#0F3358]">## Section Title:</strong> Creates a major heading (Deep Navy font with vertical pillar badge).</p>
            <p><strong className="text-[#0F3358]">### Subsection Title:</strong> Creates a smaller subheading (Rotated diamond badge).</p>
            <p><strong className="text-[#0F3358]">- List item:</strong> Converts to bullet point.</p>
            <p><strong className="text-[#0F3358]">**Bold Text**:</strong> Renders text in bold.</p>
            <p><strong className="text-[#0F3358]">[Download PDF](https://...):</strong> Converts into a clickable link.</p>
          </div>
        </div>

        {/* Section 2 */}
        <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-[#D4AF37] p-6 sm:p-8 md:p-10 shadow-sm space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#0F3358] flex items-center gap-3">
            <Layout size={26} className="text-[#D4AF37] shrink-0" /> 2. Accordions & Highlight Callouts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm sm:text-base font-mono">
            <div className="bg-[#F0F4F8] p-5 rounded-xl border border-gray-200 space-y-2">
              <p className="font-bold text-[#0F3358] text-base sm:text-lg">Expandable Accordion Syntax:</p>
              <p className="text-slate-700">+++ Hostel Rules & Guidelines</p>
              <p className="text-slate-700">Enter rule text here...</p>
              <p className="text-slate-700">+++</p>
            </div>
            <div className="bg-[#F0F4F8] p-5 rounded-xl border border-gray-200 space-y-2">
              <p className="font-bold text-[#0F3358] text-base sm:text-lg">Callout Note Box Syntax:</p>
              <p className="text-slate-700">&gt; Urgent Note: Fee deadline is Sept 30. &lt;</p>
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-[#174873] p-6 sm:p-8 md:p-10 shadow-sm space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#0F3358] flex items-center gap-3">
            <Table size={26} className="text-[#2563EB] shrink-0" /> 3. In-Description Tables (Markdown Grid)
          </h2>
          <div className="bg-[#F0F4F8] p-5 sm:p-6 rounded-xl border border-gray-200 text-sm sm:text-base font-mono text-gray-800 space-y-2 leading-relaxed">
            <p>| Warden Name | Hostel | Contact |</p>
            <p>| --- | --- | --- |</p>
            <p>| Dr. Moumita Das | Swasti Kunj | +91 8967064498 |</p>
            <p>| Dr. Rana Noor | Swasti Kunj | +91 9451735063 |</p>
          </div>
        </div>

        {/* Section 4 */}
        <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-[#D4AF37] p-6 sm:p-8 md:p-10 shadow-sm space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#0F3358] flex items-center gap-3">
            <Image size={26} className="text-[#D4AF37] shrink-0" /> 4. Photo Grid & Profile Cards
          </h2>
          <ul className="text-sm sm:text-base text-gray-800 space-y-3 list-disc list-inside leading-relaxed font-medium">
            <li><strong className="text-[#0F3358]">Executive Profile Cards:</strong> Uploading a profile photo automatically frames it inside the Deep Navy card with a Gold border.</li>
            <li><strong className="text-[#0F3358]">Photo Grid Controls:</strong> Click ⚙ on photo sections to alter column counts (1, 2, or 3) and adjust image dimensions.</li>
            <li><strong className="text-[#0F3358]">PDF Attachments:</strong> In interactive tables, admins can attach downloadable PDFs directly into table cells.</li>
            <li><strong className="text-[#0F3358]">Row Reordering:</strong> Use ▲ / ▼ buttons next to any row to reorder administrative staff tables.</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default AdminReadme;