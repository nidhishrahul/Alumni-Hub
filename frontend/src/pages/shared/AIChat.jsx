import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Mic, Volume2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const sampleResponses = {
    'mentor': "Based on your profile, I found 3 AI-matched mentors:\n\n1. **Dr. Priya Sharma** (Google DeepMind) — 94% match\n   • Expertise: ML, NLP, Python\n   • Reason: Shares your ML research interests\n\n2. **Rahul Verma** (Microsoft) — 88% match\n   • Expertise: Cloud, React, TypeScript\n\n3. **Anita Patel** (Amazon) — 82% match\n   • Expertise: Data Science, TensorFlow\n\nWould you like me to send a mentorship request to any of them?",
    'job': "I found 3 relevant opportunities matching your skills:\n\n🔵 **ML Engineer Intern** at Google (91% match)\n   • Your Python + TensorFlow skills are a perfect fit\n   • Alumni referral available: Dr. Priya Sharma\n\n🟢 **Full Stack Developer** at Microsoft (85% match)\n   • React proficiency aligns well\n\n🟡 **Data Science Intern** at Amazon (82% match)\n\nShall I prepare your resume for any of these positions?",
    'reunion': "Here are active batch reunions for your network:\n\n🎉 **Silver Jubilee Grand Reunion — Class of 2020** (Planning)\n   • Date Voting Open: Aug 15 / Aug 22 / Sep 05\n   • Venue Options: Campus Main Lawn vs Grand Horizon Resort\n\n🎉 **Annual Alumni & Mentors Gala 2026** (Confirmed)\n   • Date: Aug 15, 2026\n   • Venue: Grand Horizon Ballroom, Bengaluru\n\nWould you like me to take you to the **Batch Reunions Hub** to cast your vote or RSVP?",
    'event': "Here are upcoming events I recommend for you:\n\n📅 **AI & ML Workshop** — Jul 20, 2026\n   • 92% predicted attendance match\n   • Led by alumni Dr. Priya Sharma\n\n📅 **Alumni Networking Meetup** — Aug 5, 2026\n   • Great for expanding your professional network\n\nWould you like me to register you for any event?",
    'default': "I'm your AI assistant powered by our multi-agent system. I can help you with:\n\n🎓 **Mentorship** — Find AI-matched mentors\n💼 **Jobs & Referrals** — Discover matched opportunities\n🎉 **Batch Reunions** — Date & venue voting, RSVP & photo memories\n📅 **Events** — Get personalized event recommendations\n📊 **Career Insights** — View your career progress & network graph\n\nTry asking: *\"Find me a mentor in AI\"*, *\"Show active batch reunions\"*, or *\"What internships match my profile?\"*"
};

function getResponse(message, isStudent) {
    const lower = message.toLowerCase();
    if (lower.includes('mentor') || lower.includes('guide')) return sampleResponses.mentor;
    if (lower.includes('job') || lower.includes('intern') || lower.includes('opportunity') || lower.includes('career')) {
        return isStudent
            ? 'Your **Skill-Matched Jobs** page ranks every active opportunity using the skills in your student profile. Open Job Portal to see exact match scores, matching skills, missing skills, and working Save and Apply actions.'
            : sampleResponses.job;
    }
    if (lower.includes('reunion') || lower.includes('batch') || lower.includes('meetup')) {
        return isStudent
            ? 'Batch reunions are an alumni-only feature. I can help you find skill-matched jobs, mentors, or student events instead.'
            : sampleResponses.reunion;
    }
    if (lower.includes('event') || lower.includes('workshop') || lower.includes('seminar')) return sampleResponses.event;
    return isStudent
        ? "I'm your student career assistant. I can help you find skill-matched jobs, discover alumni mentors, explore student events, and plan your next career step.\n\nTry asking: *\"What internships match my profile?\"*"
        : sampleResponses.default;
}

export default function AIChat() {
    const { user } = useAuth();
    const isStudent = user?.role === 'STUDENT';
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: isStudent
                ? "Hello! I'm your **Student Career Assistant**. I can help with skill-matched jobs, alumni mentors, events, and career preparation.\n\nHow can I help you today?"
                : "Hello! I'm **AlumniConnect AI Assistant**. I can help with mentoring, opportunities, events, and alumni reunions.\n\nHow can I help you today?",
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEnd = useRef(null);

    const scrollToBottom = () => messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(() => scrollToBottom(), [messages]);

    const handleSend = (textToSend) => {
        const msgText = typeof textToSend === 'string' ? textToSend : input;
        if (!msgText.trim()) return;
        const userMsg = msgText.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        if (typeof textToSend !== 'string') setInput('');
        setIsTyping(true);

        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'assistant', content: getResponse(userMsg, isStudent) }]);
            setIsTyping(false);
        }, 1000);
    };

    const suggestions = [
        'Find me a mentor in AI',
        'What internships match my profile?',
        ...(!isStudent ? ['Show active batch reunions'] : []),
        'Show upcoming alumni events',
    ];

    const startVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setMessages((current) => [...current, { role: 'assistant', content: 'Voice input is not supported by this browser. You can type your question below.' }]);
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.interimResults = false;
        recognition.onresult = (event) => setInput(event.results[0][0].transcript);
        recognition.start();
    };

    const readLatestResponse = () => {
        const latest = [...messages].reverse().find((message) => message.role === 'assistant');
        if (!latest || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(latest.content.replace(/\*+/g, '')));
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-surface-800/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white">AI Communication Assistant</h1>
                        <p className="text-xs text-surface-400 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> 6 agents active · Multilingual · RAG-powered
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={startVoiceInput} className="p-2 rounded-xl hover:bg-surface-800 text-surface-400 hover:text-white transition-all" title="Voice Input">
                        <Mic className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={readLatestResponse} className="p-2 rounded-xl hover:bg-surface-800 text-surface-400 hover:text-white transition-all" title="Read latest response">
                        <Volume2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                        )}
                        <div className={`max-w-2xl rounded-2xl px-5 py-3 ${msg.role === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'glass'
                            }`}>
                            <div className="text-sm leading-relaxed whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{
                                    __html: msg.content
                                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                                        .replace(/\*(.*?)\*/g, '<em class="text-surface-300">$1</em>')
                                        .replace(/•/g, '<span class="text-primary-400">•</span>')
                                        .replace(/🎓|💼|📅|📊|🔍|🔵|🟢|🟡/g, match => `<span>${match}</span>`)
                                }}
                            />
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-primary-400" />
                            </div>
                        )}
                    </div>
                ))}

                {isTyping && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="glass rounded-2xl px-5 py-3 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
                            <span className="text-sm text-surface-400">AI agents processing...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEnd} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
                <div className="flex flex-wrap gap-2 pb-4">
                    {suggestions.map((s, i) => (
                        <button key={i} onClick={() => handleSend(s)}
                            className="px-3 py-1.5 rounded-lg bg-surface-800/50 border border-surface-700/50 text-xs text-surface-300 hover:border-primary-500/50 hover:text-white transition-all"
                        >{s}</button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="flex gap-3 pt-4 border-t border-surface-800/50">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask me anything about mentors, jobs, events..."
                    className="input-field flex-1"
                />
                <button onClick={handleSend} disabled={!input.trim()} className="btn-primary px-4 disabled:opacity-50">
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
