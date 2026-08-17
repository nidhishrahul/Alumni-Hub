import { useEffect, useRef, useState } from 'react';
import { Bell, CalendarCheck, CheckCheck, PartyPopper } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const notificationData = (value) => {
    try {
        return JSON.parse(value || '{}');
    } catch {
        return {};
    }
};

export default function NotificationMenu() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const menuRef = useRef(null);

    const loadNotifications = async () => {
        try {
            const response = await api.get('/api/notifications');
            setNotifications(response.data.notifications || []);
            setUnreadCount(response.data.unreadCount || 0);
        } catch (error) {
            console.error('Unable to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
        const timer = setInterval(loadNotifications, 30000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const closeOnOutsideClick = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', closeOnOutsideClick);
        return () => document.removeEventListener('mousedown', closeOnOutsideClick);
    }, []);

    const markRead = async (notification) => {
        if (!notification.isRead) {
            await api.post('/api/notifications/' + notification.id + '/read');
            setNotifications((items) => items.map((item) =>
                item.id === notification.id ? { ...item, isRead: true } : item
            ));
            setUnreadCount((count) => Math.max(0, count - 1));
        }
        setOpen(false);
    };

    const markAllRead = async () => {
        await api.post('/api/notifications/read-all');
        setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
        setUnreadCount(0);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="relative p-2 rounded-xl hover:bg-surface-800 text-surface-400 hover:text-white transition-all"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary-500 text-[10px] font-bold text-white flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-3 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-surface-700/60 bg-surface-900 shadow-2xl shadow-black/40 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800">
                        <div>
                            <h3 className="font-bold text-white">Notifications</h3>
                            <p className="text-xs text-surface-400">{unreadCount} unread</p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAllRead}
                                className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                            >
                                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <p className="p-6 text-center text-sm text-surface-400">Loading notifications...</p>
                        ) : notifications.length === 0 ? (
                            <p className="p-8 text-center text-sm text-surface-400">No notifications yet</p>
                        ) : notifications.map((notification) => {
                            const data = notificationData(notification.data);
                            const destination = data.reunionId ? '/reunions/' + data.reunionId : '#';
                            const Icon = notification.type === 'REUNION_FINALIZED'
                                ? CalendarCheck
                                : PartyPopper;

                            return (
                                <Link
                                    key={notification.id}
                                    to={destination}
                                    onClick={() => markRead(notification)}
                                    className={'flex gap-3 px-4 py-4 border-b border-surface-800/70 hover:bg-surface-800/60 transition-colors ' +
                                        (notification.isRead ? '' : 'bg-primary-500/5')}
                                >
                                    <span className="w-9 h-9 shrink-0 rounded-xl bg-primary-500/15 flex items-center justify-center">
                                        <Icon className="w-4 h-4 text-primary-400" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold text-white">{notification.title}</span>
                                        <span className="block text-xs text-surface-400 mt-1 leading-relaxed">{notification.message}</span>
                                        <span className="block text-[10px] text-surface-500 mt-2">
                                            {new Date(notification.createdAt).toLocaleString('en-IN')}
                                        </span>
                                    </span>
                                    {!notification.isRead && (
                                        <span className="mt-2 w-2 h-2 shrink-0 rounded-full bg-primary-400" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
