import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const SECTIONS = [
  {
    label: "🏛️ Administration",
    value: "administration",
    welcome: "You've selected Administration. I can help you with:\n• Vice Chancellor & Principal details\n• Dean of Students information\n• Student Advisor & Chief Proctor contacts\n• Office staff directory\n• Examination controllers\n• Administrative office incontacts\n\nWhat would you like to know?"
  },
  {
    label: "📚 Academics",
    value: "academics",
    welcome: "You've selected Academics. I can help you with:\n• UG & PG syllabus downloads (Science, Arts, Social Science)\n• National Education Policy (NEP) details\n• Elective courses and credit structure\n• SWAYAM online courses\n• Section In-Charge contacts (Science, Arts, Social Science)\n• Academic calendar & holiday list\n\nWhat would you like to know?"
  },
  {
    label: "🏫 Facilities",
    value: "facilities",
    welcome: "You've selected Facilities. I can help you with:\n• Hostels (Chief Warden, Coordinator, Jyoti Kunj, Kirti Kunj, Pragya Kunj, Swasti Kunj, Kundan Devi)\n• Libraries (MMV Library, Central Library, Cyber Library)\n• Medical (Sir Sundarlal Hospital, Trauma Centre, Health Centre)\n• Sports & Gymnasium\n• Canteen, Banks, Transport\n• NSS, NCC, NLSC & extracurricular activities\n• Training & Placement Cell\n• Auditorium, Guest Houses & other campus facilities\n\nWhat would you like to know?"
  },
  {
    label: "📢 Notices",
    value: "notices",
    welcome: "You've selected Notices. I can help you with:\n• Latest notices and announcements from MMV\n• Exam notices and important dates\n• General college announcements\n\nWhat would you like to know?"
  },
];

// ── Render answer text with bullet points ─────────────────────────────────
const AnswerText = ({ text }) => {
  if (!text) return null;
  return (
    <div className="space-y-1.5">
      {text.split("\n").map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
          return (
            <div key={i} className="flex gap-2">
              <span className="flex-shrink-0 mt-0.5">•</span>
              <span>{trimmed.replace(/^[•\-]\s*/, "")}</span>
            </div>
          );
        }
        return <p key={i}>{trimmed}</p>;
      })}
    </div>
  );
};

// ── Bot avatar ─────────────────────────────────────────────────────────────
const BotAvatar = () => (
  <div className="w-9 h-9 rounded-full bg-[#EEF3FC] flex items-center justify-center flex-shrink-0 overflow-hidden">
    <img src="/bhu/AI-icon.png" alt="MMVerse"
      className="w-9 h-9 rounded-full object-cover"
      onError={(e) => { e.target.style.display = "none"; e.target.parentNode.innerText = "🤖"; }} />
  </div>
);

// ── Typing indicator ───────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex items-end gap-2">
    <BotAvatar />
    <div className="bg-[#FFC6AD] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
      <span className="w-2 h-2 bg-[#02226E] rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 bg-[#02226E] rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 bg-[#02226E] rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  </div>
);

// ── Table asset ────────────────────────────────────────────────────────────
const TableAsset = ({ tableData }) => {
  if (!tableData?.columns) return null;
  const { tableHeading, columns, rows = [] } = tableData;
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-[#dce6f5]">
      {tableHeading && (
        <div className="bg-[#132C58] text-white text-sm font-semibold px-3 py-2 rounded-t-xl">
          {tableHeading}
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#EEF3FC]">
            {columns.map((col, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-[#132C58] whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#fff8f5]"}>
              {(Array.isArray(row) ? row : Object.values(row)).map((cell, j) => (
                <td key={j} className="px-3 py-2 text-black border-t border-[#f0e8e4]">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Section menu (shown after intro and after each answer) ─────────────────
const SectionMenu = ({ onSelect, disabled }) => (
  <div className="flex items-start gap-2">
    <BotAvatar />
    <div className="flex-1">
      <div className="bg-[#FFC6AD] text-black text-base rounded-2xl rounded-bl-sm px-4 py-3 mb-3 leading-relaxed">
        Which section would you like to ask about?
      </div>
      <div className="grid grid-cols-2 gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => onSelect(s)}
            disabled={disabled}
            className="text-left text-base bg-white border-2 border-[#02226E] text-[#02226E] font-medium px-4 py-2.5 rounded-xl hover:bg-[#02226E] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ── Bot answer message ─────────────────────────────────────────────────────
const BotMessage = ({ msg }) => (
  <div className="flex items-start gap-2">
    <BotAvatar />
    <div className="flex-1 max-w-[87%] space-y-2">
      <div className="bg-[#FFC6AD] text-black text-base rounded-2xl rounded-bl-sm px-4 py-3 leading-relaxed">
        <AnswerText text={msg.text} />
      </div>

      {msg.asset?.asset_type === "table" && <TableAsset tableData={msg.asset.table_data} />}

      {msg.asset?.asset_type === "pdf" && msg.asset.file_url && (
        <a
          href={msg.asset.file_url.startsWith("http") ? msg.asset.file_url : `${API_BASE}${msg.asset.file_url}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white border-2 border-[#FFC6AD] text-[#02226E] text-sm font-medium px-3 py-2 rounded-lg hover:bg-[#fff0e8] transition-colors"
        >
          <span>📄</span><span>{msg.asset.file_name || "Download PDF"}</span>
        </a>
      )}

      {msg.asset?.asset_type === "image" && msg.asset.file_url && (
        <img
          src={msg.asset.file_url.startsWith("http") ? msg.asset.file_url : `${API_BASE}${msg.asset.file_url}`}
          alt={msg.asset.file_name || "Related image"}
          className="rounded-xl max-h-56 object-cover border border-[#FFC6AD]"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      )}

      {msg.section_url && (
        <Link to={msg.section_url}
          className="inline-flex items-center gap-1.5 text-sm text-[#02226E] hover:text-[#132C58] font-medium underline underline-offset-2 transition-colors">
          🔗 View full section{msg.section_title ? ` — ${msg.section_title}` : ""}
        </Link>
      )}
    </div>
  </div>
);

// ── User message ───────────────────────────────────────────────────────────
const UserMessage = ({ text }) => (
  <div className="flex justify-end">
    <div className="bg-[#02226E] text-white text-base rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%] leading-relaxed shadow-sm">
      {text}
    </div>
  </div>
);

// ── Fallback message ───────────────────────────────────────────────────────
const FallbackMessage = ({ msg }) => {
  const isOffTopic = msg.fallback_type === "offtopic";
  return (
    <div className="flex items-start gap-2">
      <BotAvatar />
      <div className="flex-1 max-w-[87%] space-y-2">
        <div className={`text-base rounded-2xl rounded-bl-sm px-4 py-3 leading-relaxed
          ${isOffTopic
            ? "bg-[#f0f0ff] border border-[#c7c7ff] text-black"
            : "bg-[#FFF7ED] border border-[#fed7aa] text-black"}`}>
          {isOffTopic && <span className="block text-sm font-semibold mb-1 text-[#3d3d8f]">Out of scope</span>}
          {msg.text}
        </div>
        {!isOffTopic && msg.section_url && (
          <Link to={msg.section_url}
            className="inline-flex items-center gap-1.5 text-sm text-[#02226E] font-medium underline underline-offset-2">
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
    <div className="bg-[#02226E] text-white text-base rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items, loading]);

  const handleSectionSelect = (section) => {
    setActiveSection(section);
    // Show user picked the section as a bubble, then show welcome message
    setItems((prev) => [
      ...prev,
      { type: "section-label", label: section.label },
      { type: "section-welcome", text: section.welcome },
    ]);
    setTimeout(() => inputRef.current?.focus(), 100);
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
        const botId2 = (Date.now() + 1).toString();
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
      inputRef.current?.focus();
    }
  };

  // const showInput = !!activeSection && !loading;

  return (
    <div className="min-h-screen bg-[#F8FDFC] py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Page header */}
        <div className="mb-8 text-center">
          <span
            className="inline-block bg-[#fadccf] text-[#03153C] text-3xl font-semibold uppercase tracking-widest px-5 py-2 rounded-full mb-3 leading-snug"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            MMVerse
          </span>
          <p className="text-black text-base leading-relaxed max-w-lg mx-auto">
            Your AI assistant for Mahila Maha Vidyalaya, BHU. Select a section below and ask your question.
          </p>
        </div>

        {/* Chat card */}
        <div
          className="bg-white rounded-2xl shadow-md border-4 border-[#00103c] flex flex-col"
          style={{ height: "85vh", minHeight: "600px" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-[#132C58] rounded-t-xl px-5 py-4 flex-shrink-0">
            <div className="w-11 h-11 rounded-full bg-[#EEF3FC] flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src="/bhu/AI-icon.png" alt="MMVerse AI"
                className="w-11 h-11 rounded-full object-cover"
                onError={(e) => { e.target.style.display = "none"; e.target.parentNode.innerText = "🤖"; }} />
            </div>
            <div>
              <div className="text-xl font-bold text-white leading-none">MMVerse</div>
              <div className="text-2sm text-blue-100 mt-0.5">AI Campus Assistant</div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="text-2sm text-blue-200">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

            {items.map((item, i) => {
              if (item.type === "intro") return (
                <div key={i} className="flex items-start gap-2">
                  <BotAvatar />
                  <div className="bg-[#FFC6AD] text-black text-base rounded-2xl rounded-bl-sm px-4 py-3 max-w-[87%] leading-relaxed">
                    Hi! I'm <strong>MMVerse</strong>, your AI assistant for Mahila Maha Vidyalaya, BHU.
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
                <div key={i} className="flex items-start gap-2">
                  <BotAvatar />
                  <div className="bg-[#FFC6AD] text-black text-base rounded-2xl rounded-bl-sm px-4 py-3 max-w-[87%] leading-relaxed">
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
          <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); sendQuestion(input); }} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeSection
                  ? `Ask about ${activeSection.label.replace(/^[^\w]+/, "")}...`
                  : "Ask a question..."}
                disabled={loading}
                className="flex-1 bg-white rounded-xl px-4 py-3 text-base text-black border-2 border-[#02226E] placeholder-gray-400 focus:outline-none focus:border-[#132C58] transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-11 h-11 bg-[#02226E] hover:bg-[#132C58] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center text-white text-lg transition-colors flex-shrink-0"
                aria-label="Send"
              >→</button>
            </form>
          </div>
        </div>
         {/* Suggested questions */}
          <div className="mt-5">
            <p className="text-sm text-black mb-2 text-center">Try asking:</p>
            <div className="flex flex-wrap gap-2 justify-center">
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
                  className="text-sm bg-white border border-[#011D61] text-[#02226E] px-3 py-1.5 rounded-full hover:bg-[#fff0e8] hover:border-[#754541] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        <p className="mt-5 text-center text-sm text-black italic">
          MMVerse answers are sourced from the MMV portal. For official matters,
          please contact the relevant department directly.
        </p>
      </div>
    </div>
  );
}