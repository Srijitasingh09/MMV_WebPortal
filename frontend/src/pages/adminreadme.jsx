import React from 'react';
import { FileText, Layout, Table, Image, User, Grid } from 'lucide-react';

const AdminReadme = () => {
  return (
    <div className="bg-white p-5 sm:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-6 font-lato animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Clean, compact header matching other admin panel sections */}
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-lg sm:text-xl font-bold font-serif text-[#0F3358]">
          Administrator Operating & Syntax Guide
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Documentation for formatting page descriptions, card grids, profile cards, accordions, and data tables.
        </p>
      </div>

      <div className="space-y-6">

        {/* Section 1: Text & Links Formatting */}
        <div className="bg-[#F8FAFC] rounded-xl border border-slate-200 p-4 sm:p-6 space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-[#0F3358] flex items-center gap-2">
            <FileText size={20} className="text-blue-600 shrink-0" /> 1. Text & Links Formatting
          </h3>
          <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs sm:text-sm font-mono space-y-2 text-slate-800 leading-relaxed">
            <p><strong className="text-[#0F3358]">First Line of Content:</strong> Becomes the main big section title with underline.</p>
            <p><strong className="text-[#0F3358]">## Section Title:</strong> Creates a major heading (Deep Navy font with maroon bar).</p>
            <p><strong className="text-[#0F3358]">### Subsection Title:</strong> Creates a smaller subheading (Rotated diamond badge).</p>
            <p><strong className="text-[#0F3358]">- List item:</strong> Converts to bullet point.</p>
            <p><strong className="text-[#0F3358]">**Bold Text**:</strong> Renders text in bold.</p>
            <p><strong className="text-[#0F3358]">*Italic Text* or _Text_:</strong> Renders text in italics.</p>
            <p><strong className="text-[#0F3358]">[Link Text](/facilities/hostels):</strong> Converts to clickable link (internal or web link).</p>
            <p><strong className="text-[#0F3358]">---:</strong> Inserts horizontal divider line.</p>
          </div>
        </div>

        {/* Section 2: 3-Column Grid Accordion Cards */}
        <div className="bg-[#F8FAFC] rounded-xl border border-slate-200 p-4 sm:p-6 space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-[#0F3358] flex items-center gap-2">
            <Grid size={20} className="text-emerald-600 shrink-0" /> 2. 3-Column Grid Accordions (:::grid ... :::)
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Renders 3 interactive cards side-by-side. Cards expand on click to reveal details and collapse on click.
          </p>
          <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs sm:text-sm font-mono space-y-1.5 text-slate-800">
            <p className="text-blue-600 font-bold">:::grid</p>
            <p className="text-slate-700">=== Hostel Rules</p>
            <p className="text-slate-700">- Curfew time is **8:00 PM**</p>
            <p className="text-slate-700">- Check [Hostel Guidelines](/facilities/hostels) for details</p>
            <p className="text-slate-700">=== Mess Timings</p>
            <p className="text-slate-700">- Breakfast: **7:30 AM - 9:00 AM**</p>
            <p className="text-blue-600 font-bold">:::</p>
            <div className="pt-2 text-xs text-slate-500 font-sans border-t border-slate-100">
              <strong>Themes available:</strong> <code className="bg-slate-100 px-1 rounded text-slate-700">:::grid</code> (Gold/Navy), <code className="bg-slate-100 px-1 rounded text-slate-700">:::grid blue</code>, <code className="bg-slate-100 px-1 rounded text-slate-700">:::grid green</code>, <code className="bg-slate-100 px-1 rounded text-slate-700">:::grid slate</code>, <code className="bg-slate-100 px-1 rounded text-slate-700">:::grid crimson</code>, <code className="bg-slate-100 px-1 rounded text-slate-700">:::grid purple</code>, <code className="bg-slate-100 px-1 rounded text-slate-700">:::grid amber</code>.
            </div>
          </div>
        </div>

        {/* Section 3: Inline Profile Cards */}
        {/* Section 3: Staff Profile Cards */}
        <div className="bg-[#F8FAFC] rounded-xl border border-slate-200 p-4 sm:p-6 space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-[#0F3358] flex items-center gap-2">
            <User size={20} className="text-[#D4AF37] shrink-0" /> 3. Staff & Warden Profile Cards
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Admins can add staff/warden profile cards directly from the Admin Controls bar by clicking <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-[#0f3358]">+ Profile Card</code>.
          </p>
          <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs sm:text-sm space-y-2 text-slate-800 font-sans">
            <p><strong>Card Details:</strong> Full Name, Designation (e.g. Warden), Hostel / Department, University, Phone, Email, and Photo Avatar.</p>
            <p className="text-slate-500 text-xs">💡 Photos can be uploaded directly inside the Add/Edit form and will render inside a clean circular avatar!</p>
          </div>
        </div>

        {/* Section 4: Accordions & Callout Notes */}
        <div className="bg-[#F8FAFC] rounded-xl border border-slate-200 p-4 sm:p-6 space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-[#0F3358] flex items-center gap-2">
            <Layout size={20} className="text-amber-600 shrink-0" /> 4. Accordions & Callout Notes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm font-mono">
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
              <p className="font-bold text-[#0F3358] font-sans">Full-Width Accordion:</p>
              <p className="text-blue-600 font-bold">+++ Section Title</p>
              <p className="text-slate-700">Enter accordion text here...</p>
              <p className="text-blue-600 font-bold">+++</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
              <p className="font-bold text-[#0F3358] font-sans">Callout Note Box:</p>
              <p className="text-blue-600 font-bold">&gt;</p>
              <p className="text-slate-700">Notice text inside note box...</p>
              <p className="text-blue-600 font-bold">&lt;</p>
            </div>
          </div>
        </div>

        {/* Section 5: In-Description Tables */}
        <div className="bg-[#F8FAFC] rounded-xl border border-slate-200 p-4 sm:p-6 space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-[#0F3358] flex items-center gap-2">
            <Table size={20} className="text-purple-600 shrink-0" /> 5. In-Description Tables (| Col 1 | Col 2 |)
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Renders styled, responsive data tables directly inside any description text box using pipes (<code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">|</code>).
          </p>
          <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs sm:text-sm font-mono space-y-1 text-slate-800">
            <p className="text-blue-600 font-bold">| Warden Name | Hostel | Contact Number |</p>
            <p className="text-slate-400">| --- | --- | --- |</p>
            <p>| Dr. Moumita Das | Swasti Kunj | +91 8967064498 |</p>
            <p>| Dr. Rana Noor | Swasti Kunj | +91 9451735063 |</p>
            <div className="pt-2 text-xs text-slate-500 font-sans border-t border-slate-100 space-y-1">
              <p>• <strong>Line 1 (Headers):</strong> Defines table column headers with deep navy background and gold borders.</p>
              <p>• <strong>Line 2 (Divider):</strong> Use <code className="bg-slate-100 px-1 rounded text-slate-700">| --- | --- |</code> to split headers from data rows.</p>
              <p>• <strong>Formatting Support:</strong> Table cells support <code className="bg-slate-100 px-1 rounded text-slate-700">**bold**</code>, <code className="bg-slate-100 px-1 rounded text-slate-700">*italics*</code>, and <code className="bg-slate-100 px-1 rounded text-slate-700">[clickable links](url)</code>.</p>
            </div>
          </div>
        </div>

        {/* Section 6: Interactive Page Admin Controls */}
        <div className="bg-[#F8FAFC] rounded-xl border border-slate-200 p-4 sm:p-6 space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-[#0F3358] flex items-center gap-2">
            <Image size={20} className="text-indigo-600 shrink-0" /> 6. Interactive Page Admin Controls & Tables
          </h3>
          <ul className="text-xs sm:text-sm text-slate-700 space-y-2 list-disc list-inside font-medium leading-relaxed">
            <li><strong className="text-[#0F3358]">Page Admin Toolbar:</strong> When logged in as admin, floating edit bars, photo size controls (⚙), slideshow controls, and PDF upload inputs appear directly on live pages.</li>
            <li><strong className="text-[#0F3358]">Interactive Tables:</strong> Click <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">+ Col</code> to add custom columns and <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">Add Row</code> for structured data tables. Use ▲ / ▼ to reorder rows easily.</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default AdminReadme;