import { useState, useEffect } from 'react';
import { Heart, CheckCircle, XCircle, Clock, Loader2, Inbox, MessageSquare, Send, Radio } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LiveChatModal from '../../components/LiveChatModal';

export default function MentorshipRequests() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [processing, setProcessing] = useState(null); // id being processed
    const [toast, setToast] = useState(null);
    const [replyingId, setReplyingId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [activeChatRequest, setActiveChatRequest] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/alumni-directory/incoming-requests');
            setRequests(res.data);
        } catch (err) {
            console.error('Failed to fetch requests:', err);
            showToast('Failed to load requests', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleAction = async (requestId, status, customReply) => {
        try {
            setProcessing(requestId);
            const messageToSend = customReply !== undefined ? customReply : replyText;
            await api.patch(`/api/alumni-directory/requests/${requestId}`, {
                status,
                replyMessage: messageToSend.trim() || undefined
            });
            // Update local state
            setRequests(prev => prev.map(r =>
                r.id === requestId ? {
                    ...r,
                    status,
                    replyMessage: messageToSend.trim() || r.replyMessage
                } : r
            ));
            showToast(`Request ${status.toLowerCase()} successfully`);
            setReplyingId(null);
            setReplyText('');
        } catch (err) {
            const detail = err.response?.data?.detail || 'Failed to update request';
            showToast(detail, 'error');
        } finally {
            setProcessing(null);
        }
    };

    const handleSendReplyOnly = async (requestId) => {
        if (!replyText.trim()) return;
        try {
            setProcessing(requestId);
            await api.post(`/api/alumni-directory/requests/${requestId}/reply`, {
                replyMessage: replyText.trim()
            });
            setRequests(prev => prev.map(r =>
                r.id === requestId ? { ...r, replyMessage: replyText.trim() } : r
            ));
            showToast('Reply message sent to student!');
            setReplyingId(null);
            setReplyText('');
        } catch (err) {
            const detail = err.response?.data?.detail || 'Failed to send reply';
            showToast(detail, 'error');
        } finally {
            setProcessing(null);
        }
    };

    const filtered = requests.filter(r => filter === 'all' || r.status === filter);

    const statusIcon = { PENDING: Clock, ACCEPTED: CheckCircle, DECLINED: XCircle, COMPLETED: CheckCircle };
    const statusColor = { PENDING: 'text-amber-400', ACCEPTED: 'text-green-400', DECLINED: 'text-red-400', COMPLETED: 'text-blue-400' };

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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
                    <p className="text-surface-400 text-sm">Loading mentorship requests...</p>
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

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <Heart className="w-7 h-7 text-primary-400" /> Mentorship Requests
                    </h1>
                    <p className="text-sm text-surface-400 mt-1">Manage incoming support requests and communicate with students</p>
                </div>
                <div className="flex gap-2">
                    {['all', 'PENDING', 'ACCEPTED', 'DECLINED'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all border
                                ${filter === f ? 'bg-primary-600/20 border-primary-500 text-primary-400' : 'bg-surface-800/30 border-surface-700 text-surface-400 hover:border-surface-500'}`}
                        >
                            {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card p-4 text-center">
                    <p className="text-2xl font-black text-amber-400">{requests.filter(r => r.status === 'PENDING').length}</p>
                    <p className="text-xs text-surface-400">Pending</p>
                </div>
                <div className="card p-4 text-center">
                    <p className="text-2xl font-black text-green-400">{requests.filter(r => r.status === 'ACCEPTED').length}</p>
                    <p className="text-xs text-surface-400">Accepted</p>
                </div>
                <div className="card p-4 text-center">
                    <p className="text-2xl font-black text-red-400">{requests.filter(r => r.status === 'DECLINED').length}</p>
                    <p className="text-xs text-surface-400">Declined</p>
                </div>
            </div>

            {/* Empty State */}
            {filtered.length === 0 && (
                <div className="card text-center py-16">
                    <Inbox className="w-16 h-16 text-surface-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">No Requests</h3>
                    <p className="text-surface-400 text-sm">
                        {requests.length === 0
                            ? 'You haven\'t received any mentorship requests yet.'
                            : 'No requests match this filter.'}
                    </p>
                </div>
            )}

            {/* Request List */}
            <div className="space-y-4">
                {filtered.map(req => {
                    const Icon = statusIcon[req.status] || Clock;
                    const color = statusColor[req.status] || 'text-surface-400';
                    const isReplyingThis = replyingId === req.id;

                    return (
                        <div key={req.id} className="card space-y-3">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-lg shrink-0">
                                        {req.studentName?.[0] || '?'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-white">{req.studentName}</h3>
                                            <span className={`flex items-center gap-1 text-xs ${color} capitalize`}>
                                                <Icon className="w-3.5 h-3.5" /> {req.status.toLowerCase()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-surface-400 mt-0.5">
                                            {req.studentEmail} · Requesting <span className="text-primary-400 font-medium">{req.supportType.replace(/_/g, ' ')}</span>
                                        </p>

                                        {/* Student Message */}
                                        <div className="mt-2 p-3 rounded-lg bg-surface-800/40 border border-surface-700/30">
                                            <p className="text-xs font-semibold text-surface-400 mb-1">Student Message:</p>
                                            <p className="text-sm text-surface-200">{req.message}</p>
                                        </div>

                                        {/* Alumni Reply (If existing) */}
                                        {req.replyMessage && (
                                            <div className="mt-2 p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
                                                <p className="text-xs font-semibold text-primary-400 mb-1 flex items-center gap-1">
                                                    <MessageSquare className="w-3.5 h-3.5" /> Your Reply to Student:
                                                </p>
                                                <p className="text-sm text-white">{req.replyMessage}</p>
                                            </div>
                                        )}

                                        <span className="text-xs text-surface-500 mt-2 inline-block">{formatDate(req.createdAt)}</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <button
                                        onClick={() => setActiveChatRequest(req)}
                                        className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-lg bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold"
                                    >
                                        <Radio className="w-3.5 h-3.5 animate-pulse text-green-300" /> Live Chat
                                    </button>

                                    {req.status === 'PENDING' && !isReplyingThis && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setReplyingId(req.id); setReplyText(''); }}
                                                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" /> Accept & Reply
                                            </button>
                                            <button
                                                onClick={() => handleAction(req.id, 'ACCEPTED', '')}
                                                disabled={processing === req.id}
                                                className="btn-secondary text-xs py-1.5 px-2.5 disabled:opacity-50"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleAction(req.id, 'DECLINED', '')}
                                                disabled={processing === req.id}
                                                className="btn-secondary text-xs py-1.5 px-2.5 text-red-400 hover:text-red-300 disabled:opacity-50"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    )}

                                    {req.status === 'ACCEPTED' && !isReplyingThis && (
                                        <button
                                            onClick={() => { setReplyingId(req.id); setReplyText(req.replyMessage || ''); }}
                                            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 border-primary-500/30 text-primary-400 hover:bg-primary-500/10"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" /> {req.replyMessage ? 'Update Reply' : 'Send Quick Reply'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Reply Input Drawer */}
                            {isReplyingThis && (
                                <div className="p-3 rounded-xl bg-surface-800/60 border border-primary-500/30 space-y-3 animate-fade-in mt-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-primary-400 flex items-center gap-1.5">
                                            <Send className="w-3.5 h-3.5" /> Write Quick Reply Message for {req.studentName}
                                        </p>
                                        <span className="text-[10px] text-surface-400">Two-way connection</span>
                                    </div>
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Write your reply (e.g. Hi! I'd be happy to guide you. Let's schedule a Zoom call or connect on LinkedIn...)"
                                        className="input-field text-xs py-2.5 w-full resize-none"
                                        rows={3}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setReplyingId(null)}
                                            className="btn-secondary text-xs py-1.5 px-3"
                                        >
                                            Cancel
                                        </button>
                                        {req.status === 'PENDING' ? (
                                            <button
                                                onClick={() => handleAction(req.id, 'ACCEPTED')}
                                                disabled={processing === req.id || !replyText.trim()}
                                                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 disabled:opacity-50"
                                            >
                                                {processing === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Accept & Send Reply'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleSendReplyOnly(req.id)}
                                                disabled={processing === req.id || !replyText.trim()}
                                                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 disabled:opacity-50"
                                            >
                                                {processing === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Send Reply'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Live Socket.IO Chat Modal */}
            {activeChatRequest && (
                <LiveChatModal
                    isOpen={Boolean(activeChatRequest)}
                    onClose={() => setActiveChatRequest(null)}
                    requestId={activeChatRequest.id}
                    otherPartyName={activeChatRequest.studentName}
                    receiverId={activeChatRequest.studentUserId}
                    currentUserId={user?.id}
                    initialMessage={activeChatRequest.message}
                />
            )}
        </div>
    );
}
