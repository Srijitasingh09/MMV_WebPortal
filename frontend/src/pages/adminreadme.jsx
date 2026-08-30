import React from 'react';
import { FileText, Layout, Table, Image, User, Grid } from 'lucide-react';

const AdminReadme = () => {
  return (
    <div className="bg-white p-5 sm:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-6 font-lato animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Clean, compact header matching other admin panel sections */}
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-lg sm:text-xl font-bold font-serif text-primary">
          Administrator Operating & Syntax Guide
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Documentation for formatting page descriptions, card grids, profile cards, accordions, and both table types.
        </p>
      </div>

      <div className="space-y-6">

        {/* Section 1: Text & Links Formatting */}
        <div className="bg-[#F8FAFC] rounded-xl border border-slate-200 p-4 sm:p-6 space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
            <FileText size={20} className="text-blue-600 shrink-0" /> 1. Text & Links Formatting
          </h3>
          <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs sm:text-sm font-mono space-y-2 text-slate-800 leading-relaxed">
            <p><strong className="text-primary">First Line of Content:</strong> Becomes the main big section title, centered with an underline.</p>
            <p><strong className="text-primary">## Section Title:</strong> Creates a major heading (navy text with a maroon accent bar).</p>
            <p><strong className="text-primary">### Subsection Title:</strong> Creates a smaller subheading (navy text with a rotated maroon diamond marker).</p>
            <p><strong className="text-primary">- List item:</strong> Converts to a bullet point.</p>
            <p><strong className="text-primary">**Bold Text**:</strong> Renders text in bold.</p>
            <p><strong className="text-primary">*Italic Text* or _Text_:</strong> Renders text in italics.</p>
            <p><strong className="text-primary">[Link Text](/facilities/hostels):</strong> Converts to a clickable link — internal links (starting with <code className="bg-slate-100 px-1 rounded text-slate-700">/</code>) open in the same tab, external links open in a new tab.</p>
            <p><strong className="text-primary">---:</strong> Inserts a horizontal divider line.</p>
            <div className="pt-2 text-xs text-slate-500 font-sans border-t border-slate-100">
              ⚠️ <strong>Scope:</strong> <code className="bg-slate-100 px-1 rounded text-slate-700">## </code> / <code className="bg-slate-100 px-1 rounded text-slate-700">### </code> headings and <code className="bg-slate-100 px-1 rounded text-slate-700">---</code> dividers only work at the top level of a page's description. They are <strong>not</strong> recognized inside grid cards or accordions — typing them there just prints the literal <code className="bg-slate-100 px-1 rounded text-slate-700">##</code> as plain text. If you need a heading inside a card or accordion, nest a callout note (Section 5) — headings work inside those.
            </div>
          </div>
        </div>

        {/* Section 1b: Sarthi Pointer Bullet Symbol */}
        <div className="bg-[#F8FAFC] rounded-xl border border-slate-200 p-4 sm:p-6 space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
            <FileText size={20} className="text-[#7d311f] shrink-0" /> 2. The Sarthi Pointer Bullet
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            If a bullet's entire content is just one link — nothing else on the line — its marker automatically changes from the plain dot to the <strong className="text-primary">MMV सारथी pointer image</strong>, so clickable "go here" items stand out at a glance.
          </p>
          <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs sm:text-sm font-mono space-y-1 text-slate-800">
            <p>- [Hostel Fee Structure](/facilities/hostels/fees) <span className="text-slate-400 font-sans">→ gets the सारथी image marker</span></p>
            <p>- Fees must be paid before [15th July](/facilities/hostels/fees) <span className="text-slate-400 font-sans">→ stays a plain dot (has extra text)</span></p>
            <div className="pt-2 text-xs text-slate-500 font-sans border-t border-slate-100">
              This applies to every bullet list in the app: the main description, callout notes, grid cards, and accordions all use it automatically — there's nothing extra to type.
            </div>
          </div>
        </div>

        {/* Section 2: 3-Column Grid Accordion Cards */}
        <div className="bg-[#F8FAFC] rounded-xl border border-slate-200 p-4 sm:p-6 space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
            <Grid size={20} className="text-emerald-600 shrink-0" /> 3. 3-Column Grid Accordions (:::grid ... :::)
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
            <div className="pt-2 text-xs text-slate-500 font-sans border-t border-slate-100 space-y-1">
              <p><strong>Themes available:</strong> <code className="bg-slate-100 px-1 rounded text-slate-700">:::grid</code> (default — gold badge, navy header), <code className="bg-slate-100 px-1 rounded text-slate-700">:::grid blue</code>, <code className="bg-slate-100 px-1 rounded text-slate-700">:::grid green</code> (emerald), <code className="bg-slate-100 px-1 rounded text-slate-700">:::grid slate</code>, <code className="bg-slate-100 px-1 rounded text-slate-700">:::grid crimson</code> (maroon), <code className="bg-slate-100 px-1 rounded text-slate-700">:::grid purple</code>, <code className="bg-slate-100 px-1 rounded text-slate-700">:::grid amber</code> — each recolors the card border, badge dot, header text, and expand arrow.</p>
              <p><strong>Inside a card:</strong> <code className="bg-slate-100 px-1 rounded text-slate-700">**bold**</code>, <code className="bg-slate-100 px-1 rounded text-slate-700">*italic*</code>, links, and bullets (including the सारथी pointer bullet above) all work. <code className="bg-slate-100 px-1 rounded text-slate-700">## </code> headings and <code className="bg-slate-100 px-1 rounded text-slate-700">---</code> dividers do <strong>not</strong> — a callout note (<code className="bg-slate-100 px-1 rounded text-slate-700">&gt; ... &lt;</code>) can be nested inside a card if you need one.</p>
              <p>Cards split into up to 3 columns automatically; each card expands/collapses independently on click.</p>
            </div>
          </div>
        </div>

        {/* Section 4: Staff Profile Cards */}
        <div className="bg-[#F8FAFC] rounded-xl border border-slate-200 p-4 sm:p-6 space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
            <User size={20} className="text-[#D4AF37] shrink-0" /> 4. Staff & Warden Profile Cards
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Admins can add staff/warden profile cards directly from the Admin Controls bar by clicking <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-primary">+ Profile Card</code>.
          </p>
          <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs sm:text-sm space-y-2 text-slate-800 font-sans">
            <p><strong>Card Details:</strong> Full Name, Designation (e.g. Warden), Hostel / Department, University, Phone, Email, and Photo Avatar.</p>
            <p className="text-slate-500 text-xs">💡 Photos can be uploaded directly inside the Add/Edit form and will render inside a clean circular avatar!</p>
          </div>
        </div>

        {/* Section 5: Accordions & Callout Notes */}
        <div className="bg-[#F8FAFC] rounded-xl border border-slate-200 p-4 sm:p-6 space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
            <Layout size={20} className="text-amber-600 shrink-0" /> 5. Accordions & Callout Notes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm font-mono">
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
              <p className="font-bold text-primary font-sans">Full-Width Accordion:</p>
              <p className="text-blue-600 font-bold">+++ Section Title</p>
              <p className="text-slate-700">Enter accordion text here...</p>
              <p className="text-blue-600 font-bold">+++</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
              <p className="font-bold text-primary font-sans">Callout Note Box:</p>
              <p className="text-blue-600 font-bold">&gt;</p>
              <p className="text-slate-700">Notice text inside note box...</p>
              <p className="text-blue-600 font-bold">&lt;</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs sm:text-sm font-mono space-y-1 text-slate-800">
            <p className="font-bold text-primary font-sans not-italic">Or write it on one line:</p>
            <p><span className="text-blue-600 font-bold">&gt;</span> Visitors allowed only between 4 PM and 6 PM on weekdays. <span className="text-blue-600 font-bold">&lt;</span></p>
            <p className="pt-1 text-xs text-slate-500 font-sans border-t border-slate-100">💡 A note box can also contain its own <code className="bg-slate-100 px-1 rounded text-slate-700">## </code>, <code className="bg-slate-100 px-1 rounded text-slate-700">### </code>, <code className="bg-slate-100 px-1 rounded text-slate-700">- </code> bullets, and <code className="bg-slate-100 px-1 rounded text-slate-700">---</code> dividers — just keep writing lines until the one ending in <code className="bg-slate-100 px-1 rounded text-slate-700">&lt;</code>.</p>
            <p className="pt-1 text-xs text-slate-500 font-sans border-t border-slate-100">⚠️ The accordion body itself (outside a nested note) only supports <code className="bg-slate-100 px-1 rounded text-slate-700">**bold**</code>, <code className="bg-slate-100 px-1 rounded text-slate-700">*italic*</code>, links, and <code className="bg-slate-100 px-1 rounded text-slate-700">- </code> bullets — same as grid cards, <code className="bg-slate-100 px-1 rounded text-slate-700">##</code> headings and <code className="bg-slate-100 px-1 rounded text-slate-700">---</code> dividers need a nested note to work.</p>
          </div>
        </div>

        {/* Section 6: In-Description Tables */}
        <div className="bg-[#F8FAFC] rounded-xl border border-slate-200 p-4 sm:p-6 space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
            <Table size={20} className="text-purple-600 shrink-0" /> 6. In-Description Tables (| Col 1 | Col 2 |)
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Renders styled, responsive data tables directly inside any description text box using pipes (<code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">|</code>). This is separate from the structured <strong className="text-primary">Table</strong> page type (Section 7) — it's plain text you type into a normal description box.
          </p>
          <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs sm:text-sm font-mono space-y-1 text-slate-800">
            <p className="text-blue-600 font-bold">| Warden Name | Hostel | Contact Number |</p>
            <p className="text-slate-400">| --- | --- | --- |</p>
            <p>| Dr. Moumita Das | Swasti Kunj | +91 8967064498 |</p>
            <p>| Dr. Rana Noor | Swasti Kunj | +91 9451735063 |</p>
            <div className="pt-2 text-xs text-slate-500 font-sans border-t border-slate-100 space-y-1">
              <p>• <strong>Line 1 (Headers):</strong> Defines table column headers — navy background, pale-gold header text, gold divider below.</p>
              <p>• <strong>Line 2 (Divider):</strong> Use <code className="bg-slate-100 px-1 rounded text-slate-700">| --- | --- |</code> to split headers from data rows (must have the same number of columns).</p>
              <p>• <strong>Formatting Support:</strong> Table cells support <code className="bg-slate-100 px-1 rounded text-slate-700">**bold**</code>, <code className="bg-slate-100 px-1 rounded text-slate-700">*italics*</code>, and <code className="bg-slate-100 px-1 rounded text-slate-700">[clickable links](url)</code>.</p>
              <p>• Once published, this table is fixed text — to change a value you edit the description text again. For a table admins can update row-by-row without touching syntax, use the Table page type instead (Section 7).</p>
            </div>
          </div>
        </div>

        {/* Section 7: Structured Data Tables (Table page type) */}
        <div className="bg-[#F8FAFC] rounded-xl border border-slate-200 p-4 sm:p-6 space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
            <Table size={20} className="text-purple-600 shrink-0" /> 7. Editable Data Tables (Table Page Type)
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Pages built with the <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">table</code> page type (e.g. warden lists, fee schedules) get a fully interactive table on the live page — no description syntax involved. Admins edit it directly with the on-page controls:
          </p>
          <ul className="text-xs sm:text-sm text-slate-700 space-y-2 list-disc list-inside font-medium leading-relaxed bg-white p-4 rounded-lg border border-slate-200">
            <li><strong className="text-primary">Rename a column:</strong> click <code className="bg-slate-100 px-1 rounded text-slate-700">✎</code> next to the column name, edit the text, then <code className="bg-slate-100 px-1 rounded text-slate-700">✓</code> to save (column names must be unique).</li>
            <li><strong className="text-primary">Add a column:</strong> click <code className="bg-slate-100 px-1 rounded text-slate-700">+ Col</code> at the end of the header row, type a name, confirm.</li>
            <li><strong className="text-primary">Delete a column:</strong> click <code className="bg-slate-100 px-1 rounded text-slate-700">×</code> next to the column name — removes that column's data from every row.</li>
            <li><strong className="text-primary">Reorder columns:</strong> click <code className="bg-slate-100 px-1 rounded text-slate-700">◄</code> / <code className="bg-slate-100 px-1 rounded text-slate-700">►</code> next to a column name to swap it with its neighbor.</li>
            <li><strong className="text-primary">Add a row:</strong> click <code className="bg-slate-100 px-1 rounded text-slate-700">Add Row</code> below the table.</li>
            <li><strong className="text-primary">Reorder rows:</strong> click <code className="bg-slate-100 px-1 rounded text-slate-700">▲</code> / <code className="bg-slate-100 px-1 rounded text-slate-700">▼</code> on a row to swap it with the one above/below.</li>
            <li><strong className="text-primary">Edit or delete a row:</strong> the pencil icon edits a row's values in place; the trash icon removes the row entirely.</li>
          </ul>
          <p className="text-xs text-slate-500 font-sans">💡 Rows and columns can both be reordered by repeatedly swapping with a neighbor — move something several places by clicking the arrow that many times.</p>
        </div>

        {/* Section 7: Staff Profile & Interactive Page Admin Controls */}
        <div className="bg-[#F8FAFC] rounded-xl border border-slate-200 p-4 sm:p-6 space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
            <Image size={20} className="text-indigo-600 shrink-0" /> 8. Other Page Admin Controls
          </h3>
          <ul className="text-xs sm:text-sm text-slate-700 space-y-2 list-disc list-inside font-medium leading-relaxed">
            <li><strong className="text-primary">Page Admin Toolbar:</strong> When logged in as admin, floating edit bars, photo size controls (⚙), slideshow controls, and PDF upload inputs appear directly on live pages.</li>
          </ul>
        </div>

        {/* Section 8: Full Page Example */}
        <div className="bg-[#F8FAFC] rounded-xl border border-slate-200 p-4 sm:p-6 space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
            <FileText size={20} className="text-rose-600 shrink-0" /> 9. Putting It All Together
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            A description box combining a heading, sections, a bullet list, and a callout note:
          </p>
          <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs sm:text-sm font-mono space-y-1 text-slate-800 whitespace-pre-wrap leading-relaxed">
{`Kirti Kunj Hostel

## About
Established in 1985, one of the oldest hostels on campus.

## Facilities
- 24-hour hot water
- Wi-Fi on all floors

> Visitors allowed only between 4 PM and 6 PM on weekdays. <

**Warden:** Dr. Anita Singh — 9876543210`}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminReadme;