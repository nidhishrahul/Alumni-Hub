import { useState, useEffect } from 'react';
import { Megaphone, Send, Clock, Sparkles } from 'lucide-react';

export default function AnnouncementsTab({ reunion, isCoordinator }) {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        fetchAnnouncements();
    }, [reunion]);

    const fetchAnnouncements = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/reunions/${reunion.id}/announcements`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data);
                // Auto-mark unread as read
                data.filter(a => a.isNew).forEach(a => markRead(a.id));
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const markRead = async (announcementId) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/reunions/${reunion.id}/announcements/${announcementId}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) { console.error(err); }
    };

    const handlePost = async () => {
        if (!title.trim() || !body.trim()) return;
        setPosting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/reunions/${reunion.id}/announcements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title: title.trim(), body: body.trim() })
            });
            if (res.ok) {
                setTitle(''); setBody('');
                await fetchAnnouncements();
            }
        } catch (err) { console.error(err); }
        finally { setPosting(false); }
    };

    const formatTimeAgo = (dateStr) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-red-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Announcements</h2>
                    <p className="text-sm text-surface-400">Updates from the reunion organizer</p>
                </div>
            </div>

            {/* Post Form (Organizer Only) */}
            {isCoordinator && (
                <div className="card mb-8 border-red-500/10">
                    <h3 className="text-sm font-bold text-surface-300 mb-4">Post an Update</h3>
                    <div className="space-y-4">
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                            placeholder="Announcement title..." className="input-field text-sm" />
                        <textarea value={body} onChange={e => setBody(e.target.value)}
                            placeholder="Share updates about the reunion planning, travel tips, or anything your batchmates should know..."
                            rows={3} className="input-field text-sm" />
                        <button onClick={handlePost} disabled={posting || !title.trim() || !body.trim()}
                            className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                            {posting ? 'Posting...' : 'Post Announcement'}
                        </button>
                    </div>
                </div>
            )}

            {/* Announcements List */}
            {announcements.length > 0 ? (
                <div className="space-y-4">
                    {announcements.map((a) => (
                        <div key={a.id} className={`relative card transition-all ${a.isNew ? 'border-red-500/30 bg-red-500/5' : ''
                            }`}>
                            {a.isNew && (
                                <div className="absolute -top-2 right-4 flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    NEW
                                </div>
                            )}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                                        {a.author?.name?.[0] || '?'}
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-surface-300">{a.author?.name}</p>
                                        <p className="text-[10px] text-surface-500 flex items-center gap-1">
                                            <Clock className="w-2.5 h-2.5" /> {formatTimeAgo(a.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <h4 className="text-base font-bold text-white mb-2">{a.title}</h4>
                            <p className="text-sm text-surface-300 leading-relaxed whitespace-pre-wrap">{a.body}</p>
                        </div>
                    ))}
                </div>
            ) : !loading ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                        <Megaphone className="w-7 h-7 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Announcements Yet</h3>
                    <p className="text-surface-400 text-sm max-w-sm mx-auto">
                        {isCoordinator
                            ? "Post your first announcement to keep your batchmates in the loop."
                            : "The organizer hasn't posted any updates yet. Check back soon!"}
                    </p>
                </div>
            ) : null}
        </div>
    );
}
