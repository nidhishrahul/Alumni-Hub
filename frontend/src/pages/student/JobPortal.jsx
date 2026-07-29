import { useState } from 'react';
import { Search, Briefcase, MapPin, Clock, Sparkles, ExternalLink, Filter } from 'lucide-react';

const allJobs = [
    { id: 1, title: 'Machine Learning Engineer Intern', company: 'Google', location: 'Bangalore', type: 'Internship', posted: '2 days ago', match: 91, skills: ['Python', 'TensorFlow', 'ML'], reason: 'Strong ML and Python skills match. Your NLP project experience is highly relevant.', referral: 'Dr. Priya Sharma (Alumni, Google DeepMind)' },
    { id: 2, title: 'Full Stack Developer', company: 'Microsoft', location: 'Hyderabad', type: 'Full-time', posted: '1 week ago', match: 85, skills: ['React', 'Node.js', 'Azure'], reason: 'React proficiency + cloud computing interest aligns with this role.', referral: 'Rahul Verma (Alumni, Microsoft)' },
    { id: 3, title: 'Data Science Intern', company: 'Amazon', location: 'Chennai', type: 'Internship', posted: '3 days ago', match: 82, skills: ['Python', 'Statistics', 'SQL'], reason: 'Data Science, Python, and statistics skills match this role requirements.', referral: 'Anita Patel (Alumni, Amazon)' },
    { id: 4, title: 'Cloud Solutions Architect', company: 'AWS', location: 'Mumbai', type: 'Full-time', posted: '5 days ago', match: 76, skills: ['AWS', 'Terraform', 'Docker'], reason: 'Cloud computing interest area. Consider AWS certification to boost match.', referral: null },
    { id: 5, title: 'Cybersecurity Analyst', company: 'Deloitte', location: 'Pune', type: 'Full-time', posted: '1 day ago', match: 70, skills: ['Security', 'SIEM', 'Networking'], reason: 'Security coursework matches. Penetration testing certification would help.', referral: 'Arjun Reddy (Alumni, Google)' },
    { id: 6, title: 'AI Research Assistant', company: 'IIT Research Lab', location: 'Remote', type: 'Part-time', posted: '4 days ago', match: 88, skills: ['Python', 'NLP', 'Research'], reason: 'Perfect match for your AI research interests and NLP experience.', referral: null },
];

export default function JobPortal() {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const filtered = allJobs.filter(j => {
        const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === 'all' || j.type === typeFilter;
        return matchSearch && matchType;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <Briefcase className="w-7 h-7 text-accent-400" /> AI Job Portal
                    </h1>
                    <p className="text-sm text-surface-400 mt-1">AI-matched opportunities with alumni referral pathways</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs or companies..." className="input-field pl-10 py-2 text-sm w-64" />
                    </div>
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field py-2 text-sm w-40">
                        <option value="all">All Types</option>
                        <option value="Internship">Internship</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                {filtered.map(job => (
                    <div key={job.id} className="card hover:border-accent-500/30 transition-all">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center shrink-0">
                                    <Briefcase className="w-6 h-6 text-accent-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-white">{job.title}</h3>
                                            <p className="text-sm text-surface-400">{job.company}</p>
                                        </div>
                                        <div className="text-right shrink-0 ml-4">
                                            <div className="text-xl font-black text-accent-400">{job.match}%</div>
                                            <p className="text-[10px] text-surface-500">AI Match</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-surface-400">
                                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.posted}</span>
                                        <span className={`badge ${job.type === 'Internship' ? 'badge-accent' : job.type === 'Full-time' ? 'badge-primary' : 'badge-warning'}`}>{job.type}</span>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {job.skills.map((s, i) => <span key={i} className="badge badge-primary text-[10px]">{s}</span>)}
                                    </div>

                                    <div className="mt-3 p-3 rounded-lg bg-accent-500/5 border border-accent-500/10">
                                        <p className="text-xs text-surface-300">
                                            <span className="font-semibold text-accent-400 flex items-center gap-1 mb-1"><Sparkles className="w-3 h-3" /> Why this matches you:</span>
                                            {job.reason}
                                        </p>
                                    </div>

                                    {job.referral && (
                                        <div className="mt-2 p-2 rounded-lg bg-primary-500/5 border border-primary-500/10">
                                            <p className="text-xs text-primary-400 flex items-center gap-1">
                                                <ExternalLink className="w-3 h-3" /> Referral available: <span className="text-surface-300">{job.referral}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-surface-800/50">
                            <button className="btn-secondary text-sm py-2">Save</button>
                            <button className="btn-accent text-sm py-2">Apply Now</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
