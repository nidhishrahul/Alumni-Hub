import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight, Briefcase, CheckCircle2, GraduationCap, Loader2,
    MessageSquare, Sparkles, Target, UserRound, Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const parseList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return String(value).split(',').map((item) => item.trim()).filter(Boolean);
    }
};

export default function StudentDashboard() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const profile = user?.studentProfile || {};
    const skills = useMemo(() => parseList(profile.skills), [profile.skills]);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [jobResponse, mentorResponse, requestResponse] = await Promise.all([
                    api.get('/api/jobs/recommendations'),
                    api.get('/api/alumni-directory'),
                    api.get('/api/alumni-directory/my-requests'),
                ]);
                setJobs(jobResponse.data.jobs || []);
                setMentors(mentorResponse.data || []);
                setRequests(requestResponse.data || []);
            } catch (requestError) {
                setError(requestError.response?.data?.detail || 'Unable to load your student dashboard');
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);

    const readinessFields = [profile.department, profile.degree, profile.graduationYear, profile.bio, skills.length];
    const readiness = Math.round(readinessFields.filter(Boolean).length / readinessFields.length * 100);
    const activeRequests = requests.filter((request) => !['DECLINED', 'COMPLETED'].includes(request.status)).length;
    const strongMatches = jobs.filter((job) => job.matchScore >= 70).length;
    const firstName = (user?.name || 'Student').split(' ')[0];

    if (loading) {
        return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-primary-400" /></div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <section className="relative overflow-hidden rounded-3xl gradient-primary p-6 md:p-8">
                <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/75"><Sparkles className="h-4 w-4" />Your career workspace</p>
                        <h1 className="text-3xl font-black text-white">Welcome back, {firstName}</h1>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">
                            You have {strongMatches} strong job match{strongMatches === 1 ? '' : 'es'} and {activeRequests} active mentorship request{activeRequests === 1 ? '' : 's'}.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/student/jobs" className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-primary-700 transition hover:bg-white/90"><Briefcase className="h-4 w-4" />Explore jobs</Link>
                        <Link to="/student/mentors" className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"><Users className="h-4 w-4" />Find mentors</Link>
                    </div>
                </div>
            </section>

            {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: 'Recommended jobs', value: jobs.length, icon: Briefcase, color: 'text-accent-400', bg: 'bg-accent-500/10' },
                    { label: 'Strong skill matches', value: strongMatches, icon: Target, color: 'text-green-400', bg: 'bg-green-500/10' },
                    { label: 'Available alumni', value: mentors.length, icon: GraduationCap, color: 'text-primary-400', bg: 'bg-primary-500/10' },
                    { label: 'Mentorship requests', value: activeRequests, icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="stat-card group">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div>
                        <p className="mt-4 text-2xl font-black text-white">{value}</p>
                        <p className="mt-1 text-xs text-surface-400">{label}</p>
                    </div>
                ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
                <div className="card lg:col-span-2">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-white">Top matches for your skills</h2>
                            <p className="mt-1 text-xs text-surface-400">Live opportunities ranked from your profile</p>
                        </div>
                        <Link to="/student/jobs" className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300">View all <ArrowRight className="h-4 w-4" /></Link>
                    </div>
                    <div className="space-y-3">
                        {jobs.slice(0, 4).map((job) => (
                            <Link key={job.id} to="/student/jobs" className="group flex flex-col gap-3 rounded-xl border border-surface-700/40 bg-surface-800/25 p-4 transition hover:border-accent-500/30 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/10"><Briefcase className="h-5 w-5 text-accent-400" /></div>
                                    <div>
                                        <p className="text-sm font-semibold text-white group-hover:text-accent-300">{job.title}</p>
                                        <p className="text-xs text-surface-400">{job.company} · {job.type}</p>
                                        <p className="mt-1 line-clamp-1 text-xs text-accent-400">{job.reason}</p>
                                    </div>
                                </div>
                                <span className="badge badge-accent shrink-0">{job.matchScore}% match</span>
                            </Link>
                        ))}
                        {!jobs.length && <p className="py-8 text-center text-sm text-surface-400">No active opportunities are available yet.</p>}
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-white">Profile readiness</h2>
                        <span className="text-lg font-black text-green-400">{readiness}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-800"><div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-green-400 transition-all" style={{ width: `${readiness}%` }} /></div>
                    <div className="mt-5 space-y-3">
                        {skills.length ? skills.slice(0, 6).map((skill) => (
                            <div key={skill} className="flex items-center gap-2 text-sm text-surface-300"><CheckCircle2 className="h-4 w-4 text-green-400" />{skill}</div>
                        )) : <p className="text-sm leading-relaxed text-surface-400">Add skills so jobs can be ranked for your actual strengths.</p>}
                    </div>
                    <Link to="/profile" className="btn-secondary mt-6 flex w-full items-center justify-center gap-2 text-sm"><UserRound className="h-4 w-4" />Complete profile</Link>
                </div>
            </section>

            <section className="card">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-white">Alumni ready to help</h2>
                        <p className="mt-1 text-xs text-surface-400">Start a real mentorship request and continue in live chat</p>
                    </div>
                    <Link to="/student/mentors" className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300">Browse directory <ArrowRight className="h-4 w-4" /></Link>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {mentors.slice(0, 3).map((mentor) => (
                        <Link key={mentor.profileId} to="/student/mentors" className="rounded-xl border border-surface-700/40 bg-surface-800/25 p-4 transition hover:border-primary-500/40">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-sm font-bold text-white">{mentor.name?.[0] || '?'}</div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{mentor.name}</p>
                                    <p className="text-xs text-surface-400">{mentor.designation || 'Alumni mentor'}</p>
                                    <p className="text-xs text-primary-400">{mentor.company || mentor.department}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
