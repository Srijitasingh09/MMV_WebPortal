import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, Bookmark, ThumbsUp, ThumbsDown, Heart, MessageSquare, Send, Clock3, Trash2, TrendingUp } from 'lucide-react';

const INTEREST_OPTIONS = [
    'Coding',
    'Artificial Intelligence',
    'Robotics',
    'Data Science',
    'Design',
    'Sports',
    'Music',
    'Research',
];

const PROBLEM_OPTIONS = [
    'Finding Classrooms',
    'Hostel Allotment',
    'Library Access',
    'Exam Guidance',
    'Department Office Help',
    'Mentorship',
];

const GOAL_OPTIONS = [
    'Build Placement Profile',
    'Improve GPA',
    'Hackathon Participation',
    'Research Publication',
    'Better Time Management',
    'Networking and Clubs',
    'Internship Readiness',
];

const Recommendations = () => {
  const [recs, setRecs] = useState([]);
    const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
    const [onboardingOpen, setOnboardingOpen] = useState(false);
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [selectedGoals, setSelectedGoals] = useState([]);
    const [selectedProblems, setSelectedProblems] = useState([]);
    const [savingPrefs, setSavingPrefs] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        {
            role: 'assistant',
            text: 'Ask me anything: library issue, dance club, event to perform, restaurant/canteen, timetable help, and more.',
            timestamp: new Date().toISOString(),
        }
    ]);
    const [dashboard, setDashboard] = useState(null);

    const token = localStorage.getItem('token');
    const authHeaders = { Authorization: `Bearer ${token}` };

    const fetchRecs = async () => {
        const res = await axios.get('/recommendations', {
            headers: authHeaders,
        });
        setRecs(res.data);
    };

    const fetchDashboard = async () => {
        const res = await axios.get('/recommendations/dashboard', {
            headers: authHeaders,
        });
        setDashboard(res.data);
    };

    const fetchChatHistory = async () => {
        const res = await axios.get('/recommendations/chat/history', {
            headers: authHeaders,
        });
        const historyMessages = [];
        (res.data || []).forEach((entry) => {
            historyMessages.push({ role: 'user', text: entry.user_message, timestamp: entry.created_at });
            const lines = (entry.results || []).map((item) => {
                const contactText = item.contact ? ` | Contact: ${item.contact}` : '';
                return `- ${item.type}: ${item.title} - ${item.description}${contactText}`;
            });
            historyMessages.push({ role: 'assistant', text: [entry.bot_answer, ...lines].join('\n'), timestamp: entry.created_at });
        });

        if (historyMessages.length > 0) {
            setChatMessages(historyMessages);
        }
    };

  useEffect(() => {
        const boot = async () => {
            try {
                const [userRes] = await Promise.all([
                    axios.get('/user/me', { headers: authHeaders }),
                    fetchRecs(),
                    fetchChatHistory(),
                    fetchDashboard(),
                ]);
                const user = userRes.data;
                setUserData(user);

                const hasPrefs = (user.interests || []).length > 0 || (user.selected_problems || []).length > 0;
                const onboardingKey = `prefs_onboarded_${user.email}`;
                const alreadyOnboarded = localStorage.getItem(onboardingKey) === 'true';

                if (!hasPrefs && !alreadyOnboarded) {
                    setOnboardingOpen(true);
                }

                setSelectedInterests(user.interests || []);
                setSelectedGoals(user.goals || []);
                setSelectedProblems(user.selected_problems || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        boot();
  }, []);

    const toggleSelect = (value, selected, setter) => {
        if (selected.includes(value)) {
            setter(selected.filter((x) => x !== value));
            return;
        }
        setter([...selected, value]);
    };

    const savePreferences = async () => {
        if (!userData) {
            return;
        }
        const totalPicks = selectedInterests.length + selectedGoals.length + selectedProblems.length;
        if (totalPicks < 5 || totalPicks > 7) {
            alert('Please pick total 5 to 7 items across interests, goals and pain points.');
            return;
        }
        setSavingPrefs(true);
        try {
            await axios.put('/user/me', {
                interests: selectedInterests,
                goals: selectedGoals,
                selected_problems: selectedProblems,
            }, { headers: authHeaders });

            localStorage.setItem(`prefs_onboarded_${userData.email}`, 'true');
            setOnboardingOpen(false);
            await fetchRecs();
            await fetchDashboard();
        } catch (err) {
            console.error(err);
            alert('Unable to save preferences. Please try again.');
        } finally {
            setSavingPrefs(false);
        }
    };

    const sendFeedback = async (resourceId, action) => {
        try {
            await axios.post('/recommendations/feedback', {
                resource_id: resourceId,
                action,
            }, { headers: authHeaders });
            await fetchRecs();
            await fetchDashboard();
        } catch (err) {
            console.error(err);
            alert('Unable to save feedback right now.');
        }
    };

    const trackInteraction = async (resourceId, eventType = 'click') => {
        try {
            await axios.post('/recommendations/track-click', {
                resource_id: resourceId,
                event_type: eventType,
            }, { headers: authHeaders });
        } catch (err) {
            console.error(err);
        }
    };

    const clearHistory = async () => {
        try {
            await axios.delete('/recommendations/chat/history', {
                headers: authHeaders,
            });
            setChatMessages([
                {
                    role: 'assistant',
                    text: 'Chat history cleared. Ask your next query for fresh suggestions.',
                    timestamp: new Date().toISOString(),
                }
            ]);
        } catch (err) {
            console.error(err);
            alert('Unable to clear chat history right now.');
        }
    };

    const sendChatQuery = async () => {
        const message = chatInput.trim();
        if (!message) {
            return;
        }

        setChatMessages((prev) => [...prev, { role: 'user', text: message, timestamp: new Date().toISOString() }]);
        setChatInput('');
        setChatLoading(true);

        try {
            const res = await axios.post('/recommendations/chat', {
                message,
            }, { headers: authHeaders });

            const lines = (res.data.results || []).map((item) => {
                const contactText = item.contact ? ` | Contact: ${item.contact}` : '';
                return `- ${item.type}: ${item.title} - ${item.description}${contactText}`;
            });

            const responseText = [res.data.answer, ...lines].join('\n');
            setChatMessages((prev) => [...prev, { role: 'assistant', text: responseText, timestamp: new Date().toISOString() }]);
            await fetchChatHistory();
        } catch (err) {
            console.error(err);
            setChatMessages((prev) => [...prev, { role: 'assistant', text: 'Sorry, I could not fetch suggestions right now. Please try again.', timestamp: new Date().toISOString() }]);
        } finally {
            setChatLoading(false);
        }
    };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
            {onboardingOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-3xl bg-white rounded-3xl p-8 space-y-6 shadow-2xl">
                        <div>
                            <h2 className="text-2xl font-bold text-primary">Set Your AI Preferences</h2>
                            <p className="text-sm text-muted mt-1">Choose interests and challenges so recommendations become personalized from first login.</p>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Interests</p>
                            <div className="flex flex-wrap gap-2">
                                {INTEREST_OPTIONS.map((item) => (
                                    <button
                                        type="button"
                                        key={item}
                                        onClick={() => toggleSelect(item, selectedInterests, setSelectedInterests)}
                                        className={`px-3 py-2 rounded-full text-sm border ${selectedInterests.includes(item) ? 'bg-primary text-white border-primary' : 'bg-white text-muted border-gray-200'}`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Goals</p>
                            <div className="flex flex-wrap gap-2">
                                {GOAL_OPTIONS.map((item) => (
                                    <button
                                        type="button"
                                        key={item}
                                        onClick={() => toggleSelect(item, selectedGoals, setSelectedGoals)}
                                        className={`px-3 py-2 rounded-full text-sm border ${selectedGoals.includes(item) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-muted border-gray-200'}`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Current Challenges</p>
                            <div className="flex flex-wrap gap-2">
                                {PROBLEM_OPTIONS.map((item) => (
                                    <button
                                        type="button"
                                        key={item}
                                        onClick={() => toggleSelect(item, selectedProblems, setSelectedProblems)}
                                        className={`px-3 py-2 rounded-full text-sm border ${selectedProblems.includes(item) ? 'bg-secondary text-white border-secondary' : 'bg-white text-muted border-gray-200'}`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <div className="mr-auto text-xs font-bold text-muted">
                                Pick count: {selectedInterests.length + selectedGoals.length + selectedProblems.length} / 5-7
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (userData?.email) {
                                        localStorage.setItem(`prefs_onboarded_${userData.email}`, 'true');
                                    }
                                    setOnboardingOpen(false);
                                }}
                                className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-bold"
                            >
                                Skip for now
                            </button>
                            <button
                                type="button"
                                onClick={savePreferences}
                                disabled={savingPrefs}
                                className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-bold"
                            >
                                {savingPrefs ? 'Saving...' : 'Save Preferences'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

      <button onClick={() => window.history.back()}
        className="flex items-center text-sm font-medium text-primary hover:text-secondary transition-colors">
        ← Back
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">AI Smart Matches</h1>
        </div>
                <button
                    type="button"
                    onClick={() => {
                        setSelectedInterests(userData?.interests || []);
                        setSelectedGoals(userData?.goals || []);
                        setSelectedProblems(userData?.selected_problems || []);
                        setOnboardingOpen(true);
                    }}
                    className="px-6 py-2 bg-white border-2 border-secondary text-secondary rounded-full font-bold text-sm tracking-wide hover:bg-blue-50 transition-colors"
                >
                    UPDATE PREFERENCES
        </button>
      </div>

            {dashboard && (
                <section className="glass-card p-6 rounded-3xl border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <TrendingUp size={18} className="text-secondary" /> Personal Recommendation Dashboard
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 rounded-2xl bg-gray-50 text-sm">Likes: <span className="font-bold">{dashboard.weekly.likes}</span></div>
                        <div className="p-3 rounded-2xl bg-gray-50 text-sm">Saved: <span className="font-bold">{dashboard.weekly.saved}</span></div>
                        <div className="p-3 rounded-2xl bg-gray-50 text-sm">Not Relevant: <span className="font-bold">{dashboard.weekly.not_relevant}</span></div>
                        <div className="p-3 rounded-2xl bg-gray-50 text-sm">Clicks: <span className="font-bold">{dashboard.weekly.clicks}</span></div>
                    </div>
                    <div className="text-sm text-muted">Progress score this week: <span className="font-bold text-gray-800">{dashboard.progress_score}%</span></div>
                    {dashboard.weekly_suggestions?.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Weekly Suggestions</p>
                            <div className="flex flex-wrap gap-2">
                                {dashboard.weekly_suggestions.map((item) => (
                                    <span key={item} className="text-xs px-3 py-1 rounded-full bg-orange-50 text-secondary">{item}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {dashboard.insights?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {dashboard.insights.map((ins) => (
                                <span key={ins} className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700">{ins}</span>
                            ))}
                        </div>
                    )}
                    {dashboard.nudges?.length > 0 && (
                        <div className="space-y-1">
                            {dashboard.nudges.map((nudge) => (
                                <p key={nudge} className="text-xs text-muted">• {nudge}</p>
                            ))}
                        </div>
                    )}
                </section>
            )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            [1,2,3].map(i => (
                <div key={i} className="h-64 bg-gray-100 rounded-3xl animate-pulse"></div>
            ))
        ) : (
            recs.map(rec => (
                <div key={rec.id} className="glass-card group p-8 rounded-[2.5rem] flex flex-col hover:border-secondary transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Bookmark className="text-secondary" size={20} />
                    </div>
                    
                    <span className="text-[10px] font-bold px-3 py-1 bg-primary/5 text-primary rounded-full w-fit uppercase tracking-widest mb-4">
                        {rec.type}
                    </span>
                    
                    <h3 className="text-xl font-bold mb-3">{rec.name}</h3>
                    <p className="text-sm text-muted mb-6 line-clamp-2">{rec.description}</p>

                    {Array.isArray(rec.reason_chips) && rec.reason_chips.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                            {rec.reason_chips.map((chip) => (
                                <span key={chip} className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-bold uppercase tracking-wider">{chip}</span>
                            ))}
                        </div>
                    )}
                    
                    <div className="mt-auto p-4 bg-orange-50 rounded-2xl border border-orange-100">
                        <p className="text-xs font-medium text-orange-900 leading-relaxed">
                            <Sparkles size={12} className="inline mr-1 mb-0.5" />
                            {rec.explanation}
                        </p>
                    </div>
                    
                    <button
                        type="button"
                        onClick={() => trackInteraction(rec.id, 'click')}
                        className="mt-6 w-full py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-colors"
                    >
                        Explore Now
                    </button>

                                        <div className="mt-3 grid grid-cols-3 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => sendFeedback(rec.id, 'like')}
                                                className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 ${rec.user_feedback === 'like' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-muted border-gray-200'}`}
                                            >
                                                <ThumbsUp size={12} /> Like
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => sendFeedback(rec.id, 'not_relevant')}
                                                className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 ${rec.user_feedback === 'not_relevant' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-muted border-gray-200'}`}
                                            >
                                                <ThumbsDown size={12} /> Not Relevant
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => sendFeedback(rec.id, 'save')}
                                                className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 ${rec.user_feedback === 'save' ? 'bg-orange-50 text-secondary border-orange-200' : 'bg-white text-muted border-gray-200'}`}
                                            >
                                                <Heart size={12} /> Save
                                            </button>
                                        </div>
                </div>
            ))
        )}
      </div>

      <div className="p-10 bhu-gradient rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between">
          <div className="md:max-w-md mb-8 md:mb-0">
              <h2 className="text-3xl font-bold mb-4 italic">The algorithm learns from you.</h2>
              <p className="text-white/70">By selecting the problems you face (e.g. library access, hostel allotment), our AI dynamically suggests the exact office or service you need.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              {["Library Issue", "Hostel Wi-Fi", "Class Location", "Syllabus Help"].map(p => (
                  <button key={p} className="px-6 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-medium border border-white/10 text-center transition-all">
                      {p}
                  </button>
              ))}
          </div>
      </div>

            <section className="bg-white p-8 rounded-2xl border-2 border-secondary space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-primary">
                        AI Recommendation Chatbot
                    </h2>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted">Issue-based suggestions with contacts</span>
                        <button
                            type="button"
                            onClick={clearHistory}
                            className="text-xs px-3 py-1 rounded-full border border-gray-200 text-muted hover:bg-gray-50 flex items-center gap-1"
                        >
                            <Trash2 size={12} /> Clear History
                        </button>
                    </div>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-3 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`p-3 rounded-2xl text-sm whitespace-pre-line ${msg.role === 'user' ? 'bg-primary text-white ml-10' : 'bg-white border border-gray-100 mr-10 text-gray-700'}`}>
                            <div>{msg.text}</div>
                            {msg.timestamp && (
                                <div className={`mt-2 text-[10px] ${msg.role === 'user' ? 'text-white/70' : 'text-gray-400'} flex items-center gap-1`}>
                                    <Clock3 size={10} /> {new Date(msg.timestamp).toLocaleString()}
                                </div>
                            )}
                        </div>
                    ))}
                    {chatLoading && <p className="text-xs text-muted">Thinking...</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                    <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                sendChatQuery();
                            }
                        }}
                        placeholder="Ask: I have library issue, suggest contact..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                        type="button"
                        onClick={sendChatQuery}
                        disabled={chatLoading}
                        className="px-5 py-3 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center"
                    >
                        <Send size={14} className="mr-2" /> Send
                    </button>
                </div>
            </section>
    </div>
  );
};

export default Recommendations;
