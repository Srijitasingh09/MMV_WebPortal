import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ---------------------------------------------------------------------------
// Your own icon: drop your image file into /public (e.g. /public/mmverse-icon.png)
// and point this at it. Works with .png, .svg, .webp, etc.
// ---------------------------------------------------------------------------
const AVATAR_ICON_SRC = "/bhu/AI-icon.png";

// ---------------------------------------------------------------------------
// Custom per-page heading — edit this map instead of relying on the page's
// <h1> / document.title. Key = route path (or prefix), value = heading text.
// "default" is used for any path not listed below.
// ---------------------------------------------------------------------------
const PAGE_HEADINGS = {
  default: "Mahila Maha Vidyalaya",
  "/": "Mahila Maha Vidyalaya",
  "/administration": "Administration",
  "/academics": "Academics",
  "/facilities": "Facilities",
  "/notices": "Notices",
};

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
  "Tell me about hostel facilities available in MMV",
  "Whom to contact in case of medical emergency?",
  "What is the schedule for semester exams?",
];

// Looks up the custom heading for a route from PAGE_HEADINGS.
// Matches the exact path first, then the longest matching prefix, then falls
// back to "default". No DOM scraping — just the config map above.
const getPageHeading = (pathname) => {
  if (PAGE_HEADINGS[pathname]) return PAGE_HEADINGS[pathname];

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length > 1) {
    const last = decodeURIComponent(parts[parts.length - 1]);
    return last
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  const prefixMatch = Object.keys(PAGE_HEADINGS)
    .filter((key) => key !== "default" && key !== "/" && pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];

  return prefixMatch ? PAGE_HEADINGS[prefixMatch] : PAGE_HEADINGS.default;
};

const sectionFromPath = (pathname) => {
  const first = pathname.split("/").filter(Boolean)[0];
  return ["administration", "academics", "facilities", "notices"].includes(first) ? first : null;
};

const cleanText = (value) =>
  String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/```(?:markdown|text|html|plain)?/gi, "")
    .replace(/```/g, "")
    .replace(/\*\*/g, "")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/^\s*[<>]+\s?/gm, "")
    .replace(/^\s*\+{3,}\s*$/gm, "")
    .replace(/^\s*(?:answer|response|retrieved information)\s*:\s*/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

// ---------------------------------------------------------------------------
// Assistant Avatar — renders your own icon (see AVATAR_ICON_SRC above).
// Falls back to a simple gold "M" monogram if the image fails to load.
// ---------------------------------------------------------------------------
const RoboAvatar = ({ size = 64, listening = false, glowBorder = false }) => {
  const [errored, setErrored] = useState(false);

  const borderClasses = listening
    ? "ring-2 ring-[#B5451D] animate-pulse"
    : glowBorder
      ? "border-2 mmv-color-cycle mmv-glow"
      : "ring-2 ring-[#E3B94F]";

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative shrink-0 select-none overflow-hidden rounded-full ${borderClasses}`}
    >
      {!errored ? (
        <img
          src={AVATAR_ICON_SRC}
          alt="MMVerse assistant icon"
          onError={() => setErrored(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#0D1F3C] text-[#E3B94F] font-bold">
          <span style={{ fontSize: size * 0.42 }}>M</span>
        </div>
      )}
    </div>
  );
};

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

  // Custom page heading, looked up from PAGE_HEADINGS for the current route
  const pageHeading = useMemo(() => getPageHeading(location.pathname), [location.pathname]);

  const recognitionRef = useRef(null);
  const recorderRef = useRef(null);
  const section = useMemo(() => sectionFromPath(location.pathname), [location.pathname]);

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
      {/* Continuous luminous glow used by the launcher button and the suggestion box */}
      <style>{`
        @keyframes mmv-glow-pulse {
          0%, 100% {
            box-shadow: 0 0 12px 3px rgba(227,185,79,0.6), 0 0 26px 9px rgba(37,99,235,0.35);
          }
          50% {
            box-shadow: 0 0 22px 7px rgba(37,99,235,0.85), 0 0 42px 15px rgba(227,185,79,0.55);
          }
        }
        .mmv-glow {
          animation: mmv-glow-pulse 2.2s ease-in-out infinite;
        }
        @keyframes mmv-color-cycle {
          0%, 100% {
            border-color: #D4A72C;
            background-color: #D4A72C;
          }
          50% {
            border-color: #2563EB;
            background-color: #2563EB;
          }
        }
        .mmv-color-cycle {
          animation: mmv-color-cycle 2.2s ease-in-out infinite;
        }
      `}</style>

      {/* ---------------- Closed state: square suggestion box + glowing launcher ---------------- */}
      {!open && (
        <div className="fixed bottom-4 right-4 z-[1200] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
          {/* Square-ish suggestion box */}
          <div
            onClick={() => setOpen(true)}
            className="group relative flex min-h-[110px] w-[140px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-[#D4A72C] bg-[#FFF8E8] px-3 py-3 text-center shadow-xl transition-all duration-300 ease-out sm:w-[150px]"
            role="button"
            aria-label={`${COPY.tryLabel}: ${suggestions[suggestionIndex]}`}
          >
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#A6541B]">
              <span>✨</span>
              <span>{COPY.tryLabel}</span>
            </div>
            <p className="text-xs font-bold leading-snug text-[#0D1F3C]">
              {suggestions[suggestionIndex]}
            </p>
            {/* Tail pointing down to robot avatar */}
            <div className="absolute -bottom-2 right-6 h-3 w-3 rotate-45 border-b-2 border-r-2 border-[#D4A72C] bg-[#FFF8E8]" />
          </div>

          <button
            onClick={() => setOpen(true)}
            className="mmv-glow mmv-color-cycle group relative flex h-22 w-22 items-center justify-center rounded-full border-[5px] shadow-2xl transition-transform duration-300 hover:scale-110 active:scale-95"
            aria-label={COPY.openLabel}
          >
            <RoboAvatar size={70} glowBorder />
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
            {/* Terracotta separation bar on the panel's left edge */}
            <div className="absolute inset-y-0 left-0 w-[4px] bg-[#B5451D]" aria-hidden="true" />

            {/* Header with custom page heading + gold underline */}
            <header className="flex items-start justify-between gap-3 border-b-2 border-[#E3B94F] bg-[#0D1F3C] px-4 py-4 text-white pl-5">
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
                <div className="rounded-xl border border-[#E3B94F] bg-[#FFF8E8] p-3.5 text-sm text-black shadow-sm">
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
                      : "mr-2 rounded-2xl border border-[#E3B94F]/50 bg-[#F3E4C4] px-3.5 py-2.5 text-sm text-[#1D1D1D] shadow-sm sm:mr-4"
                  }
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  <WidgetAsset asset={message.asset} />
                  {message.sectionUrl && message.sectionUrl.startsWith("/") && !message.sectionUrl.startsWith("/uploads/") && !/\.pdf(?:$|\?)/i.test(message.sectionUrl) && (
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
                <p className="text-[11px] font-bold text-black uppercase tracking-wider">
                  {COPY.tryLabel}:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => ask(item)}
                      disabled={loading}
                      className="rounded-full border border-blue bg-[#F8FAFC] px-2.5 py-1 text-left text-xs font-medium text-blue hover:border-[#0D1F3C] hover:bg-[#F1F5F9] transition-all disabled:opacity-50"
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
                  className="min-w-0 flex-1 resize-none rounded-xl border border-blue px-3 py-2 text-sm text-[#0F172A] outline-none transition-colors focus:border-[#0D1F3C] focus:ring-1 focus:ring-[#0D1F3C]"
                />
                <button
                  onClick={startVoice}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                    listening
                      ? "border-red-300 bg-red-50 text-red-600"
                      : "border-blue bg-[#F8FAFC] hover:bg-[#E2E8F0]"
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