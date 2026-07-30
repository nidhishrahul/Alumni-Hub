/**
 * ADDED FOR VERIFICATION FEATURE
 *
 * Admin AI Verification Queue — lists medium-risk alumni for review
 * with approve/reject actions.
 */
import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldX, AlertTriangle, Loader2, Search, Filter, ExternalLink, ChevronDown } from 'lucide-react';
import api from '../../services/api';
import VerificationBadge from '../../components/VerificationBadge';

export default function AIVerificationQueue() {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [toast, setToast] = useState(null);
    const [filter, setFilter] = useState('PENDING');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [rejectNotes, setRejectNotes] = useState('');

    useEffect(() => {
        fetchQueue();
    }, [filter]);

    const fetchQueue = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/api/ai-verification/admin/queue?status=${filter}`);
            setQueue(res.data);
        } catch (err) {
            console.error('Failed to fetch queue:', err);
            showToast('Failed to load verification queue', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleApprove = async (queueId) => {
        try {
            setProcessing(queueId);
            await api.post(`/api/ai-verification/admin/${queueId}/approve`);
            showToast('Alumni approved successfully');
            fetchQueue();
        } catch (err) {
            showToast(err.response?.data?.detail || 'Failed to approve', 'error');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (queueId) => {
        if (!rejectNotes.trim()) {
            showToast('Please provide rejection notes', 'error');
            return;
        }
        try {
            setProcessing(queueId);
            await api.post(`/api/ai-verification/admin/${queueId}/reject`, { notes: rejectNotes });
            showToast('Alumni rejected');
            setRejectNotes('');
            setExpandedId(null);
            fetchQueue();
        } catch (err) {
            showToast(err.response?.data?.detail || 'Failed to reject', 'error');
        } finally {
            setProcessing(null);
        }
    };

    const getRiskColor = (score) => {
        if (score <= 30) return 'text-emerald-400';
        if (score <= 65) return 'text-amber-400';
        return 'text-red-400';
    };

    const getRiskBg = (score) => {
        if (score <= 30) return 'bg-emerald-500/10';
        if (score <= 65) return 'bg-amber-500/10';
        return 'bg-red-500/10';
    };

    const filteredQueue = queue.filter(item =>
        item.alumni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.alumni.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.alumni.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-xl animate-fade-in flex items-center gap-2 ${toast.type === 'success'
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                    <span className="text-sm font-medium">{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 md:p-8">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-5 h-5 text-violet-200" />
                        <span className="text-sm font-medium text-white/80">AI Verification System</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white mb-2">
                        AI Verification Queue
                    </h1>
                    <p className="text-white/70 max-w-lg">
                        Review alumni profiles flagged by the AI verification system.
                        Medium-risk profiles require manual approval.
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                    <input
                        type="text"
                        placeholder="Search by name, department, or email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-800/50 border border-surface-700/50
                            text-white placeholder-surface-500 text-sm focus:outline-none focus:border-primary-500/50
                            focus:ring-2 focus:ring-primary-500/20 transition-all"
                    />
                </div>

                {/* Filter */}
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                    <select
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="pl-10 pr-8 py-2.5 rounded-xl bg-surface-800/50 border border-surface-700/50
                            text-white text-sm appearance-none cursor-pointer focus:outline-none
                            focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    >
                        <option value="PENDING">Pending Review</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <p className="text-xl font-black text-white">{filteredQueue.length}</p>
                        <p className="text-xs text-surface-400">{filter === 'PENDING' ? 'Awaiting Review' : filter.charAt(0) + filter.slice(1).toLowerCase()}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xl font-black text-white">
                            {filteredQueue.filter(i => i.riskScore <= 50).length}
                        </p>
                        <p className="text-xs text-surface-400">Lower Risk</p>
                    </div>
                </div>
                <div className="card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <ShieldX className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <p className="text-xl font-black text-white">
                            {filteredQueue.filter(i => i.riskScore > 50).length}
                        </p>
                        <p className="text-xs text-surface-400">Higher Risk</p>
                    </div>
                </div>
            </div>

            {/* Queue List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
                    </div>
                ) : filteredQueue.length === 0 ? (
                    <div className="card text-center py-12">
                        <ShieldCheck className="w-12 h-12 text-surface-600 mx-auto mb-3" />
                        <p className="text-surface-400 text-sm">No items in the {filter.toLowerCase()} queue.</p>
                    </div>
                ) : (
                    filteredQueue.map(item => (
                        <div key={item.queueId}
                            className="card overflow-hidden transition-all duration-300 hover:border-surface-600/50"
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                {/* Alumni Info */}
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                                        {item.alumni.name?.[0] || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-white font-bold text-sm">{item.alumni.name}</h3>
                                            <VerificationBadge status="PENDING_ADMIN_REVIEW" compact />
                                        </div>
                                        <p className="text-xs text-surface-400 mt-0.5">{item.alumni.email}</p>
                                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                                            <span className="text-xs text-surface-300 bg-surface-800/50 px-2 py-0.5 rounded-full">
                                                {item.alumni.department}
                                            </span>
                                            <span className="text-xs text-surface-300 bg-surface-800/50 px-2 py-0.5 rounded-full">
                                                {item.alumni.degree} — {item.alumni.graduationYear}
                                            </span>
                                            {item.alumni.registerNumber && (
                                                <span className="text-xs text-surface-300 bg-surface-800/50 px-2 py-0.5 rounded-full">
                                                    Reg: {item.alumni.registerNumber}
                                                </span>
                                            )}
                                            {item.alumni.linkedinUrl && (
                                                <a
                                                    href={item.alumni.linkedinUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                                >
                                                    <ExternalLink className="w-3 h-3" /> LinkedIn
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Risk Score Gauge */}
                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="text-center">
                                        <div className={`text-2xl font-black ${getRiskColor(item.riskScore)}`}>
                                            {item.riskScore.toFixed(1)}
                                        </div>
                                        <div className="text-[10px] text-surface-500 uppercase tracking-wider font-medium">Risk Score</div>
                                        <div className="w-24 h-2 bg-surface-800 rounded-full mt-1 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${getRiskBg(item.riskScore).replace('/10', '')}`}
                                                style={{ width: `${item.riskScore}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {item.reviewStatus === 'PENDING' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(item.queueId)}
                                                disabled={processing === item.queueId}
                                                className="btn-primary text-xs py-2 px-4 disabled:opacity-50 flex items-center gap-1.5"
                                            >
                                                {processing === item.queueId
                                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                                    : <ShieldCheck className="w-3.5 h-3.5" />
                                                }
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => setExpandedId(expandedId === item.queueId ? null : item.queueId)}
                                                className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5 text-red-400 hover:text-red-300"
                                            >
                                                <ShieldX className="w-3.5 h-3.5" />
                                                Reject
                                            </button>
                                        </div>
                                    )}

                                    {item.reviewStatus !== 'PENDING' && (
                                        <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${item.reviewStatus === 'APPROVED'
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                            }`}>
                                            {item.reviewStatus}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Feature breakdown (expandable) */}
                            {item.features && (
                                <div className="mt-3 pt-3 border-t border-surface-800/50">
                                    <p className="text-xs text-surface-500 mb-2 font-medium">AI Feature Breakdown:</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {Object.entries(item.features).map(([key, val]) => (
                                            <div key={key} className="bg-surface-800/30 rounded-lg px-2.5 py-1.5">
                                                <p className="text-[10px] text-surface-500 capitalize">
                                                    {key.replace(/_/g, ' ')}
                                                </p>
                                                <p className={`text-sm font-bold ${val >= 0.8 ? 'text-emerald-400' : val >= 0.5 ? 'text-amber-400' : 'text-red-400'
                                                    }`}>
                                                    {typeof val === 'number' ? (val * 100).toFixed(0) + '%' : String(val)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Rejection notes input */}
                            {expandedId === item.queueId && (
                                <div className="mt-3 pt-3 border-t border-surface-800/50 animate-fade-in">
                                    <textarea
                                        value={rejectNotes}
                                        onChange={e => setRejectNotes(e.target.value)}
                                        placeholder="Provide rejection reason (required)..."
                                        rows={2}
                                        className="w-full px-3 py-2 rounded-xl bg-surface-800/50 border border-red-500/30
                                            text-white text-sm placeholder-surface-500 focus:outline-none
                                            focus:ring-2 focus:ring-red-500/20 resize-none"
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button
                                            onClick={() => { setExpandedId(null); setRejectNotes(''); }}
                                            className="btn-secondary text-xs py-1.5 px-3"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleReject(item.queueId)}
                                            disabled={processing === item.queueId || !rejectNotes.trim()}
                                            className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20
                                                text-xs py-1.5 px-4 rounded-xl font-medium disabled:opacity-50 transition-all"
                                        >
                                            {processing === item.queueId ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm Rejection'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Review notes (for already reviewed) */}
                            {item.reviewNotes && item.reviewStatus !== 'PENDING' && (
                                <div className="mt-3 pt-3 border-t border-surface-800/50">
                                    <p className="text-xs text-surface-500">Review Notes:</p>
                                    <p className="text-sm text-surface-300 mt-1">{item.reviewNotes}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
