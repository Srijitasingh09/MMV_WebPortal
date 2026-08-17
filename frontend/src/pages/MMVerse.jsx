import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Brand fonts — Cormorant Garamond for display/headings, Inter for body.
// Safe to import here even if already loaded globally (browser dedupes). ───
const BrandFonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
    .mmv-font-display { font-family: 'Mirava', 'Mirava Sans', 'Plus Jakarta Sans', 'Manrope', 'Montserrat', sans-serif; }
    .mmv-font-body { font-family: 'Inter', system-ui, sans-serif; }
  `}</style>
);

// ── Signature graphic — a faint line-art temple spire (shikhara), a nod to
// Varanasi's skyline and the Vishwanath Temple that sits on BHU's own campus.
// Kept quiet (low opacity, single stroke) so it reads as texture, not clutter. ─
const TempleMotif = ({ className = "", opacity = 0.1 }) => (
  <svg viewBox="0 0 200 140" className={className} style={{ opacity }} fill="none" aria-hidden="true">
    <path
      d="M100 4 L108 26 L100 20 L92 26 Z M100 20 L112 46 L100 38 L88 46 Z
         M84 46 H116 L122 66 H78 Z M78 66 H122 L130 92 H70 Z
         M70 92 H130 L136 112 H64 Z M52 112 H148 L148 136 H52 Z
         M60 136 V116 H70 V136 M92 136 V108 H108 V136 M130 136 V116 H140 V136"
      stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
    />
  </svg>
);

const SECTIONS = [
  {
    label: "Administration",
    icon: "🏛️",
    value: "administration",
    welcome: "You've selected Administration. I can help you with:\n• Vice Chancellor & Principal details\n• Dean of Students information\n• Student Advisor & Chief Proctor contacts\n• Office staff directory\n• Examination controllers\n• Administrative office incontacts\n\nWhat would you like to know?"
  },
  {
    label: "Academics",
    icon: "📚",
    value: "academics",
    welcome: "You've selected Academics. I can help you with:\n• UG & PG syllabus downloads (Science, Arts, Social Science)\n• National Education Policy (NEP) details\n• Elective courses and credit structure\n• SWAYAM online courses\n• Section In-Charge contacts (Science, Arts, Social Science)\n• Academic calendar & holiday list"
  },
  {
    label: "Facilities",
    icon: "🏫",
    value: "facilities",
    welcome: "You've selected Facilities. I can help you with:\n• Hostels (Chief Warden, Coordinator, Jyoti Kunj, Kirti Kunj, Pragya Kunj, Swasti Kunj, Kundan Devi)\n• Libraries (MMV Library, Central Library, Cyber Library)\n• Medical (Sir Sundarlal Hospital, Trauma Centre, Health Centre)\n• Sports & Gymnasium\n• Canteen, Banks, Transport\n• NSS, NCC, NLSC & extracurricular activities\n• Training & Placement Cell\n• Auditorium, Guest Houses & other campus facilities"
  },
  {
    label: "Notices",
    icon: "📢",
    value: "notices",
    welcome: "You've selected Notices. I can help you with:\n• Latest notices and announcements from MMV\n• Exam notices and important dates\n• General college announcements\n\nWhat would you like to know?"
  },
];

// ── Inline markdown cleanup — the AI's answer text sometimes slips back into
// raw markdown (**bold**, # headers, | pipe-separated lists) instead of
// plain text. Rather than showing those symbols literally to the user, this
// strips/converts them before rendering. ───────────────────────────────────
const renderInlineBold = (str, keyPrefix) => {
  // Splits on **bold** spans and renders them as <strong>, everything else
  // stays plain text.
  const parts = str.split(/(\*\*[^*]+\*\*)/g).filter((p) => p !== "");
  return parts.map((part, idx) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4
      ? <strong key={`${keyPrefix}-${idx}`}>{part.slice(2, -2)}</strong>
      : <span key={`${keyPrefix}-${idx}`}>{part}</span>
  );
};

// A line of just dashes/pipes/colons (e.g. "|---|---|") is a markdown table
// divider row — it carries no information for the reader, so drop it.
const isTableDividerLine = (line) => /^[\s|:-]+$/.test(line) && line.includes("-");

const AnswerText = ({ text }) => {
  if (!text) return null;
  return (
    <div className="space-y-2">
      {text.split("\n").map((line, i) => {
        let trimmed = line.trim();
        if (!trimmed) return null;
        if (isTableDividerLine(trimmed)) return null;

        // Strip markdown header markers (#, ##, ...) — render as bold text
        // instead of showing the literal hash symbols.
        const headerMatch = trimmed.match(/^#{1,6}\s+(.*)/);
        const isHeader = !!headerMatch;
        if (isHeader) trimmed = headerMatch[1];

        if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
          const bulletText = trimmed.replace(/^[•\-]\s*/, "");
          return (
            <div key={i} className="flex gap-2.5">
              <span className="flex-shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-[#C4561A]" />
              <span>{renderInlineBold(bulletText, `b${i}`)}</span>
            </div>
          );
        }

        // A pipe-separated line that leaked out of a markdown table
        // ("Name | Designation | Contact") — render as a clean inline
        // list with dot separators instead of raw pipe characters.
        if (trimmed.includes("|")) {
          const cells = trimmed.split("|").map((c) => c.trim()).filter(Boolean);
          return (
            <p key={i} className="flex flex-wrap gap-x-1">
              {cells.map((cell, ci) => (
                <span key={ci}>
                  {renderInlineBold(cell, `c${i}-${ci}`)}
                  {ci < cells.length - 1 && <span className="text-[#C4561A] mx-1.5">•</span>}
                </span>
              ))}
            </p>
          );
        }

        if (isHeader) {
          return <p key={i} className="font-bold">{renderInlineBold(trimmed, `h${i}`)}</p>;
        }

        return <p key={i}>{renderInlineBold(trimmed, `p${i}`)}</p>;
      })}
    </div>
  );
};

// ── Bot avatar ─────────────────────────────────────────────────────────────
const BotAvatar = () => (
  <div className="w-10 h-10 rounded-full bg-[#FBF1DA] ring-2 ring-[#E3B94F] flex items-center justify-center flex-shrink-0 overflow-hidden">
    <img src="/bhu/AI-icon.png" alt="MMVerse"
      className="w-10 h-10 rounded-full object-cover"
      onError={(e) => { e.target.style.display = "none"; e.target.parentNode.innerText = "🤖"; }} />
  </div>
);

// ── Typing indicator ───────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex items-end gap-2.5">
    <BotAvatar />
    <div className="bg-[#E5C29C] rounded-2xl rounded-bl-sm px-4 py-3.5 flex gap-1.5 items-center">
      <span className="w-2 h-2 bg-[#0D1F3C] rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 bg-[#0D1F3C] rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 bg-[#0D1F3C] rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  </div>
);

// ── Table cell — auto-detects file paths/URLs and renders them as a
// clickable link instead of dumping the raw upload path as plain text ──────
const isFileLike = (val) =>
  typeof val === "string" &&
  (/\.(pdf|docx?|xlsx?|pptx?|jpe?g|png)$/i.test(val) || val.startsWith("/uploads/") || val.startsWith("http"));

const friendlyFileName = (val) => {
  // Uploaded files are saved like:
  //   /uploads/fac_<hash>___table_pdf__Botony Syllabusnep.pdf
  // Everything after the last "__" is the original, human-readable filename.
  const parts = val.split("__");
  return parts[parts.length - 1] || val;
};

const TableCell = ({ value }) => {
  if (!isFileLike(value)) return <>{value}</>;
  const href = value.startsWith("http") ? value : `${API_BASE}${value}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[#0D1F3C] font-semibold underline decoration-[#E3B94F] decoration-2 underline-offset-2 hover:text-[#C4561A]"
    >
      📄 {friendlyFileName(value)}
    </a>
  );
};

// ── Table asset ────────────────────────────────────────────────────────────
const TableAsset = ({ tableData }) => {
  if (!tableData?.columns) return null;
  const { tableHeading, columns, rows = [] } = tableData;
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border-2 border-[#0D1F3C]/10 shadow-sm">
      {tableHeading && (
        <div className="mmv-font-display bg-[#0D1F3C] text-white text-base font-semibold tracking-wide px-4 py-2.5 rounded-t-lg">
          {tableHeading}
        </div>
      )}
      <table className="w-full text-[15px]">
        <thead>
          <tr className="bg-[#FBF1DA]">
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-bold text-[#0D1F3C] whitespace-nowrap border-b-2 border-[#E3B94F]/60">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#FAF6EE]"}>
              {(Array.isArray(row) ? row : columns.map((col) => row[col] ?? "")).map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-black border-t border-[#0D1F3C]/8 leading-relaxed">
                  <TableCell value={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Section menu (shown after intro and after each answer) ─────────────────
const SECTION_BADGE_COLORS = {
  administration: "bg-[#0D1F3C]",
  academics: "bg-[#0D1F3C]",
  facilities: "bg-[#0D1F3C]",
  notices: "bg-[#0D1F3C]",
};

const SectionMenu = ({ onSelect, disabled }) => (
  <div className="flex items-start gap-2 sm:gap-2.5">
    <BotAvatar />
    <div className="flex-1 min-w-0">
      <div className="bg-[#E5C29C] text-black text-[15px] sm:text-[17px] rounded-2xl rounded-bl-sm px-3.5 sm:px-4 py-3 sm:py-3.5 mb-2.5 sm:mb-3 leading-relaxed">
        Which section would you like to ask about?
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
        {SECTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => onSelect(s)}
            disabled={disabled}
            className="flex items-center gap-2.5 sm:gap-3 text-left bg-white border-2 border-[#0D1F3C]/50 px-3 sm:px-3.5 py-2.5 sm:py-3 rounded-xl
                       hover:border-[#0D1F3C] hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed group min-w-0"
          >
            <span className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${SECTION_BADGE_COLORS[s.value]} flex items-center justify-center text-sm sm:text-base flex-shrink-0 shadow-sm`}>
              {s.icon}
            </span>
            <span className="text-[15px] sm:text-[16px] font-semibold text-[#0D1F3C] group-hover:text-[#C4561A] transition-colors truncate">
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ── Bot answer message ─────────────────────────────────────────────────────
const BotMessage = ({ msg }) => (
  <div className="flex items-start gap-2.5">
    <BotAvatar />
    <div className="flex-1 max-w-[87%] space-y-2">
      <div className="bg-[#E5C29C] text-black text-[17px] rounded-2xl rounded-bl-sm px-4 py-3.5 leading-[1.7]">
        <AnswerText text={msg.text} />
      </div>

      {msg.asset?.asset_type === "table" && <TableAsset tableData={msg.asset.table_data} />}

      {msg.asset?.asset_type === "pdf" && msg.asset.file_url && (
        <a
          href={msg.asset.file_url.startsWith("http") ? msg.asset.file_url : `${API_BASE}${msg.asset.file_url}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white border-2 border-[#E3B94F] text-[#0D1F3C] text-[15px] font-semibold px-3.5 py-2.5 rounded-lg hover:bg-[#FBF1DA] transition-colors"
        >
          <span>📄</span><span>{msg.asset.file_name || "Download PDF"}</span>
        </a>
      )}

      {msg.asset?.asset_type === "image" && msg.asset.file_url && (
        <img
          src={msg.asset.file_url.startsWith("http") ? msg.asset.file_url : `${API_BASE}${msg.asset.file_url}`}
          alt={msg.asset.file_name || "Related image"}
          className="rounded-xl max-h-56 object-cover border-2 border-[#73614E]"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      )}

      {msg.section_url && (
        <Link to={msg.section_url}
          className="inline-flex items-center gap-1.5 text-[15px] text-[#0D1F3C] hover:text-[#C4561A] font-semibold underline decoration-[#E3B94F] decoration-2 underline-offset-2 transition-colors">
          🔗 View full section{msg.section_title ? ` — ${msg.section_title}` : ""}
        </Link>
      )}
    </div>
  </div>
);

// ── User message ───────────────────────────────────────────────────────────
const UserMessage = ({ text }) => (
  <div className="flex justify-end">
    <div className="bg-[#0D1F3C] text-white text-[17px] rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%] leading-relaxed shadow-sm">
      {text}
    </div>
  </div>
);

// ── Fallback message ───────────────────────────────────────────────────────
const FallbackMessage = ({ msg }) => {
  const isOffTopic = msg.fallback_type === "offtopic";
  return (
    <div className="flex items-start gap-2.5">
      <BotAvatar />
      <div className="flex-1 max-w-[87%] space-y-2">
        <div className={`text-[17px] rounded-2xl rounded-bl-sm px-4 py-3.5 leading-[1.7]
          ${isOffTopic
            ? "bg-[#eef0fb] border-2 border-[#c7c7ff] text-black"
            : "bg-[#FFF6EC] border-2 border-[#E3B94F]/50 text-black"}`}>
          {isOffTopic && <span className="block text-sm font-bold mb-1 text-[#3d3d8f] tracking-wide uppercase">Out of scope</span>}
          <AnswerText text={msg.text} />
        </div>
        {!isOffTopic && msg.section_url && (
          <Link to={msg.section_url}
            className="inline-flex items-center gap-1.5 text-[15px] text-[#0D1F3C] font-semibold underline decoration-[#E3B94F] decoration-2 underline-offset-2">
            🔗 {msg.section_title ? `Browse: ${msg.section_title}` : "Browse closest section"}
          </Link>
        )}
      </div>
    </div>
  );
};

// ── Section label pill (shown after user picks a section) ──────────────────
const SectionLabel = ({ label }) => (
  <div className="flex justify-end">
    <div className="bg-[#0D1F3C] text-white text-[17px] rounded-2xl rounded-br-sm px-4 py-3 shadow-sm">
      {label}
    </div>
  </div>
);

// ── Main page ──────────────────────────────────────────────────────────────
export default function MMVerse() {
  // Each item: { type: 'intro'|'section-menu'|'user'|'bot'|'fallback'|'section-label', ...data }
  const [items, setItems] = useState([
    { type: "intro" },
    { type: "section-menu" },
  ]);
  const [activeSection, setActiveSection] = useState(null); // currently selected section
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [items, loading]);

  const handleSectionSelect = (section) => {
    setActiveSection(section);
    // Show user picked the section as a bubble, then show welcome message
    setItems((prev) => [
      ...prev,
      { type: "section-label", label: `${section.icon} ${section.label}` },
      { type: "section-welcome", text: section.welcome },
    ]);
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
  };

  const sendQuestion = async (question) => {
    const q = question.trim();
    if (!q || loading) return;

    setItems((prev) => [...prev, { type: "user", text: q }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, section: activeSection ? activeSection.value : null }),
      });
      if (!res.ok) {
        // Server responded but with an error status — treat as fallback, not connection error
        setItems((prev) => [...prev,
          {
            type: "fallback",
            text: "I'm having trouble processing that question. Please try rephrasing it or selecting a specific section.",
            section_url: null, section_title: null, fallback_type: "no_content",
          },
          { type: "section-menu" },
        ]);
        setActiveSection(null);
        return;
      }
      const data = await res.json();

      if (data.matched) {
        setItems((prev) => [...prev,
          {
            type: "bot",
            text: data.answer,
            asset: data.asset || null,
            section_url: data.section_url,
            section_title: data.section_title,
          },
          { type: "section-menu" }, // show menu again after answer
        ]);
      } else {
        setItems((prev) => [...prev,
          {
            type: "fallback",
            text: data.message,
            section_url: data.section_url,
            section_title: data.section_title,
            fallback_type: data.fallback_type || "no_content",
          },
          { type: "section-menu" }, // show menu again after fallback too
        ]);
      }
      setActiveSection(null); // reset section after each answer
    } catch (err) {
      // Only reaches here for actual network failures (no internet, server down)
      // Server-side errors (503, Groq issues) are handled above via res.ok check
      setItems((prev) => [...prev,
        {
          type: "fallback",
          text: "Unable to connect to the server. Please check your internet connection and try again.",
          section_url: null, section_title: null, fallback_type: "no_content",
        },
        { type: "section-menu" },
      ]);
      setActiveSection(null);
    } finally {
      setLoading(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  };

  // const showInput = !!activeSection && !loading;

  return (
    <div className="min-h-screen bg-[#EAEFF5]">
      <BrandFonts />

      {/* UNIFIED OFFICIAL PAGE HEADER BANNER */}
      <div className="relative overflow-hidden bg-[#0f3358] px-4 py-8 sm:py-10 shadow-xl border-b-4 border-[#d4af37]">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#7d311f] text-[#fce8b2] text-xs font-semibold uppercase tracking-wider mb-2 border border-[#d4af37]/40 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-ping" />
            Official AI Information Portal
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-2 font-cinzel tracking-wide">
            MMVerse Assistant
          </h1>
          <p className="text-slate-200 text-sm sm:text-base max-w-xl mx-auto">
            Your official AI assistant for Mahila Maha Vidyalaya, BHU — select a topic or ask any query
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Chat card — identical width as header banner */}
        <div
          className="mmv-font-body bg-[#FAF7F2] rounded-2xl shadow-xl border-2 border-[#0f3358]/30 flex flex-col overflow-hidden w-full"
          style={{ height: "clamp(480px, 80vh, 750px)" }}
        >
          {/* Header */}
          <div className="relative flex items-center gap-2.5 sm:gap-3 bg-[#0D1F3C] px-3.5 sm:px-5 py-3 sm:py-4 flex-shrink-0 overflow-hidden">
            <TempleMotif className="absolute right-2 -top-4 w-40 h-40 text-[#E3B94F] pointer-events-none" opacity={0.12} />
            <div className="relative w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-[#FBF1DA] ring-2 ring-[#E3B94F] flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src="/bhu/AI-icon.png" alt="MMVerse AI"
                className="w-9 h-9 sm:w-12 sm:h-12 rounded-full object-cover"
                onError={(e) => { e.target.style.display = "none"; e.target.parentNode.innerText = "🤖"; }} />
            </div>
            <div className="relative min-w-0">
              <div className="mmv-font-display text-lg sm:text-2xl font-bold text-white leading-none tracking-wide truncate">MMVerse</div>
              <div className="text-xs sm:text-sm text-[#E3B94F] mt-0.5 sm:mt-1 font-medium truncate">AI Campus Assistant</div>
            </div>
            <div className="relative ml-auto flex items-center gap-1.5 flex-shrink-0">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-400" />
              <span className="text-xs sm:text-sm text-[#FBF1DA] font-medium">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3.5 sm:px-5 py-4 sm:py-5 space-y-4 sm:space-y-5">

            {items.map((item, i) => {
              if (item.type === "intro") return (
                <div key={i} className="flex items-start gap-2.5">
                  <BotAvatar />
                  <div className="bg-[#E5C29C] text-black text-[17px] rounded-2xl rounded-bl-sm px-4 py-3.5 max-w-[87%] leading-[1.7]">
                    Hi! I'm <strong className="text-[#0D1F3C]">MMVerse</strong>, your AI assistant for Mahila Maha Vidyalaya, BHU.
                    Ask me anything about academics, facilities, administration, or campus life.
                  </div>
                </div>
              );

              if (item.type === "section-menu") return (
                <SectionMenu key={i} onSelect={handleSectionSelect} disabled={loading} />
              );

              if (item.type === "section-label") return (
                <SectionLabel key={i} label={item.label} />
              );

              if (item.type === "section-welcome") return (
                <div key={i} className="flex items-start gap-2.5">
                  <BotAvatar />
                  <div className="bg-[#E5C29C] text-black text-[17px] rounded-2xl rounded-bl-sm px-4 py-3.5 max-w-[87%] leading-[1.7]">
                    <AnswerText text={item.text} />
                  </div>
                </div>
              );

              if (item.type === "user") return (
                <UserMessage key={i} text={item.text} />
              );

              if (item.type === "bot") return (
                <BotMessage key={i} msg={item} />
              );

              if (item.type === "fallback") return (
                <FallbackMessage key={i} msg={item} />
              );

              return null;
            })}

            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Input — select a section */}
          <div className="px-3.5 sm:px-5 py-3 sm:py-4 flex-shrink-0 bg-white">
            <form onSubmit={(e) => { e.preventDefault(); sendQuestion(input); }} className="flex gap-2 sm:gap-2.5">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeSection
                  ? `Ask about ${activeSection.label}...`
                  : "Ask a question..."}
                disabled={loading}
                className="flex-1 min-w-0 bg-white rounded-xl px-3.5 sm:px-4 py-3 sm:py-3.5 text-[15px] sm:text-[16px] text-black border-2 border-[#0D1F3C]/50 placeholder-[#0D1F3C]/40 focus:outline-none focus:border-[#C4561A] transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-11 h-11 sm:w-12 sm:h-12 bg-[#C4561A] hover:bg-[#a3450f] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center text-white text-xl transition-colors flex-shrink-0 shadow-sm"
                aria-label="Send"
              >→</button>
            </form>
          </div>
        </div>

        {/* Suggested questions */}
        <div className="mt-5 sm:mt-6 px-1">
          <p className="mmv-font-body text-[13px] sm:text-[15px] font-semibold text-[#0D1F3C] mb-2 sm:mb-2.5 text-center tracking-wide uppercase">
            Try asking
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-2.5 justify-center">
            {[
              "What are the MMV library timings?",
              "Who is the principal of MMV?",
              "Tell me about hostel facilities",
              "What medical facilities are available?",
              "When is the end semester exam?",
              "Tell me about NSS at MMV",
            ].map((s) => (
              <button
                key={s}
                onClick={() => sendQuestion(s)}
                disabled={loading}
                className="mmv-font-body text-[15px] font-medium bg-white border-2 border-[#0D1F3C]/50 text-[#0D1F3C] px-4 py-2 rounded-full hover:bg-[#FBF1DA] hover:border-[#E3B94F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <p className="mmv-font-body mt-6 text-center text-[14px] text-black/70 italic">
          MMVerse answers are sourced from the MMV portal. For official matters,
          please contact the relevant department directly.
        </p>
      </div>
    </div>
  );
}