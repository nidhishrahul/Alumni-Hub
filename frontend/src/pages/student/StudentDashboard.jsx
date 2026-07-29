import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    GraduationCap, Briefcase, Users, Calendar, TrendingUp,
    ArrowRight, Sparkles, Brain, Target, BookOpen
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const skillData = [
    { name: 'Python', level: 85 }, { name: 'ML/AI', level: 72 },
    { name: 'React', level: 68 }, { name: 'Cloud', level: 55 },
    { name: 'Data Science', level: 78 }, { name: 'Java', level: 60 },
];

const activityData = [
    { month: 'Jan', mentorships: 2, applications: 5 },
    { month: 'Feb', mentorships: 3, applications: 8 },
    { month: 'Mar', mentorships: 1, applications: 12 },
    { month: 'Apr', mentorships: 4, applications: 7 },
    { month: 'May', mentorships: 2, applications: 15 },
    { month: 'Jun', mentorships: 5, applications: 10 },
];

const recommendedMentors = [
    { name: 'Dr. Priya Sharma', role: 'AI Research Lead', company: 'Google DeepMind', match: 94, skills: ['Machine Learning', 'NLP', 'Python'] },
    { name: 'Rahul Verma', role: 'Senior SDE', company: 'Microsoft', match: 88, skills: ['Cloud Computing', 'React', 'TypeScript'] },
    { name: 'Anita Patel', role: 'Data Scientist', company: 'Amazon', match: 82, skills: ['Data Science', 'Python', 'TensorFlow'] },
];

const recommendedJobs = [
    { title: 'ML Engineer Intern', company: 'Google', type: 'Internship', match: 91, reason: 'Strong Python + ML skills match' },
    { title: 'Full Stack Developer', company: 'Microsoft', type: 'Job', match: 85, reason: 'React + Cloud experience aligns' },
    { title: 'Data Analyst', company: 'Amazon', type: 'Internship', match: 79, reason: 'Data Science skills match' },
];

export default function StudentDashboard() {
    const { user } = useAuth();

    const stats = [
        { label: 'Mentor Matches', value: '12', icon: Users, color: 'text-primary-400', bg: 'bg-primary-500/10' },
        { label: 'Job Recommendations', value: '28', icon: Briefcase, color: 'text-accent-400', bg: 'bg-accent-500/10' },
        { label: 'Upcoming Events', value: '5', icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Skill Score', value: '78/100', icon: Target, color: 'text-green-400', bg: 'bg-green-500/10' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 md:p-8">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5" />
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-white mb-2">
                            Welcome back, {user?.full_name?.split(' ')[0] || 'Student'} 👋
                        </h1>
                        <p className="text-white/70 max-w-lg">
                            Your AI agents have found <span className="text-white font-semibold">3 new mentor matches</span> and{' '}
                            <span className="text-white font-semibold">5 job opportunities</span> since your last visit.
                        </p>
                    </div>
                    <div className="hidden md:flex gap-3">
                        <Link to="/student/mentors" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium transition-all flex items-center gap-2">
                            <Brain className="w-4 h-4" /> Find Mentors
                        </Link>
                        <Link to="/student/jobs" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium transition-all flex items-center gap-2">
                            <Briefcase className="w-4 h-4" /> Browse Jobs
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
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

            {/* Charts + Recommendations */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Activity Chart */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white">Activity Overview</h3>
                        <span className="badge badge-primary">Last 6 months</span>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={activityData}>
                            <defs>
                                <linearGradient id="colorMentor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }} />
                            <Area type="monotone" dataKey="mentorships" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMentor)" name="Mentorships" />
                            <Area type="monotone" dataKey="applications" stroke="#14b8a6" fillOpacity={1} fill="url(#colorApps)" name="Applications" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Skill Assessment */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white">Skill Assessment</h3>
                        <span className="badge badge-accent">AI Analyzed</span>
                    </div>
                    <div className="space-y-4">
                        {skillData.map((skill, i) => (
                            <div key={i}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm text-surface-300">{skill.name}</span>
                                    <span className="text-xs font-semibold text-primary-400">{skill.level}%</span>
                                </div>
                                <div className="w-full h-2 bg-surface-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full gradient-primary transition-all duration-1000"
                                        style={{ width: `${skill.level}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* AI Mentor Recommendations */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">AI Mentor Recommendations</h3>
                            <p className="text-xs text-surface-400">Matched using NLP + Cosine Similarity</p>
                        </div>
                    </div>
                    <Link to="/student/mentors" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
                        View All <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    {recommendedMentors.map((mentor, i) => (
                        <div key={i} className="p-4 rounded-xl bg-surface-800/30 border border-surface-700/30 hover:border-primary-500/30 transition-all">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                                    {mentor.name[0]}
                                </div>
                                <div>
                                    <p className="font-semibold text-white text-sm">{mentor.name}</p>
                                    <p className="text-xs text-surface-400">{mentor.role}</p>
                                    <p className="text-xs text-primary-400">{mentor.company}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex-1 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                                    <div className="h-full gradient-primary rounded-full" style={{ width: `${mentor.match}%` }} />
                                </div>
                                <span className="text-xs font-bold text-primary-400">{mentor.match}%</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {mentor.skills.map((s, j) => (
                                    <span key={j} className="badge badge-primary text-[10px]">{s}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Job Recommendations */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-accent-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">AI Job Recommendations</h3>
                            <p className="text-xs text-surface-400">Skills matched with Explainable AI</p>
                        </div>
                    </div>
                    <Link to="/student/jobs" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
                        View All <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                <div className="space-y-3">
                    {recommendedJobs.map((job, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-surface-800/30 border border-surface-700/30 hover:border-accent-500/30 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-accent-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-white text-sm">{job.title}</p>
                                    <p className="text-xs text-surface-400">{job.company} · {job.type}</p>
                                    <p className="text-xs text-accent-400 mt-0.5 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> {job.reason}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="badge badge-accent">{job.match}% match</span>
                                <ArrowRight className="w-4 h-4 text-surface-500 group-hover:text-white transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
