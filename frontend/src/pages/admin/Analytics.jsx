import { BarChart3, Globe, TrendingUp, DollarSign, GraduationCap, Brain, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Treemap } from 'recharts';

const salaryData = [
    { range: '3-5L', count: 120 }, { range: '5-8L', count: 280 },
    { range: '8-12L', count: 350 }, { range: '12-18L', count: 210 },
    { range: '18-25L', count: 140 }, { range: '25L+', count: 95 },
];

const geoData = [
    { name: 'Bangalore', value: 320, color: '#3b82f6' },
    { name: 'Hyderabad', value: 180, color: '#14b8a6' },
    { name: 'Chennai', value: 150, color: '#f59e0b' },
    { name: 'Mumbai', value: 130, color: '#ef4444' },
    { name: 'Pune', value: 110, color: '#8b5cf6' },
    { name: 'Delhi NCR', value: 95, color: '#06b6d4' },
    { name: 'International', value: 85, color: '#10b981' },
    { name: 'Others', value: 175, color: '#64748b' },
];

const skillDemand = [
    { skill: 'Python', demand: 92 }, { skill: 'ML/AI', demand: 88 },
    { skill: 'Cloud', demand: 85 }, { skill: 'React', demand: 80 },
    { skill: 'Java', demand: 75 }, { skill: 'Data Science', demand: 82 },
];

const entrepreneurship = [
    { year: '2020', startups: 8 }, { year: '2021', startups: 12 },
    { year: '2022', startups: 15 }, { year: '2023', startups: 22 },
    { year: '2024', startups: 28 }, { year: '2025', startups: 35 },
];

export default function Analytics() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                    <BarChart3 className="w-7 h-7 text-primary-400" /> Advanced Analytics
                </h1>
                <p className="text-sm text-surface-400 mt-1">AI-powered institutional insights and predictive analytics</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Avg. Salary', value: '₹12.5L', icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
                    { label: 'Higher Studies', value: '23%', icon: GraduationCap, color: 'text-primary-400', bg: 'bg-primary-500/10' },
                    { label: 'Entrepreneurs', value: '35', icon: TrendingUp, color: 'text-accent-400', bg: 'bg-accent-500/10' },
                    { label: 'Global Presence', value: '8 countries', icon: Globe, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                ].map((stat, i) => (
                    <div key={i} className="stat-card">
                        <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <p className="text-2xl font-black text-white mt-3">{stat.value}</p>
                        <p className="text-xs text-surface-400 mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Salary Distribution */}
                <div className="card">
                    <h3 className="text-lg font-bold text-white mb-4">Salary Distribution (₹ LPA)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={salaryData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 11 }} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Alumni Count" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Geographic Distribution */}
                <div className="card">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary-400" /> Geographic Distribution
                    </h3>
                    <div className="flex items-center gap-6">
                        <ResponsiveContainer width="45%" height={280}>
                            <PieChart>
                                <Pie data={geoData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" stroke="none">
                                    {geoData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2 flex-1">
                            {geoData.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                    <span className="text-xs text-surface-300 flex-1">{item.name}</span>
                                    <span className="text-xs font-bold text-white">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Skill Demand */}
                <div className="card">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-accent-400" /> Top Skills in Demand
                    </h3>
                    <div className="space-y-4">
                        {skillDemand.map((s, i) => (
                            <div key={i}>
                                <div className="flex justify-between mb-1.5">
                                    <span className="text-sm text-surface-300">{s.skill}</span>
                                    <span className="text-xs font-semibold text-accent-400">{s.demand}%</span>
                                </div>
                                <div className="w-full h-2.5 bg-surface-800 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-accent-600 to-primary-500 transition-all duration-1000" style={{ width: `${s.demand}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Entrepreneurship Growth */}
                <div className="card">
                    <h3 className="text-lg font-bold text-white mb-4">Alumni Entrepreneurship Growth</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={entrepreneurship}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }} />
                            <Bar dataKey="startups" fill="#14b8a6" radius={[6, 6, 0, 0]} name="Startups Founded" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
