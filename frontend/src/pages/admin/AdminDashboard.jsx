import { useAuth } from '../../context/AuthContext';
import { Users, GraduationCap, Building2, Briefcase, TrendingUp, UserPlus, Activity, Globe, BarChart3, Brain } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

const placementTrend = [
    { year: '2019', placed: 72 }, { year: '2020', placed: 65 },
    { year: '2021', placed: 78 }, { year: '2022', placed: 82 },
    { year: '2023', placed: 88 }, { year: '2024', placed: 91 },
    { year: '2025', placed: 85 }, { year: '2026 (P)', placed: 93 },
];

const industryData = [
    { name: 'IT/Software', value: 42, color: '#3b82f6' },
    { name: 'Data/AI', value: 22, color: '#14b8a6' },
    { name: 'Finance', value: 12, color: '#f59e0b' },
    { name: 'Consulting', value: 10, color: '#ef4444' },
    { name: 'Healthcare', value: 8, color: '#8b5cf6' },
    { name: 'Education', value: 6, color: '#06b6d4' },
];

const deptData = [
    { name: 'CSE', alumni: 320, active: 280 },
    { name: 'IT', alumni: 245, active: 210 },
    { name: 'ECE', alumni: 190, active: 155 },
    { name: 'EEE', alumni: 150, active: 120 },
    { name: 'MECH', alumni: 130, active: 95 },
    { name: 'CIVIL', alumni: 110, active: 75 },
];

const engagementTrend = [
    { month: 'Jan', score: 62 }, { month: 'Feb', score: 68 },
    { month: 'Mar', score: 71 }, { month: 'Apr', score: 75 },
    { month: 'May', score: 73 }, { month: 'Jun', score: 82 },
];

export default function AdminDashboard() {
    const { user } = useAuth();

    const stats = [
        { label: 'Total Alumni', value: '1,245', icon: GraduationCap, color: 'text-primary-400', bg: 'bg-primary-500/10', change: '+12%' },
        { label: 'Active Students', value: '3,820', icon: Users, color: 'text-accent-400', bg: 'bg-accent-500/10', change: '+8%' },
        { label: 'Active Mentorships', value: '156', icon: Building2, color: 'text-amber-400', bg: 'bg-amber-500/10', change: '+23%' },
        { label: 'Job Postings', value: '89', icon: Briefcase, color: 'text-green-400', bg: 'bg-green-500/10', change: '+15%' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-primary-400" /> Admin Intelligence Dashboard
                    </h1>
                    <p className="text-sm text-surface-400 mt-1">AI-powered institutional analytics and insights</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                    <Activity className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs font-medium text-green-400">All Systems Operational</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="stat-card">
                        <div className="flex items-center justify-between">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <span className="text-xs font-semibold text-green-400 flex items-center gap-0.5">
                                <TrendingUp className="w-3 h-3" /> {stat.change}
                            </span>
                        </div>
                        <div className="mt-3">
                            <p className="text-2xl font-black text-white">{stat.value}</p>
                            <p className="text-xs text-surface-400 mt-1">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Placement Trend with AI Prediction */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Placement Trends</h3>
                        <span className="badge badge-primary flex items-center gap-1"><Brain className="w-3 h-3" /> AI Predicted</span>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={placementTrend}>
                            <defs>
                                <linearGradient id="colorPlaced" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[60, 100]} unit="%" />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }} />
                            <Area type="monotone" dataKey="placed" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPlaced)" name="Placement Rate" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Industry Distribution */}
                <div className="card">
                    <h3 className="text-lg font-bold text-white mb-4">Industry Distribution</h3>
                    <div className="flex items-center gap-4">
                        <ResponsiveContainer width="50%" height={260}>
                            <PieChart>
                                <Pie data={industryData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" stroke="none">
                                    {industryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2.5 flex-1">
                            {industryData.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                    <span className="text-xs text-surface-300 flex-1">{item.name}</span>
                                    <span className="text-xs font-bold text-white">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Department Distribution */}
                <div className="card">
                    <h3 className="text-lg font-bold text-white mb-4">Department-wise Alumni</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={deptData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }} />
                            <Bar dataKey="alumni" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Alumni" />
                            <Bar dataKey="active" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Active" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Engagement Health */}
                <div className="card">
                    <h3 className="text-lg font-bold text-white mb-4">Engagement Health Score</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={engagementTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} domain={[50, 100]} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }} />
                            <Line type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={3} dot={{ fill: '#14b8a6', r: 5 }} name="Engagement Score" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
