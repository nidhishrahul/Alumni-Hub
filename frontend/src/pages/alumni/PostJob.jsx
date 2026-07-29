import { useState } from 'react';
import { Briefcase, MapPin, Plus, Send, X } from 'lucide-react';

export default function PostJob() {
    const [form, setForm] = useState({ title: '', company: '', location: '', type: 'Internship', description: '', skills: '', requirements: '' });
    const [posted, setPosted] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        setPosted(true);
        setTimeout(() => setPosted(false), 3000);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                    <Plus className="w-7 h-7 text-accent-400" /> Post a Job Opportunity
                </h1>
                <p className="text-sm text-surface-400 mt-1">Help students by sharing job openings or internships from your network</p>
            </div>

            {posted && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                    <Send className="w-4 h-4" /> Opportunity posted successfully! AI will match it with relevant students.
                </div>
            )}

            <form onSubmit={handleSubmit} className="card space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-surface-300 mb-2">Job Title</label>
                        <input type="text" name="title" value={form.title} onChange={handleChange} className="input-field" placeholder="e.g. ML Engineer Intern" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-surface-300 mb-2">Company</label>
                        <input type="text" name="company" value={form.company} onChange={handleChange} className="input-field" placeholder="e.g. Google" required />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-surface-300 mb-2">Location</label>
                        <input type="text" name="location" value={form.location} onChange={handleChange} className="input-field" placeholder="e.g. Bangalore / Remote" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-surface-300 mb-2">Type</label>
                        <select name="type" value={form.type} onChange={handleChange} className="input-field">
                            <option>Internship</option>
                            <option>Full-time</option>
                            <option>Part-time</option>
                            <option>Contract</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">Description</label>
                    <textarea name="description" value={form.description} onChange={handleChange} className="input-field min-h-[120px] resize-y" placeholder="Describe the role, responsibilities, and what the ideal candidate looks like..." required />
                </div>

                <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">Required Skills (comma-separated)</label>
                    <input type="text" name="skills" value={form.skills} onChange={handleChange} className="input-field" placeholder="e.g. Python, TensorFlow, Machine Learning" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">Requirements</label>
                    <textarea name="requirements" value={form.requirements} onChange={handleChange} className="input-field min-h-[80px] resize-y" placeholder="Minimum qualifications, certifications, etc." />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-surface-800/50">
                    <button type="button" className="btn-secondary">Save as Draft</button>
                    <button type="submit" className="btn-accent flex items-center gap-2">
                        <Send className="w-4 h-4" /> Post Opportunity
                    </button>
                </div>
            </form>
        </div>
    );
}
