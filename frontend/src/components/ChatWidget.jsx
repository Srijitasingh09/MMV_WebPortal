import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Standardized copy — single source of truth for all widget text
const COPY = {
  assistantName: "MMVerse Assistant",
  headingPrefix: "Ask about",
  subtitleScoped: "Answers are strictly limited to this page.",
  emptyState: "Ask any question about the content on this page.",
  inputPlaceholder: "Type your question in English or Hinglish…",
  sendButton: "Ask",
  loadingMessage: "Looking that up…",
  micStart: "Record a voice question",
  micStop: "Stop recording",
  micUnsupported: "Voice input isn't supported in this browser. Try Chrome, or type your question instead.",
  micNoMic: "Couldn't access the microphone. Please type your question instead.",
  transcribeFailed: "Couldn't transcribe that. Please type your question instead.",
  genericError: "The assistant is busy right now. Please try again in a moment.",
  viewSourcePrefix: "View",
  viewSourceFallback: "source section",
  closeLabel: "Close assistant",
  openLabel: "Open MMVerse assistant",
  tryLabel: "Try asking",
};

const suggestions = [
  "What information is available on this page?",
  "Who should I contact for help?",
  "Are there any documents or notices here?",
];

// Fallback path formatter if no <h1> or document.title is present
const titleFromPath = (pathname) => {
  if (!pathname || pathname === "/") return "MMV Home";
  const last = pathname.split("/").filter(Boolean).pop() || "MMV";
  return last.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

// Extracts actual Page Heading (H1 element) or Document Title
const getPageHeading = (pathname) => {
  if (typeof document !== "undefined") {
    const h1 = document.querySelector("h1");
    if (h1 && h1.textContent?.trim()) {
      return h1.textContent.trim();
    }
    if (document.title && document.title.trim()) {
      const cleanTitle = document.title.replace(/\s*[-|–—].*$/, "").trim();
      if (cleanTitle && cleanTitle.toLowerCase() !== "react app") {
        return cleanTitle;
      }
    }
  }
  return titleFromPath(pathname);
};

const sectionFromPath = (pathname) => {
  const first = pathname.split("/").filter(Boolean)[0];
  return ["administration", "academics", "facilities", "notices"].includes(first) ? first : null;
};

const cleanText = (value) =>
  String(value || "")
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .trim();

// ---------------------------------------------------------------------------
// 3D White & Blue Robot Avatar — matching uploaded robot design
// ---------------------------------------------------------------------------
const RoboAvatar = ({ size = 64, listening = false }) => (
  <div style={{ width: size, height: size }} className="relative shrink-0 select-none">
    <style>{`
      @keyframes mmv-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      @keyframes mmv-blink { 0%,90%,100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
      @keyframes mmv-glow { 0%,100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
      @keyframes mmv-ear-pulse { 0%,100% { filter: drop-shadow(0 0 2px #0099ff); } 50% { filter: drop-shadow(0 0 6px #00d2ff); } }
      .mmv-bot-group { animation: mmv-float 3s ease-in-out infinite; transform-origin: center; }
      .mmv-bot-eye { animation: mmv-blink 4s ease-in-out infinite; transform-origin: center; }
      .mmv-bot-aura { animation: mmv-glow 2s ease-in-out infinite; transform-origin: center; }
      .mmv-bot-ear { animation: mmv-ear-pulse 2s ease-in-out infinite; }
    `}</style>
    <svg
      viewBox="0 0 100 100"
      className="h-full w-full overflow-visible"
      role="img"
      aria-label="MMVerse assistant robot"
    >
      <defs>
        {/* Helmet Outer Gradient */}
        <linearGradient id="helmetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>

        {/* Glossy Head Highlight */}
        <linearGradient id="glossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Visor Screen Gradient */}
        <linearGradient id="visorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0B1320" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        {/* Blue Metallic Ear Pods & Antenna */}
        <linearGradient id="blueAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>

        {/* Body Gradient */}
        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="85%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>

        {/* Cyan Eye Glow Filter */}
        <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Blue Shadow Hover Aura Underneath Feet */}
      <ellipse cx="50" cy="94" rx="22" ry="4" fill="#00D2FF" className="mmv-bot-aura" opacity="0.4" />

      <g className="mmv-bot-group">
        {/* Top-Left Antenna */}
        <line x1="34" y1="18" x2="24" y2="7" stroke="url(#blueAccentGrad)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="23" cy="6" r="4.5" fill="url(#blueAccentGrad)" className="mmv-bot-ear" />

        {/* Side Blue Ear Muffs/Pods */}
        <rect x="13" y="27" width="7" height="18" rx="3.5" fill="url(#blueAccentGrad)" className="mmv-bot-ear" />
        <rect x="80" y="27" width="7" height="18" rx="3.5" fill="url(#blueAccentGrad)" className="mmv-bot-ear" />

        {/* White Glossy Helmet/Head */}
        <rect x="18" y="14" width="64" height="46" rx="23" fill="url(#helmetGrad)" stroke="#CBD5E1" strokeWidth="0.8" />
        {/* Head Top Gloss */}
        <path d="M 26 17 Q 50 14 74 17 Q 66 24 34 24 Z" fill="url(#glossGrad)" />

        {/* Visor Screen */}
        <rect x="25" y="21" width="50" height="32" rx="14" fill="url(#visorGrad)" stroke="#334155" strokeWidth="1.2" />

        {/* Visor Eyes & Face expression */}
        {listening ? (
          /* Gear / Wave Face when Listening */
          <g filter="url(#cyanGlow)">
            <circle cx="39" cy="35" r="7" stroke="#00D2FF" strokeWidth="2" fill="none" strokeDasharray="3 2" />
            <circle cx="61" cy="35" r="7" stroke="#00D2FF" strokeWidth="2" fill="none" strokeDasharray="3 2" />
            <path d="M 44 44 Q 50 49 56 44" stroke="#00D2FF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>
        ) : (
          /* Friendly Glowing Cyan Eyes & Smile */
          <g className="mmv-bot-eye" filter="url(#cyanGlow)">
            <circle cx="38" cy="35" r="6" fill="#00D2FF" />
            <circle cx="40" cy="33" r="2" fill="#FFFFFF" />
            <circle cx="62" cy="35" r="6" fill="#00D2FF" />
            <circle cx="64" cy="33" r="2" fill="#FFFFFF" />
            {/* Cute Cyan Smile */}
            <path d="M 44 43 Q 50 48 56 43" stroke="#00D2FF" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        )}

        {/* Neck Joiner */}
        <rect x="42" y="58" width="16" height="5" rx="2.5" fill="#334155" />

        {/* White Glossy Torso / Body */}
        <rect x="28" y="61" width="44" height="26" rx="13" fill="url(#bodyGrad)" stroke="#CBD5E1" strokeWidth="0.8" />
        {/* Chest Plate Detail */}
        <path d="M 38 65 L 62 65 L 58 72 L 42 72 Z" fill="#E2E8F0" opacity="0.6" />

        {/* Left Arm & Hand */}
        <path d="M 28 66 Q 20 72 22 80" stroke="url(#helmetGrad)" strokeWidth="5.5" strokeLinecap="round" fill="none" />
        <circle cx="22" cy="81" r="3" fill="#334155" />

        {/* Right Arm & Hand */}
        <path d="M 72 66 Q 80 72 78 80" stroke="url(#helmetGrad)" strokeWidth="5.5" strokeLinecap="round" fill="none" />
        <circle cx="78" cy="81" r="3" fill="#334155" />

        {/* Feet */}
        <rect x="36" y="86" width="10" height="6" rx="3" fill="url(#helmetGrad)" stroke="#94A3B8" strokeWidth="0.5" />
        <rect x="54" y="86" width="10" height="6" rx="3" fill="url(#helmetGrad)" stroke="#94A3B8" strokeWidth="0.5" />
      </g>
    </svg>
  </div>
);

// ---------------------------------------------------------------------------
// Sleek SVG Mic Icon component
// ---------------------------------------------------------------------------
const MicIcon = ({ recording }) => {
  if (recording) {
    return (
      <svg className="h-5 w-5 animate-pulse text-red-600" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="6" width="12" height="12" rx="2" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5 text-[#0D1F3C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
};

const WidgetAsset = ({ asset }) => {
  if (!asset) return null;
  if (asset.asset_type === "pdf" && asset.file_url) {
    const href = asset.file_url.startsWith("http") ? asset.file_url : `${API_BASE}${asset.file_url}`;
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#D4A72C] bg-[#FFF8E8] px-3 py-2 text-xs font-semibold text-[#0D1F3C] hover:bg-[#FDF0D0] transition-colors"
      >
        <span>📄 PDF Document</span>
        {asset.page_number && <span className="opacity-80">— page {asset.page_number}</span>}
      </a>
    );
  }
  if (asset.asset_type === "table" && asset.table_data?.columns) {
    const { columns, rows = [] } = asset.table_data;
    return (
      <div className="mt-2 overflow-auto rounded-lg border border-[#D9CDBA]">
        <table className="min-w-full text-xs">
          <thead className="bg-[#FFF8E8]">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-2 py-1.5 text-left font-semibold text-[#0D1F3C]">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 5).map((row, index) => (
              <tr key={index} className="border-t border-[#EEE4D4]">
                {(Array.isArray(row) ? row : columns.map((column) => row[column] || "")).map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-2 py-1.5 text-[#334155]">{String(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return null;
};

export default function ChatWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [listening, setListening] = useState(false);

  // Dynamic Page Heading State (H1 element text, fallback to document.title / path)
  const [pageHeading, setPageHeading] = useState(() => getPageHeading(location.pathname));

  const recognitionRef = useRef(null);
  const recorderRef = useRef(null);
  const section = useMemo(() => sectionFromPath(location.pathname), [location.pathname]);

  // Keep page heading synchronized on mount, route change, or dynamic DOM updates
  useEffect(() => {
    const updateHeading = () => {
      setPageHeading(getPageHeading(location.pathname));
    };

    updateHeading();
    const t1 = setTimeout(updateHeading, 150);
    const t2 = setTimeout(updateHeading, 500);

    const observer = new MutationObserver(updateHeading);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
    };
  }, [location.pathname]);

  // Cycle launcher suggestions
  useEffect(() => {
    const timer = window.setInterval(() => setSuggestionIndex((index) => (index + 1) % suggestions.length), 5000);
    return () => window.clearInterval(timer);
  }, []);

  // Reset chat context on route change
  useEffect(() => {
    setMessages([]);
    setQuestion("");
  }, [location.pathname]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const ask = async (value = question) => {
    const text = value.trim();
    if (!text || loading) return;
    setQuestion("");
    setMessages((items) => [...items, { role: "user", text }]);
    setLoading(true);
    try {
      // Mandatory page scoping: always pass page_url
      const response = await axios.post(
        `${API_BASE}/chat`,
        {
          question: text,
          section,
          page_url: location.pathname,
        },
        { timeout: 25000 }
      );
      const data = response.data || {};
      setMessages((items) => [
        ...items,
        {
          role: "bot",
          text: cleanText(data.answer || data.message || "I couldn't find an answer for that on this page."),
          asset: data.asset,
          sectionUrl: data.section_url,
          sectionTitle: data.section_title,
          fallback: !data.matched,
        },
      ]);
    } catch (error) {
      const message = error?.response?.data?.detail || COPY.genericError;
      setMessages((items) => [...items, { role: "bot", text: cleanText(message), fallback: true }]);
    } finally {
      setLoading(false);
    }
  };

  const startVoice = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      if (listening) {
        recognitionRef.current?.stop();
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);
      recognition.onresult = (event) =>
        setQuestion((current) => `${current} ${event.results[0][0].transcript}`.trim());
      recognitionRef.current = recognition;
      recognition.start();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setMessages((items) => [...items, { role: "bot", text: COPY.micUnsupported, fallback: true }]);
      return;
    }
    if (recorderRef.current) {
      recorderRef.current.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        recorderRef.current = null;
        setListening(false);
        const form = new FormData();
        form.append("audio", new Blob(chunks, { type: recorder.mimeType || "audio/webm" }), "voice.webm");
        try {
          const response = await axios.post(`${API_BASE}/transcribe`, form, {
            timeout: 60000,
            params: { language: "en" },
          });
          setQuestion((current) => `${current} ${response.data?.text || ""}`.trim());
        } catch {
          setMessages((items) => [...items, { role: "bot", text: COPY.transcribeFailed, fallback: true }]);
        }
      };
      recorderRef.current = recorder;
      setListening(true);
      recorder.start();
      window.setTimeout(() => recorderRef.current?.stop(), 8000);
    } catch {
      setListening(false);
      setMessages((items) => [...items, { role: "bot", text: COPY.micNoMic, fallback: true }]);
    }
  };

  return (
    <>
      {/* ---------------- Closed state: speech bubble + 3D robot launcher ---------------- */}
      {!open && (
        <div className="fixed bottom-4 right-4 z-[1200] flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
          {/* Formatted speech bubble hint */}
          <div
            onClick={() => setOpen(true)}
            className="group relative max-w-[240px] cursor-pointer rounded-2xl border border-[#D4A72C] bg-[#FFF8E8] px-3.5 py-2.5 shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl sm:max-w-[280px]"
            role="button"
            aria-label={`${COPY.tryLabel}: ${suggestions[suggestionIndex]}`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#A6541B]">
              <span>✨</span>
              <span>{COPY.tryLabel}</span>
            </div>
            <p className="mt-0.5 text-xs font-semibold text-[#0D1F3C] leading-snug">
              {suggestions[suggestionIndex]}
            </p>
            {/* Tail pointing down to robot avatar */}
            <div className="absolute -bottom-2 right-6 h-3 w-3 rotate-45 border-b border-r border-[#D4A72C] bg-[#FFF8E8]" />
          </div>

          <button
            onClick={() => setOpen(true)}
            className="group relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#E2E8F0] bg-gradient-to-b from-white to-[#FAF6EE] shadow-2xl transition-transform duration-300 hover:scale-110 active:scale-95"
            aria-label={COPY.openLabel}
          >
            <RoboAvatar size={52} />
          </button>
        </div>
      )}

      {/* ---------------- Open state: widget panel ---------------- */}
      {open && (
        <>
          <aside
            className="fixed inset-y-0 right-0 z-[1200] flex w-full flex-col bg-[#FAF6EE] shadow-2xl sm:w-[390px] sm:max-w-[390px]"
            aria-label={COPY.assistantName}
          >
            {/* Darker blue separation bar on the panel's left edge (#0F2C59) */}
            <div className="absolute inset-y-0 left-0 w-[4px] bg-[#0F2C59]" aria-hidden="true" />

            {/* Header with dynamic Page Heading */}
            <header className="flex items-start justify-between gap-3 bg-[#0D1F3C] px-4 py-4 text-white pl-5">
              <div className="flex items-start gap-3">
                <RoboAvatar size={44} />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#E3B94F]">
                    {COPY.assistantName}
                  </p>
                  <h2 className="mt-0.5 text-base font-semibold leading-snug sm:text-lg">
                    {COPY.headingPrefix}{" "}
                    <span className="inline-block rounded-md bg-[#E3B94F]/20 px-2 py-0.5 text-[#E3B94F] font-bold">
                      {pageHeading}
                    </span>
                  </h2>
                  <p className="mt-1 text-xs text-white/70">{COPY.subtitleScoped}</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-2xl leading-none text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                aria-label={COPY.closeLabel}
              >
                ×
              </button>
            </header>

            {/* Chat Body */}
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pl-5">
              {messages.length === 0 && (
                <div className="rounded-xl border border-[#E3B94F]/60 bg-[#FFF8E8] p-3.5 text-sm text-[#0D1F3C] shadow-sm">
                  <p className="font-semibold text-xs text-[#A6541B] uppercase tracking-wider mb-1">💡 Assistant Ready</p>
                  <p className="text-xs leading-relaxed">{COPY.emptyState}</p>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={
                    message.role === "user"
                      ? "ml-6 rounded-2xl bg-[#0D1F3C] px-3.5 py-2.5 text-sm text-white shadow-sm sm:ml-8"
                      : "mr-2 rounded-2xl border border-[#D9CDBA] bg-white px-3.5 py-2.5 text-sm text-[#1D1D1D] shadow-sm sm:mr-4"
                  }
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  <WidgetAsset asset={message.asset} />
                  {message.sectionUrl && (
                    <Link
                      to={message.sectionUrl}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#A6541B] underline hover:text-[#833e10]"
                    >
                      {COPY.viewSourcePrefix} {message.sectionTitle || COPY.viewSourceFallback} →
                    </Link>
                  )}
                </div>
              ))}

              {loading && (
                <div className="mr-6 flex items-center gap-2 rounded-2xl bg-[#E9D1B0]/60 px-3.5 py-2.5 text-sm font-medium text-[#0D1F3C] sm:mr-12 animate-pulse">
                  <RoboAvatar size={24} />
                  <span>{COPY.loadingMessage}</span>
                </div>
              )}
            </div>

            {/* Bottom Controls & Input */}
            <div className="border-t border-[#D9CDBA] bg-white p-3 pl-5 space-y-2.5">
              {/* Formatted "Try asking" Suggestion Chips */}
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  {COPY.tryLabel}:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => ask(item)}
                      disabled={loading}
                      className="rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1 text-left text-xs font-medium text-[#334155] hover:border-[#0D1F3C] hover:bg-[#F1F5F9] transition-all disabled:opacity-50"
                    >
                      ✨ {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area & Controls */}
              <div className="flex items-end gap-2 pt-1">
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      ask();
                    }
                  }}
                  placeholder={COPY.inputPlaceholder}
                  rows={2}
                  className="min-w-0 flex-1 resize-none rounded-xl border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A] outline-none transition-colors focus:border-[#0D1F3C] focus:ring-1 focus:ring-[#0D1F3C]"
                />
                <button
                  onClick={startVoice}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                    listening
                      ? "border-red-300 bg-red-50 text-red-600"
                      : "border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#E2E8F0]"
                  }`}
                  aria-label={listening ? COPY.micStop : COPY.micStart}
                  title={listening ? COPY.micStop : COPY.micStart}
                >
                  <MicIcon recording={listening} />
                </button>
                <button
                  onClick={() => ask()}
                  disabled={loading || !question.trim()}
                  className="h-10 rounded-xl bg-[#0D1F3C] px-4 text-sm font-semibold text-white shadow transition-all hover:bg-[#1E293B] disabled:opacity-40"
                >
                  {COPY.sendButton}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}