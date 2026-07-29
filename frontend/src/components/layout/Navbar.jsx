import { useAuth } from '../../context/AuthContext';
import { Bell, Search, LogOut, UserCircle, Settings, ChevronDown, ShieldCheck, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const roleBadgeColors = {
    ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
    ALUMNI: 'bg-accent-500/20 text-accent-400 border-accent-500/30',
    STUDENT: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
    FACULTY: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

export default function Navbar() {
    const { user, logout } = useAuth();
    const [searchOpen, setSearchOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // Close menu on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const role = user?.role || 'STUDENT';
    const isVerified = user?.alumniProfile?.isVerified;
    const name = user?.name || user?.full_name || 'User';

    return (
        <header className="sticky top-0 z-30 h-16 glass border-b border-surface-800/50 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
                <div>
                    <p className="text-sm text-surface-400">{greeting()},</p>
                    <h2 className="text-lg font-bold text-white leading-tight">{name}</h2>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Search */}
                <div className={`relative transition-all duration-300 ${searchOpen ? 'w-64' : 'w-10'}`}>
                    {searchOpen && (
                        <input
                            type="text"
                            placeholder="Search alumni, events..."
                            className="input-field text-sm py-2 pr-10"
                            autoFocus
                            onBlur={() => setSearchOpen(false)}
                        />
                    )}
                    <button
                        onClick={() => setSearchOpen(!searchOpen)}
                        className={`${searchOpen ? 'absolute right-2 top-1/2 -translate-y-1/2' : ''} 
              p-2 rounded-xl hover:bg-surface-800 text-surface-400 hover:text-white transition-all`}
                    >
                        <Search className="w-5 h-5" />
                    </button>
                </div>

                {/* Notifications */}
                <button className="relative p-2 rounded-xl hover:bg-surface-800 text-surface-400 hover:text-white transition-all">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                </button>

                {/* User Menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl hover:bg-surface-800/60 transition-all"
                    >
                        {/* Avatar */}
                        {user?.profilePhotoUrl ? (
                            <img src={user.profilePhotoUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                                {name[0]}
                            </div>
                        )}
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-semibold text-white leading-tight truncate max-w-[120px]">{name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${roleBadgeColors[role]}`}>
                                    {role}
                                </span>
                                {role === 'ALUMNI' && isVerified && (
                                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-green-400">
                                        <ShieldCheck className="w-3 h-3" /> Verified
                                    </span>
                                )}
                            </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-surface-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown */}
                    {menuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-surface-900 border border-surface-700/50 shadow-xl shadow-black/30 overflow-hidden animate-fade-in">
                            {/* User info header */}
                            <div className="px-4 py-3 border-b border-surface-800/50">
                                <p className="text-sm font-semibold text-white">{name}</p>
                                <p className="text-xs text-surface-400 truncate">{user?.email}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${roleBadgeColors[role]}`}>
                                        {role}
                                    </span>
                                    {role === 'ALUMNI' && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${isVerified
                                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                            }`}>
                                            {isVerified ? '✓ Verified' : '⏳ Pending Verification'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Menu items */}
                            <div className="py-1">
                                <Link
                                    to="/profile"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-300 hover:text-white hover:bg-surface-800/60 transition-all"
                                >
                                    <UserCircle className="w-4 h-4" /> My Profile
                                </Link>
                                <button
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-300 hover:text-white hover:bg-surface-800/60 transition-all w-full text-left"
                                >
                                    <Settings className="w-4 h-4" /> Settings
                                </button>
                            </div>

                            {/* Logout */}
                            <div className="border-t border-surface-800/50 py-1">
                                <button
                                    onClick={() => { logout(); setMenuOpen(false); }}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all w-full text-left"
                                >
                                    <LogOut className="w-4 h-4" /> Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
