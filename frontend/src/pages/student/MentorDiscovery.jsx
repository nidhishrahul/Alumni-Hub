import { useState, useEffect } from 'react';
import { Search, Sparkles, Brain, Users, MessageSquare, Loader2, Send, CheckCircle, MapPin, Building2, GraduationCap, BadgeCheck, Radio } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LiveChatModal from '../../components/LiveChatModal';

const SUPPORT_TYPES = [
    { value: 'MENTORING', label: 'Mentoring' },
    { value: 'REFERRALS', label: 'Referrals' },
    { value: 'MOCK_INTERVIEWS', label: 'Mock Interviews' },
    { value: 'GUEST_LECTURES', label: 'Guest Lectures' },
    { value: 'RESUME_REVIEWS', label: 'Resume Reviews' },
    { value: 'PROJECT_GUIDANCE', label: 'Project Guidance' },
];

export default function MentorDiscovery() {
    const { user } = useAuth();
    const [alumni, setAlumni] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'my-requests'
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [requestType, setRequestType] = useState('MENTORING');
    const [requestMessage, setRequestMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [toast, setToast] = useState(null);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [activeChatRequest, setActiveChatRequest] = useState(null);

    // Fetch alumni & student's sent requests from backend
    useEffect(() => {
        fetchAlumni();
        fetchMyRequests();
    }, []);

    const fetchAlumni = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/alumni-directory');
            setAlumni(res.data);
        } catch (err) {
            console.error('Failed to fetch alumni:', err);
            showToast('Failed to load alumni directory', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchMyRequests = async () => {
        try {
            const res = await api.get('/api/alumni-directory/my-requests');
            setMyRequests(res.data);
        } catch (err) {
            console.error('Failed to fetch my requests:', err);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleSendRequest = async () => {
        if (!selectedMentor || !requestMessage.trim()) {
            showToast('Please write a message for your request', 'error');
            return;
        }

        try {
            setSending(true);
            await api.post('/api/alumni-directory/request', {
                alumniProfileId: selectedMentor.profileId,
                supportType: requestType,
                message: requestMessage.trim(),
            });
            showToast(`Request sent to ${selectedMentor.name}!`, 'success');
            setRequestMessage('');
            setShowRequestForm(false);
            fetchMyRequests();
        } catch (err) {
            const detail = err.response?.data?.detail || 'Failed to send request';
            showToast(detail, 'error');
        } finally {
            setSending(false);
        }
    };

    // Filter alumni based on search and department
    const filtered = alumni.filter(a => {
        const matchesSearch = !search ||
            a.name?.toLowerCase().includes(search.toLowerCase()) ||
            a.company?.toLowerCase().includes(search.toLowerCase()) ||
            a.designation?.toLowerCase().includes(search.toLowerCase()) ||
            a.department?.toLowerCase().includes(search.toLowerCase());
        const matchesDept = selectedDept === 'all' || a.department === selectedDept;
        return matchesSearch && matchesDept;
    });

    const departments = ['all', ...new Set(alumni.map(a => a.department).filter(Boolean))];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
                    <p className="text-surface-400 text-sm">Loading alumni directory...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-xl animate-fade-in flex items-center gap-2 ${toast.type === 'success'
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                    {toast.type === 'success' && <CheckCircle className="w-4 h-4" />}
                    <span className="text-sm font-medium">{toast.message}</span>
                </div>
            )}

            {/* Header with Navigation Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <Brain className="w-7 h-7 text-primary-400" /> Alumni Directory & Mentorship
                    </h1>
                    <p className="text-sm text-surface-400 mt-1">Browse alumni mentors and view replies to your support requests</p>
                </div>
                <div className="flex items-center gap-2 bg-surface-800/40 p-1 rounded-xl border border-surface-700/50">
                    <button
                        onClick={() => setActiveTab('directory')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'directory' ? 'bg-primary-600 text-white shadow-lg' : 'text-surface-400 hover:text-white'}`}
                    >
                        Browse Directory
                    </button>
                    <button
                        onClick={() => { setActiveTab('my-requests'); fetchMyRequests(); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'my-requests' ? 'bg-primary-600 text-white shadow-lg' : 'text-surface-400 hover:text-white'}`}
                    >
                        My Sent Requests
                        {myRequests.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white">
                                {myRequests.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {activeTab === 'directory' ? (
                <>
                    {/* Controls */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                            <input
                                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search alumni, company, skills..."
                                className="input-field pl-10 py-2 text-sm w-64"
                            />
                        </div>
                        <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="input-field py-2 text-sm w-48">
                            {departments.map(d => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
                        </select>
                    </div>

                    {/* Empty State */}
                    {filtered.length === 0 && (
                        <div className="card text-center py-16">
                            <Users className="w-16 h-16 text-surface-600 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">No Alumni Found</h3>
                            <p className="text-surface-400 text-sm">
                                {alumni.length === 0
                                    ? 'No alumni have registered yet. Check back soon!'
                                    : 'Try adjusting your search or department filter.'}
                            </p>
                        </div>
                    )}

                    {/* Results */}
                    {filtered.length > 0 && (
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Mentor List */}
                            <div className="lg:col-span-2 space-y-4">
                                {filtered.map(mentor => (
                                    <div
                                        key={mentor.profileId}
                                        onClick={() => { setSelectedMentor(mentor); setShowRequestForm(false); }}
                                        className={`card cursor-pointer transition-all ${selectedMentor?.profileId === mentor.profileId ? 'border-primary-500/50 shadow-lg shadow-primary-500/10' : 'hover:border-surface-600'}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-white text-xl font-bold shrink-0">
                                                {mentor.name?.[0] || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="font-bold text-white flex items-center gap-1.5">
                                                            {mentor.name}
                                                            {mentor.isVerified && <BadgeCheck className="w-4 h-4 text-primary-400" />}
                                                            {mentor.isAway && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full ml-1">Away</span>}
                                                        </h3>
                                                        <p className="text-sm text-surface-400">
                                                            {mentor.designation || 'Alumni'} {mentor.company ? `· ${mentor.company}` : ''}
                                                        </p>
                                                        <p className="text-xs text-surface-500">
                                                            Class of {mentor.graduationYear} · {mentor.department}
                                                            {mentor.location ? ` · ${mentor.location}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                {mentor.bio && (
                                                    <p className="text-xs text-surface-400 mt-2 line-clamp-2">{mentor.bio}</p>
                                                )}
                                                {mentor.availableFor?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                                        {mentor.availableFor.map((s, i) => (
                                                            <span key={i} className="badge badge-primary text-[10px]">
                                                                {s.replace(/_/g, ' ')}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Detail Panel */}
                            <div className="hidden lg:block">
                                {selectedMentor ? (
                                    <div className="card sticky top-24 space-y-5">
                                        <div className="text-center">
                                            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">
                                                {selectedMentor.name?.[0] || '?'}
                                            </div>
                                            <h3 className="text-lg font-bold text-white flex items-center justify-center gap-1.5">
                                                {selectedMentor.name}
                                                {selectedMentor.isVerified && <BadgeCheck className="w-5 h-5 text-primary-400" />}
                                            </h3>
                                            <p className="text-sm text-surface-400">{selectedMentor.designation || 'Alumni'}</p>
                                            {selectedMentor.company && <p className="text-xs text-primary-400">{selectedMentor.company}</p>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 rounded-xl bg-surface-800/30 text-center">
                                                <div className="flex items-center justify-center gap-1 text-primary-400 mb-1">
                                                    <GraduationCap className="w-4 h-4" />
                                                </div>
                                                <p className="text-sm font-bold text-white">{selectedMentor.graduationYear}</p>
                                                <p className="text-[10px] text-surface-400">Graduation</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-surface-800/30 text-center">
                                                <div className="flex items-center justify-center gap-1 text-accent-400 mb-1">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <p className="text-sm font-bold text-white truncate">{selectedMentor.department}</p>
                                                <p className="text-[10px] text-surface-400">Department</p>
                                            </div>
                                        </div>

                                        {selectedMentor.location && (
                                            <div className="flex items-center gap-2 text-xs text-surface-400">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {selectedMentor.location}
                                            </div>
                                        )}

                                        {selectedMentor.bio && (
                                            <div className="p-3 rounded-xl bg-surface-800/30">
                                                <p className="text-xs text-surface-300">{selectedMentor.bio}</p>
                                            </div>
                                        )}

                                        {selectedMentor.availableFor?.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-surface-300 mb-2">Available For</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedMentor.availableFor.map((s, i) => (
                                                        <span key={i} className="badge badge-primary text-[10px]">{s.replace(/_/g, ' ')}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Request Form */}
                                        {!showRequestForm ? (
                                            <div className="flex gap-2">
                                                <button onClick={() => setShowRequestForm(true)} className="btn-primary flex-1 text-sm py-2">
                                                    Request Mentorship
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 p-3 rounded-xl bg-primary-500/5 border border-primary-500/10">
                                                <p className="text-xs font-semibold text-primary-400 flex items-center gap-1">
                                                    <Send className="w-3.5 h-3.5" /> Send Request
                                                </p>
                                                <select
                                                    value={requestType}
                                                    onChange={(e) => setRequestType(e.target.value)}
                                                    className="input-field text-xs py-2 w-full"
                                                >
                                                    {SUPPORT_TYPES.map(t => (
                                                        <option key={t.value} value={t.value}>{t.label}</option>
                                                    ))}
                                                </select>
                                                <textarea
                                                    value={requestMessage}
                                                    onChange={(e) => setRequestMessage(e.target.value)}
                                                    placeholder="Introduce yourself and explain how they can help..."
                                                    className="input-field text-xs py-2 w-full resize-none"
                                                    rows={4}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleSendRequest}
                                                        disabled={sending || !requestMessage.trim()}
                                                        className="btn-primary flex-1 text-xs py-2 disabled:opacity-50"
                                                    >
                                                        {sending ? (
                                                            <span className="flex items-center justify-center gap-1.5">
                                                                <Loader2 className="w-3 h-3 animate-spin" /> Sending...
                                                            </span>
                                                        ) : 'Send Request'}
                                                    </button>
                                                    <button
                                                        onClick={() => setShowRequestForm(false)}
                                                        className="btn-secondary text-xs py-2 px-3"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="card sticky top-24 text-center py-12">
                                        <Users className="w-12 h-12 text-surface-600 mx-auto mb-3" />
                                        <p className="text-surface-400 text-sm">Select an alumni to view details</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* My Sent Requests Tab */
                <div className="space-y-4">
                    {myRequests.length === 0 ? (
                        <div className="card text-center py-16">
                            <MessageSquare className="w-16 h-16 text-surface-600 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">No Sent Requests</h3>
                            <p className="text-surface-400 text-sm">You haven't requested mentorship from any alumni yet.</p>
                        </div>
                    ) : (
                        myRequests.map(req => (
                            <div key={req.id} className="card space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-white text-base">{req.alumniName}</h3>
                                        <p className="text-xs text-surface-400">
                                            {req.alumniDesignation} {req.alumniCompany ? `at ${req.alumniCompany}` : ''} · {req.alumniDepartment}
                                        </p>
                                        <span className="inline-block mt-1 badge badge-primary text-[10px]">
                                            {req.supportType.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${req.status === 'ACCEPTED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                            req.status === 'DECLINED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            }`}>
                                            {req.status}
                                        </span>
                                        <button
                                            onClick={() => setActiveChatRequest(req)}
                                            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-lg bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold"
                                        >
                                            <Radio className="w-3.5 h-3.5 animate-pulse text-green-300" /> Live Chat
                                        </button>
                                    </div>
                                </div>

                                <div className="p-3 rounded-lg bg-surface-800/40 border border-surface-700/30">
                                    <p className="text-xs font-semibold text-surface-400 mb-1">Your Sent Message:</p>
                                    <p className="text-sm text-surface-200">{req.message}</p>
                                </div>

                                {req.replyMessage ? (
                                    <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/30 space-y-1">
                                        <p className="text-xs font-bold text-primary-400 flex items-center gap-1.5">
                                            <MessageSquare className="w-4 h-4" /> Alumni Reply from {req.alumniName}:
                                        </p>
                                        <p className="text-sm text-white font-medium">{req.replyMessage}</p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-surface-500 italic">Awaiting alumni response...</p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Live Socket.IO Chat Modal */}
            {activeChatRequest && (
                <LiveChatModal
                    isOpen={Boolean(activeChatRequest)}
                    onClose={() => setActiveChatRequest(null)}
                    requestId={activeChatRequest.id}
                    otherPartyName={activeChatRequest.alumniName}
                    receiverId={activeChatRequest.alumniUserId}
                    currentUserId={user?.id}
                    initialMessage={activeChatRequest.message}
                />
            )}
        </div>
    );
}
