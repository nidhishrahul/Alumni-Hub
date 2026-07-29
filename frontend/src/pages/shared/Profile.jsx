import { useAuth } from '../../context/AuthContext';
import { User, Mail, GraduationCap, Building2, Briefcase, MapPin, Award, Edit, Save, X, Plus, CheckCircle2, AlertCircle, Globe, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Profile() {
    const { user, updateProfile } = useAuth();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const profile = user?.alumniProfile || {};

    const parseList = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            return String(val).split(',').map(s => s.trim()).filter(Boolean);
        }
        return [];
    };

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        location: '',
        bio: '',
        department: '',
        degree: '',
        graduationYear: '',
        currentCompany: '',
        currentDesignation: '',
        linkedinUrl: '',
        skills: [],
        interests: [],
    });

    const [newSkill, setNewSkill] = useState('');
    const [newInterest, setNewInterest] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                location: profile.location || '',
                bio: profile.bio || '',
                department: profile.department || (user.role === 'ALUMNI' ? 'Computer Science' : 'Information Technology'),
                degree: profile.degree || 'B.Tech',
                graduationYear: profile.graduationYear || (user.role === 'ALUMNI' ? 2022 : 2026),
                currentCompany: profile.currentCompany || '',
                currentDesignation: profile.currentDesignation || '',
                linkedinUrl: profile.linkedinUrl || '',
                skills: parseList(profile.skills).length > 0 ? parseList(profile.skills) : ['JavaScript', 'React', 'Problem Solving'],
                interests: parseList(profile.interests).length > 0 ? parseList(profile.interests) : ['Web Development', 'Mentorship'],
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addSkill = () => {
        if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
            setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
            setNewSkill('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }));
    };

    const addInterest = () => {
        if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
            setFormData(prev => ({ ...prev, interests: [...prev.interests, newInterest.trim()] }));
            setNewInterest('');
        }
    };

    const removeInterest = (interestToRemove) => {
        setFormData(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interestToRemove) }));
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        setSuccessMsg('');
        setErrorMsg('');

        try {
            await updateProfile({
                name: formData.name,
                phone: formData.phone,
                location: formData.location,
                bio: formData.bio,
                department: formData.department,
                degree: formData.degree,
                graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : undefined,
                currentCompany: formData.currentCompany,
                currentDesignation: formData.currentDesignation,
                linkedinUrl: formData.linkedinUrl,
                skills: formData.skills,
                interests: formData.interests,
            });
            setSuccessMsg('Profile updated successfully!');
            setEditing(false);
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
            console.error('Save profile error:', err);
            setErrorMsg(err.response?.data?.detail || 'Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const displayName = user?.name || formData.name || 'User Profile';
    const displayRole = user?.role || 'STUDENT';
    const displayDept = formData.department || 'Department';
    const displayYear = user?.role === 'STUDENT' ? `Graduation ${formData.graduationYear || '2026'}` : `Class of ${formData.graduationYear || '2022'}`;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
            {/* Status Messages */}
            {successMsg && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{successMsg}</span>
                </div>
            )}
            {errorMsg && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{errorMsg}</span>
                </div>
            )}

            {/* Profile Header */}
            <div className="card relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-32 gradient-primary opacity-30" />
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end gap-6 pt-20 pb-2">
                    <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center text-white text-4xl font-black shadow-lg -mt-8">
                        {displayName[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-black text-white">{displayName}</h1>
                            <span className="badge badge-primary capitalize">{displayRole.toLowerCase()}</span>
                            {profile.isVerified && (
                                <span className="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    ✓ Verified Alumni
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-surface-400 mt-1">
                            {displayDept} · {displayYear}
                        </p>
                        {(formData.currentDesignation || formData.currentCompany) && (
                            <p className="text-xs text-surface-400 mt-0.5 flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-primary-400" />
                                {formData.currentDesignation}{formData.currentDesignation && formData.currentCompany ? ' at ' : ''}{formData.currentCompany}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            if (editing) {
                                handleSave();
                            } else {
                                setEditing(true);
                            }
                        }}
                        disabled={saving}
                        className="btn-primary text-sm flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                        {saving ? (
                            <span>Saving...</span>
                        ) : editing ? (
                            <><Save className="w-4 h-4" /> Save Profile</>
                        ) : (
                            <><Edit className="w-4 h-4" /> Edit Profile</>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* About Section */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary-400" /> About
                        </h3>
                        {editing ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-surface-400 mb-1 font-medium">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="input-field text-sm"
                                        placeholder="Your Full Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-surface-400 mb-1 font-medium">Bio</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        className="input-field min-h-[100px] text-sm resize-y"
                                        placeholder="Write a brief bio about your academic/professional background and interests..."
                                    />
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-surface-300 leading-relaxed whitespace-pre-line">
                                {formData.bio || 'No bio added yet. Click "Edit Profile" to add your bio.'}
                            </p>
                        )}
                    </div>

                    {/* Academic & Professional Details (in Edit Mode) */}
                    {editing && (
                        <div className="card space-y-4">
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-accent-400" /> Academic & Work Info
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-surface-400 mb-1 font-medium">Department</label>
                                    <input
                                        type="text"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        className="input-field text-sm"
                                        placeholder="e.g. Computer Science"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-surface-400 mb-1 font-medium">Graduation Year</label>
                                    <input
                                        type="number"
                                        name="graduationYear"
                                        value={formData.graduationYear}
                                        onChange={handleChange}
                                        className="input-field text-sm"
                                        placeholder="e.g. 2024"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-surface-400 mb-1 font-medium">Degree</label>
                                    <input
                                        type="text"
                                        name="degree"
                                        value={formData.degree}
                                        onChange={handleChange}
                                        className="input-field text-sm"
                                        placeholder="e.g. B.Tech CSE"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-surface-400 mb-1 font-medium">LinkedIn Profile URL</label>
                                    <input
                                        type="text"
                                        name="linkedinUrl"
                                        value={formData.linkedinUrl}
                                        onChange={handleChange}
                                        className="input-field text-sm"
                                        placeholder="https://linkedin.com/in/username"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-surface-400 mb-1 font-medium">Current Company</label>
                                    <input
                                        type="text"
                                        name="currentCompany"
                                        value={formData.currentCompany}
                                        onChange={handleChange}
                                        className="input-field text-sm"
                                        placeholder="e.g. Google, Microsoft, etc."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-surface-400 mb-1 font-medium">Current Designation / Role</label>
                                    <input
                                        type="text"
                                        name="currentDesignation"
                                        value={formData.currentDesignation}
                                        onChange={handleChange}
                                        className="input-field text-sm"
                                        placeholder="e.g. Senior Software Engineer"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Skills Section */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-white mb-4">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {formData.skills.map((skill, i) => (
                                <span key={i} className="badge badge-primary flex items-center gap-1.5">
                                    {skill}
                                    {editing && (
                                        <button onClick={() => removeSkill(skill)} className="hover:text-rose-300">
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </span>
                            ))}
                            {formData.skills.length === 0 && !editing && (
                                <p className="text-xs text-surface-400">No skills added yet.</p>
                            )}
                        </div>
                        {editing && (
                            <div className="flex gap-2 mt-4">
                                <input
                                    type="text"
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                    placeholder="Add a new skill (e.g. React, Python)"
                                    className="input-field text-sm flex-1"
                                />
                                <button type="button" onClick={addSkill} className="btn-secondary text-sm flex items-center gap-1">
                                    <Plus className="w-4 h-4" /> Add
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Interests Section */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-white mb-4">Interests & Specializations</h3>
                        <div className="flex flex-wrap gap-2">
                            {formData.interests.map((interest, i) => (
                                <span key={i} className="badge badge-accent flex items-center gap-1.5">
                                    {interest}
                                    {editing && (
                                        <button onClick={() => removeInterest(interest)} className="hover:text-rose-300">
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </span>
                            ))}
                            {formData.interests.length === 0 && !editing && (
                                <p className="text-xs text-surface-400">No interests added yet.</p>
                            )}
                        </div>
                        {editing && (
                            <div className="flex gap-2 mt-4">
                                <input
                                    type="text"
                                    value={newInterest}
                                    onChange={(e) => setNewInterest(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                                    placeholder="Add interest (e.g. AI Research, Web Dev)"
                                    className="input-field text-sm flex-1"
                                />
                                <button type="button" onClick={addInterest} className="btn-secondary text-sm flex items-center gap-1">
                                    <Plus className="w-4 h-4" /> Add
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="card space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-surface-400">Contact & Details</h3>
                        <div className="space-y-3.5 text-sm">
                            <div className="flex items-center gap-3 text-surface-300">
                                <Mail className="w-4 h-4 text-surface-500 flex-shrink-0" />
                                <span className="truncate">{user?.email || 'N/A'}</span>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-3 text-surface-300">
                                <MapPin className="w-4 h-4 text-primary-400 flex-shrink-0" />
                                {editing ? (
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="input-field text-xs py-1 px-2 flex-1"
                                        placeholder="City, Country (e.g. Chennai, India)"
                                    />
                                ) : (
                                    <span>{formData.location || 'Location not set'}</span>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="flex items-center gap-3 text-surface-300">
                                <Phone className="w-4 h-4 text-surface-500 flex-shrink-0" />
                                {editing ? (
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="input-field text-xs py-1 px-2 flex-1"
                                        placeholder="Phone Number"
                                    />
                                ) : (
                                    <span>{formData.phone || 'Phone not set'}</span>
                                )}
                            </div>

                            {/* Department */}
                            <div className="flex items-center gap-3 text-surface-300">
                                <Building2 className="w-4 h-4 text-surface-500 flex-shrink-0" />
                                <span>{formData.department || 'Department not set'}</span>
                            </div>

                            {/* Graduation */}
                            <div className="flex items-center gap-3 text-surface-300">
                                <GraduationCap className="w-4 h-4 text-surface-500 flex-shrink-0" />
                                <span>{displayYear}</span>
                            </div>

                            {/* LinkedIn */}
                            {formData.linkedinUrl && (
                                <div className="flex items-center gap-3 text-surface-300">
                                    <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                    <a href={formData.linkedinUrl.startsWith('http') ? formData.linkedinUrl : `https://${formData.linkedinUrl}`} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline truncate">
                                        {formData.linkedinUrl.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Alumni Digital Twin Card */}
                    <div className="card bg-gradient-to-br from-primary-900/30 to-accent-900/30 border-primary-500/20">
                        <div className="flex items-center gap-2 mb-3">
                            <Award className="w-5 h-5 text-primary-400" />
                            <h3 className="text-sm font-bold text-white">Alumni Digital Twin</h3>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between">
                                <span className="text-surface-400">Profile Completion</span>
                                <span className="font-bold text-primary-400">
                                    {Math.min(100, Math.round(([formData.name, formData.location, formData.bio, formData.department, formData.skills.length > 0].filter(Boolean).length / 5) * 100))}%
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full gradient-primary rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.round(([formData.name, formData.location, formData.bio, formData.department, formData.skills.length > 0].filter(Boolean).length / 5) * 100))}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-2">
                                <span className="text-surface-400">Engagement Score</span>
                                <span className="font-bold text-accent-400">85/100</span>
                            </div>
                            <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-accent-600 to-primary-500 rounded-full" style={{ width: '85%' }} />
                            </div>
                            <p className="text-surface-500 mt-2">Database state: Synced</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
