import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, Users, GraduationCap, Briefcase, Calendar,
    BarChart3, Network, UserCircle, LogOut, Bot,
    Building2, Heart, ChevronLeft, ChevronRight, PartyPopper,
    ShieldCheck // ADDED FOR VERIFICATION FEATURE
} from 'lucide-react';
import { useState } from 'react';

const navItems = {
    student: [
        { path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/student/mentors', label: 'Find Mentors', icon: GraduationCap },
        { path: '/student/jobs', label: 'Job Portal', icon: Briefcase },
        { path: '/events', label: 'Events', icon: Calendar },
        { path: '/chat', label: 'AI Assistant', icon: Bot },
        { path: '/network', label: 'Network', icon: Network },
        { path: '/profile', label: 'Profile', icon: UserCircle },
    ],
    alumni: [
        { path: '/alumni/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/alumni/mentorships', label: 'Mentorships', icon: Heart },
        { path: '/reunions', label: 'Batch Reunions', icon: PartyPopper },
        { path: '/alumni/post-job', label: 'Post Opportunity', icon: Briefcase },
        { path: '/events', label: 'Events', icon: Calendar },
        { path: '/chat', label: 'AI Assistant', icon: Bot },
        { path: '/network', label: 'Network', icon: Network },
        { path: '/profile', label: 'Profile', icon: UserCircle },
    ],
    admin: [
        { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/users', label: 'User Management', icon: Users },
        { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
        // ADDED FOR VERIFICATION FEATURE
        { path: '/admin/ai-verification', label: 'AI Verification', icon: ShieldCheck },
        { path: '/events', label: 'Events', icon: Calendar },
        { path: '/chat', label: 'AI Assistant', icon: Bot },
        { path: '/network', label: 'Network', icon: Network },
    ],
};

export default function Sidebar() {
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const roleKey = user?.role?.toLowerCase() || 'student';
    const items = navItems[roleKey] || navItems.student;

    return (
        <aside
            className={`fixed top-0 left-0 h-screen z-40 flex flex-col transition-all duration-300
        ${collapsed ? 'w-20' : 'w-64'} bg-surface-950/80 backdrop-blur-xl border-r border-surface-800/50`}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 h-16 border-b border-surface-800/50">
                <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-white" />
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <h1 className="text-sm font-bold text-white leading-tight">AlumniConnect</h1>
                        <p className="text-[10px] text-primary-400 font-medium">AI Platform</p>
                    </div>
                )}
            </div>

            {/* Collapse toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface-800 
          border border-surface-700 flex items-center justify-center text-surface-400 
          hover:text-white hover:bg-primary-600 transition-all z-50"
            >
                {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {items.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
                        }
                        title={collapsed ? item.label : undefined}
                    >
                        <item.icon className="w-5 h-5 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* User + Logout */}
            <div className="border-t border-surface-800/50 p-3">
                {!collapsed && (
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                            {(user?.name || user?.full_name)?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user?.name || user?.full_name || 'User'}</p>
                            <p className="text-[10px] text-surface-500 capitalize">{roleKey}</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={logout}
                    className={`sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${collapsed ? 'justify-center px-0' : ''}`}
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
}
