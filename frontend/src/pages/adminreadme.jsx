import React from 'react';
import { FileText, Layout, Table, Image } from 'lucide-react';

const AdminReadme = () => {
  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      <div className="bg-[#0F3358] text-white py-10 px-6 border-b-4 border-[#D4AF37] shadow-sm mb-8">
        <div className="max-w-5xl mx-auto space-y-2">
          <span className="bg-[#D4AF37] text-[#0F3358] text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded">
            MMV IT Cell Documentation
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-white">Administrator Operating Guide</h1>
          <p className="text-blue-100 text-xs sm:text-sm max-w-3xl leading-relaxed">
            Technical documentation for managing page titles, markdown text syntax, profile cards, photo grid settings, and dynamic data tables.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 space-y-8">
        <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-[#174873] p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-xl font-bold font-serif text-[#0F3358] flex items-center gap-2">
            <FileText size={20} className="text-[#2563EB]" /> 1. Description Text & Markdown Formatting
          </h2>
          <div className="bg-[#F0F4F8] p-4 rounded-lg border border-gray-200 text-xs font-mono space-y-2 text-gray-800">
            <p><strong>First Line of Text:</strong> Becomes the main big section title.</p>
            <p><strong>## Section Title:</strong> Creates a major heading (Deep Navy font).</p>
            <p><strong>### Subsection Title:</strong> Creates a smaller subheading.</p>
            <p><strong>- List item:</strong> Converts to bullet point.</p>
            <p><strong>**Bold Text**:</strong> Renders text in bold.</p>
            <p><strong>[Download PDF](https://...):</strong> Converts into a clickable link.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-[#D4AF37] p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-xl font-bold font-serif text-[#0F3358] flex items-center gap-2">
            <Layout size={20} className="text-[#D4AF37]" /> 2. Accordions & Highlight Callouts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-[#F0F4F8] p-4 rounded-lg border border-gray-200 space-y-1">
              <p className="font-bold text-[#0F3358]">Expandable Accordion Syntax:</p>
              <p className="text-gray-600">+++ Hostel Rules & Guidelines</p>
              <p className="text-gray-600">Enter rule text here...</p>
              <p className="text-gray-600">+++</p>
            </div>
            <div className="bg-[#F0F4F8] p-4 rounded-lg border border-gray-200 space-y-1">
              <p className="font-bold text-[#0F3358]">Callout Note Box Syntax:</p>
              <p className="text-gray-600">&gt; Urgent Note: Fee deadline is Sept 30. &lt;</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-[#174873] p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-xl font-bold font-serif text-[#0F3358] flex items-center gap-2">
            <Table size={20} className="text-[#2563EB]" /> 3. In-Description Tables (Markdown Grid)
          </h2>
          <div className="bg-[#F0F4F8] p-4 rounded-lg border border-gray-200 text-xs font-mono text-gray-800 space-y-1">
            <p>| Warden Name | Hostel | Contact |</p>
            <p>| --- | --- | --- |</p>
            <p>| Dr. Moumita Das | Swasti Kunj | +91 8967064498 |</p>
            <p>| Dr. Rana Noor | Swasti Kunj | +91 9451735063 |</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-[#D4AF37] p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-xl font-bold font-serif text-[#0F3358] flex items-center gap-2">
            <Image size={20} className="text-[#D4AF37]" /> 4. Photo Grid & Profile Cards
          </h2>
          <ul className="text-xs text-gray-700 space-y-2 list-disc list-inside leading-relaxed">
            <li><strong>Executive Profile Cards:</strong> Uploading a profile photo automatically frames it inside the Deep Navy card with a Gold border.</li>
            <li><strong>Photo Grid Controls:</strong> Click ⚙ on photo sections to alter column counts (1, 2, or 3) and adjust image dimensions.</li>
            <li><strong>PDF Attachments:</strong> In interactive tables, admins can attach downloadable PDFs directly into table cells.</li>
            <li><strong>Row Reordering:</strong> Use ▲ / ▼ buttons next to any row to reorder administrative staff tables.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminReadme;