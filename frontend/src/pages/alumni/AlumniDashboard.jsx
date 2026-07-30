import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Briefcase, Heart, Calendar, TrendingUp, Target, Award, CheckCircle, XCircle, Clock, Loader2, Inbox } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../../services/api';
// ADDED FOR VERIFICATION FEATURE
import VerificationBadge from '../../components/VerificationBadge';
import VerificationModal from '../../components/VerificationModal';

const engagementData = [
    { name: 'Mentoring', value: 35, color: '#3b82f6' },
    { name: 'Events', value: 25, color: '#14b8a6' },
    { name: 'Job Posts', value: 20, color: '#f59e0b' },
    { name: 'Donations', value: 20, color: '#ef4444' },
];

const impactData = [
    { month: 'Jan', students: 3 }, { month: 'Feb', students: 5 },
    { month: 'Mar', students: 4 }, { month: 'Apr', students: 7 },
    { month: 'May', students: 6 }, { month: 'Jun', students: 8 },
];

export default function AlumniDashboard() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [toast, setToast] = useState(null);

    const [verificationState, setVerificationState] = useState(user?.alumniProfile || null);

    useEffect(() => {
        fetchIncomingRequests();
        if (user?.alumniProfile?.id) {
            setVerificationState(user.alumniProfile);
            // Poll for verification updates if pending
            if (!user.alumniProfile.aiVerificationStatus || user.alumniProfile.aiVerificationStatus === 'PENDING') {
                const interval = setInterval(async () => {
                    try {
                        const res = await api.get(`/api/ai-verification/status/${user.alumniProfile.id}`);
                        setVerificationState(prev => ({ ...prev, ...res.data }));
                        if (res.data.aiVerificationStatus && res.data.aiVerificationStatus !== 'PENDING') {
                            clearInterval(interval);
                        }
                    } catch (e) {
                        // ignore background polling errors
                    }
                }, 3000);
                return () => clearInterval(interval);
            }
        }
    }, [user]);

    const fetchIncomingRequests = async () => {
        try {
            setLoadingRequests(true);
            const res = await api.get('/api/alumni-directory/incoming-requests');
            setRequests(res.data);
        } catch (err) {
            console.error('Failed to fetch incoming requests:', err);
        } finally {
            setLoadingRequests(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleAction = async (requestId, status) => {
        try {
            setProcessing(requestId);
            await api.patch(`/api/alumni-directory/requests/${requestId}`, { status });
            setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status } : r));
            showToast(`Request ${status.toLowerCase()} successfully`);
        } catch (err) {
            const detail = err.response?.data?.detail || 'Failed to update request';
            showToast(detail, 'error');
        } finally {
            setProcessing(null);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const pendingCount = requests.filter(r => r.status === 'PENDING').length;
    const acceptedCount = requests.filter(r => r.status === 'ACCEPTED').length;

    const stats = [
        { label: 'Pending Requests', value: pendingCount.toString(), icon: Heart, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Accepted Mentees', value: acceptedCount.toString(), icon: Users, color: 'text-primary-400', bg: 'bg-primary-500/10' },
        { label: 'Engagement Score', value: '87', icon: Target, color: 'text-green-400', bg: 'bg-green-500/10' },
        { label: 'Events Attended', value: '12', icon: Calendar, color: 'text-accent-400', bg: 'bg-accent-500/10' },
    ];

    const [isModalOpen, setIsModalOpen] = useState(false);

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

            {/* Welcome */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-accent-600 to-primary-600 p-6 md:p-8">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Award className="w-5 h-5 text-amber-300" />
                        <span className="text-sm font-medium text-white/80">Alumni Dashboard</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white mb-2">
                        Welcome, {user?.name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Alumni'} 👋
                    </h1>
                    <p className="text-white/70 max-w-lg">
                        You have <span className="text-white font-semibold">{pendingCount} pending mentorship requests</span> and{' '}
                        <span className="text-white font-semibold">{acceptedCount} active mentees</span>.
                    </p>
                    {/* ADDED FOR VERIFICATION FEATURE */}
                    {verificationState && (
                        <div className="mt-3">
                            <VerificationBadge
                                status={verificationState.aiVerificationStatus}
                                riskScore={verificationState.riskScore}
                                onClick={() => setIsModalOpen(true)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Verification Modal */}
            <VerificationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={verificationState || {}}
                onVerificationSuccess={(data) => {
                    setVerificationState(prev => ({ ...prev, ...data }));
                }}
            />

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="stat-card">
                        <div className="flex items-center justify-between">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <TrendingUp className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="mt-3">
                            <p className="text-2xl font-black text-white">{stat.value}</p>
                            <p className="text-xs text-surface-400 mt-1">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Engagement Breakdown */}
                <div className="card">
                    <h3 className="text-lg font-bold text-white mb-4">Engagement Breakdown</h3>
                    <div className="flex items-center gap-6">
                        <ResponsiveContainer width="50%" height={200}>
                            <PieChart>
                                <Pie data={engagementData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                                    {engagementData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-3">
                            {engagementData.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-sm text-surface-300">{item.name}</span>
                                    <span className="text-sm font-bold text-white ml-auto">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Impact Chart */}
                <div className="card">
                    <h3 className="text-lg font-bold text-white mb-4">Mentorship Impact</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={impactData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }} />
                            <Bar dataKey="students" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Students Helped" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Live Mentorship Requests */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Heart className="w-5 h-5 text-primary-400" /> Recent Mentorship Requests
                    </h3>
                    <span className="badge badge-primary">{requests.length} Total</span>
                </div>

                {loadingRequests ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-8 text-surface-400 text-sm">
                        <Inbox className="w-10 h-10 mx-auto text-surface-600 mb-2" />
                        No mentorship requests received yet. Students will discover your profile in the directory.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.slice(0, 5).map((req) => (
                            <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-surface-800/30 border border-surface-700/30 gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-sm shrink-0">
                                        {req.studentName?.[0] || '?'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-white text-sm">{req.studentName}</p>
                                            <span className="text-xs text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full font-medium">
                                                {req.supportType.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-surface-400 mt-1">{req.message}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                                    <span className="text-xs text-surface-500">{formatDate(req.createdAt)}</span>
                                    {req.status === 'PENDING' ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAction(req.id, 'ACCEPTED')}
                                                disabled={processing === req.id}
                                                className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
                                            >
                                                {processing === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Accept'}
                                            </button>
                                            <button
                                                onClick={() => handleAction(req.id, 'DECLINED')}
                                                disabled={processing === req.id}
                                                className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-50"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    ) : (
                                        <span className={`badge ${req.status === 'ACCEPTED' ? 'badge-success' : 'badge-error'}`}>
                                            {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
