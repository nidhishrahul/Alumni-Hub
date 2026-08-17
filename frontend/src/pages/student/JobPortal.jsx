import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    AlertCircle, Bookmark, Briefcase, CheckCircle2, Clock, ExternalLink,
    Loader2, MapPin, Search, Send, Sparkles, Target,
} from 'lucide-react';
import api from '../../services/api';

const formatPosted = (value) => {
    const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
};

export default function JobPortal() {
    const [jobs, setJobs] = useState([]);
    const [profileSkills, setProfileSkills] = useState([]);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [viewFilter, setViewFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [workingId, setWorkingId] = useState(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const loadRecommendations = async () => {
            try {
                const response = await api.get('/api/jobs/recommendations');
                setJobs(response.data.jobs || []);
                setProfileSkills(response.data.profileSkills || []);
            } catch (requestError) {
                setError(requestError.response?.data?.detail || 'Unable to load job recommendations');
            } finally {
                setLoading(false);
            }
        };
        loadRecommendations();
    }, []);

    const jobTypes = useMemo(
        () => ['all', ...new Set(jobs.map((job) => job.type))],
        [jobs]
    );
    const filtered = jobs.filter((job) => {
        const query = search.trim().toLowerCase();
        const searchable = `${job.title} ${job.company} ${job.location} ${job.skills.join(' ')}`.toLowerCase();
        const matchesSearch = !query || searchable.includes(query);
        const matchesType = typeFilter === 'all' || job.type === typeFilter;
        const matchesView = viewFilter === 'all' ||
            (viewFilter === 'saved' && job.isSaved) ||
            (viewFilter === 'applied' && job.appliedAt);
        return matchesSearch && matchesType && matchesView;
    });
    const savedCount = jobs.filter((job) => job.isSaved).length;
    const appliedCount = jobs.filter((job) => job.appliedAt).length;
    const strongMatchCount = jobs.filter((job) => job.matchScore >= 70).length;

    const updateJob = (jobId, changes) => {
        setJobs((current) => current.map((job) => job.id === jobId ? { ...job, ...changes } : job));
    };

    const toggleSaved = async (job) => {
        if (workingId) return;
        setWorkingId(job.id);
        setError('');
        setMessage('');
        try {
            const isSaved = !job.isSaved;
            await api.post(`/api/jobs/${job.id}/save`, { isSaved });
            updateJob(job.id, { isSaved });
            setMessage(isSaved ? `${job.title} saved for later.` : `${job.title} removed from saved jobs.`);
        } catch (requestError) {
            setError(requestError.response?.data?.detail || 'Unable to update the saved job');
        } finally {
            setWorkingId(null);
        }
    };

    const applyForJob = async (job) => {
        if (workingId || job.appliedAt) return;
        setWorkingId(job.id);
        setError('');
        setMessage('');
        try {
            const response = await api.post(`/api/jobs/${job.id}/apply`);
            updateJob(job.id, { appliedAt: response.data.action.appliedAt });
            setMessage(`Application recorded for ${job.title}.`);
            if (response.data.applicationUrl) {
                window.open(response.data.applicationUrl, '_blank', 'noopener,noreferrer');
            }
        } catch (requestError) {
            setError(requestError.response?.data?.detail || 'Unable to record the application');
        } finally {
            setWorkingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[360px] items-center justify-center">
                <div className="text-center">
                    <Loader2 className="mx-auto h-9 w-9 animate-spin text-accent-400" />
                    <p className="mt-3 text-sm text-surface-400">Matching jobs with your skills...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-black text-white">
                        <Briefcase className="h-7 w-7 text-accent-400" /> Skill-Matched Jobs
                    </h1>
                    <p className="mt-1 text-sm text-surface-400">
                        Ranked using the skills saved in your student profile
                    </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search role, company, or skill"
                            className="input-field w-full py-2 pl-10 text-sm sm:w-72"
                        />
                    </div>
                    <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="input-field py-2 text-sm sm:w-44">
                        {jobTypes.map((type) => <option key={type} value={type}>{type === 'all' ? 'All job types' : type}</option>)}
                    </select>
                </div>
            </div>

            {profileSkills.length ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-primary-500/20 bg-primary-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="flex items-center gap-2 text-sm font-semibold text-primary-300"><Target className="h-4 w-4" /> Matching your profile</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {profileSkills.map((skill) => <span key={skill} className="badge badge-primary text-[10px]">{skill}</span>)}
                        </div>
                    </div>
                    <Link to="/profile" className="text-sm font-medium text-primary-400 hover:text-primary-300">Update skills</Link>
                </div>
            ) : (
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-200">
                    Add your skills to unlock meaningful match scores.{' '}
                    <Link to="/profile" className="font-semibold underline">Complete student profile</Link>
                </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
                {[
                    ['Strong matches', strongMatchCount, 'text-accent-400'],
                    ['Saved jobs', savedCount, 'text-primary-400'],
                    ['Applications', appliedCount, 'text-green-400'],
                ].map(([label, value, color]) => (
                    <div key={label} className="stat-card">
                        <p className={`text-2xl font-black ${color}`}>{value}</p>
                        <p className="mt-1 text-xs text-surface-400">{label}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-2">
                {[
                    ['all', `All (${jobs.length})`],
                    ['saved', `Saved (${savedCount})`],
                    ['applied', `Applied (${appliedCount})`],
                ].map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => setViewFilter(value)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${viewFilter === value ? 'border-primary-500 bg-primary-500/15 text-primary-300' : 'border-surface-700 text-surface-400 hover:border-surface-500'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {message && <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-300"><CheckCircle2 className="h-4 w-4" />{message}</div>}
            {error && <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"><AlertCircle className="h-4 w-4" />{error}</div>}

            <div className="space-y-4">
                {filtered.map((job) => (
                    <article key={job.id} className="card transition-all hover:border-accent-500/30">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-500/10">
                                <Briefcase className="h-6 w-6 text-accent-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h2 className="font-bold text-white">{job.title}</h2>
                                        <p className="text-sm text-surface-400">{job.company}</p>
                                    </div>
                                    <div className="shrink-0 sm:text-right">
                                        <p className="text-xl font-black text-accent-400">{job.matchScore}%</p>
                                        <p className="text-[10px] uppercase tracking-wide text-surface-500">Skill match</p>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-surface-400">
                                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatPosted(job.createdAt)}</span>
                                    <span className="badge badge-primary">{job.type}</span>
                                    {job.postedBy && <span>Posted by {job.postedBy.name}</span>}
                                </div>

                                <p className="mt-3 text-sm leading-relaxed text-surface-300">{job.description}</p>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {job.skills.map((skill) => (
                                        <span key={skill} className={`badge text-[10px] ${job.matchedSkills.includes(skill) ? 'badge-success' : 'badge-primary'}`}>
                                            {skill}{job.matchedSkills.includes(skill) ? ' ✓' : ''}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-3 rounded-lg border border-accent-500/10 bg-accent-500/5 p-3">
                                    <p className="text-xs text-surface-300"><span className="mb-1 flex items-center gap-1 font-semibold text-accent-400"><Sparkles className="h-3 w-3" />Why this is suggested</span>{job.reason}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-surface-800/50 pt-4">
                            <button type="button" onClick={() => toggleSaved(job)} disabled={workingId === job.id} className={`btn-secondary flex items-center gap-2 py-2 text-sm ${job.isSaved ? 'border-primary-500/40 text-primary-300' : ''}`}>
                                <Bookmark className={`h-4 w-4 ${job.isSaved ? 'fill-current' : ''}`} />{job.isSaved ? 'Saved' : 'Save'}
                            </button>
                            <button type="button" onClick={() => applyForJob(job)} disabled={workingId === job.id || Boolean(job.appliedAt)} className="btn-accent flex items-center gap-2 py-2 text-sm disabled:opacity-60">
                                {workingId === job.id
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : job.appliedAt
                                        ? <CheckCircle2 className="h-4 w-4" />
                                        : job.applicationUrl
                                            ? <ExternalLink className="h-4 w-4" />
                                            : <Send className="h-4 w-4" />}
                                {job.appliedAt ? 'Applied' : job.applicationUrl ? 'Apply Now' : 'Express Interest'}
                            </button>
                        </div>
                    </article>
                ))}
            </div>

            {!filtered.length && (
                <div className="card py-14 text-center">
                    <Briefcase className="mx-auto h-12 w-12 text-surface-600" />
                    <h3 className="mt-3 font-bold text-white">No jobs found</h3>
                    <p className="mt-1 text-sm text-surface-400">Try another search, job type, or view.</p>
                </div>
            )}
        </div>
    );
}
