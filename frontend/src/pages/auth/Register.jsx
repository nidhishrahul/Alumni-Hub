import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, Mail, Lock, User, ArrowRight, GraduationCap, Eye, EyeOff, BookOpen, Hash, Calendar, ChevronRight, ChevronLeft, CheckCircle, Users } from 'lucide-react';

const INSTITUTIONAL_DOMAIN = 'college.edu';

export default function Register() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', confirm_password: '', role: 'STUDENT',
        registerNumber: '', graduationYear: '', department: '', degree: 'B.Tech',
    });
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const emailInputRef = useRef(null);
    const passwordInputRef = useRef(null);
    const confirmPasswordInputRef = useRef(null);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const isInstitutionalEmail = formData.email.toLowerCase().endsWith(`@${INSTITUTIONAL_DOMAIN}`);
    const isAlumni = formData.role === 'ALUMNI';

    const goToStep2 = () => {
        setError('');
        // Password managers can populate inputs without firing React's
        // onChange. Read the visible fields so registration saves exactly
        // the credentials the user entered.
        const submittedData = {
            ...formData,
            email: emailInputRef.current?.value.trim() ?? formData.email,
            password: passwordInputRef.current?.value ?? formData.password,
            confirm_password: confirmPasswordInputRef.current?.value ?? formData.confirm_password,
        };

        if (!submittedData.name || !submittedData.email || !submittedData.password) {
            setError('Please fill in all required fields');
            return;
        }
        if (submittedData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (submittedData.password !== submittedData.confirm_password) {
            setError('Passwords do not match');
            return;
        }
        setFormData(submittedData);
        if (isAlumni) {
            setStep(2);
        } else {
            handleSubmit(undefined, submittedData);
        }
    };

    const handleSubmit = async (e, dataToRegister = formData) => {
        e?.preventDefault();
        setError('');
        if (isAlumni && (!dataToRegister.graduationYear || !dataToRegister.department || !dataToRegister.degree)) {
            setError('Please fill in all alumni details');
            return;
        }
        setLoading(true);
        try {
            const user = await register(dataToRegister);
            const role = user.role?.toLowerCase();
            navigate(`/${role}/dashboard`);
        } catch (err) {
            setError(err.code === 'ECONNABORTED'
                ? 'The server is not responding. Start the backend and try again.'
                : err.response?.data?.detail || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Information Technology', 'Chemical', 'Biotechnology'];
    const degrees = ['B.Tech', 'M.Tech', 'B.E.', 'M.E.', 'BCA', 'MCA', 'B.Sc', 'M.Sc', 'MBA', 'PhD'];
    const currentYear = new Date().getFullYear();

    return (
        <div className="min-h-screen flex">
            {/* Left - Branding */}
            <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0">
                    <div className="absolute top-20 right-20 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 left-20 w-72 h-72 bg-primary-600/10 rounded-full blur-3xl" />
                    <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                </div>
                <div className="relative z-10 text-center max-w-md">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-500 to-primary-600 flex items-center justify-center mx-auto mb-8 glow-accent">
                        <GraduationCap className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-4">Join Your College Community</h1>
                    <p className="text-surface-300 text-lg mb-8">
                        Reconnect with batchmates, find mentors, and unlock opportunities — all in one place built for your alumni network.
                    </p>
                    <div className="space-y-3 text-left">
                        {[
                            { icon: Users, text: 'Connect with alumni across batches & departments' },
                            { icon: GraduationCap, text: 'Get mentorship from experienced professionals' },
                            { icon: CheckCircle, text: 'Verified profiles you can trust' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                                <item.icon className="w-5 h-5 text-accent-400 shrink-0" />
                                <span className="text-surface-200 text-sm">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-surface-950">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">AlumniConnect</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-white mb-2">
                            {step === 1 ? 'Create Your Account' : 'Alumni Details'}
                        </h2>
                        <p className="text-surface-400">
                            {step === 1
                                ? "We're excited to have you! Let's get started."
                                : 'Help us verify your alumni status with these details.'
                            }
                        </p>
                        {/* Step indicator for alumni */}
                        {isAlumni && (
                            <div className="flex items-center gap-2 mt-4">
                                <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-primary-500' : 'bg-surface-700'}`} />
                                <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-primary-500' : 'bg-surface-700'}`} />
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
                    )}

                    {/* ── STEP 1: Basic Info ─────────────────────────────── */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field pl-12" placeholder="Enter your full name" required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                    <input ref={emailInputRef} type="email" name="email" value={formData.email} onChange={handleChange} className="input-field pl-12" placeholder="you@email.com" required />
                                </div>
                                {isInstitutionalEmail && (
                                    <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                        <span className="text-xs text-green-400 font-medium">Institutional email detected — this helps with verification!</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">I am a...</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { role: 'STUDENT', label: 'Student', icon: BookOpen },
                                        { role: 'ALUMNI', label: 'Alumni', icon: GraduationCap },
                                        { role: 'FACULTY', label: 'Faculty', icon: Users },
                                    ].map(({ role, label, icon: Icon }) => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role })}
                                            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-sm font-semibold transition-all border
                                                ${formData.role === role
                                                    ? 'bg-primary-600/20 border-primary-500 text-primary-400'
                                                    : 'bg-surface-800/30 border-surface-700 text-surface-400 hover:border-surface-500'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                    <input ref={passwordInputRef} type={showPass ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} className="input-field pl-12 pr-12" placeholder="Create a password (min 6 chars)" autoComplete="new-password" required />
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">
                                        {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                    <input ref={confirmPasswordInputRef} type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} className="input-field pl-12" placeholder="Confirm your password" autoComplete="new-password" required />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={goToStep2}
                                disabled={loading}
                                className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : isAlumni ? (
                                    <>Next: Alumni Details <ChevronRight className="w-4 h-4" /></>
                                ) : (
                                    <>Create Account <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>
                    )}

                    {/* ── STEP 2: Alumni Details ──────────────────────────── */}
                    {step === 2 && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">Register Number <span className="text-surface-500">(optional)</span></label>
                                <div className="relative">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                    <input type="text" name="registerNumber" value={formData.registerNumber} onChange={handleChange} className="input-field pl-12" placeholder="e.g. CSE2019001" />
                                </div>
                                <p className="mt-1 text-xs text-surface-500">Used as a verification signal — helps speed up approval.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-surface-300 mb-2">Graduation Year</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                        <select name="graduationYear" value={formData.graduationYear} onChange={handleChange} className="input-field pl-12 appearance-none" required>
                                            <option value="">Select</option>
                                            {Array.from({ length: 30 }, (_, i) => currentYear - i).map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-300 mb-2">Degree</label>
                                    <select name="degree" value={formData.degree} onChange={handleChange} className="input-field appearance-none" required>
                                        {degrees.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">Department</label>
                                <select name="department" value={formData.department} onChange={handleChange} className="input-field appearance-none" required>
                                    <option value="">Select your department</option>
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            {/* Info banner */}
                            <div className="px-4 py-3 rounded-xl bg-primary-500/10 border border-primary-500/20">
                                <p className="text-xs text-primary-300 leading-relaxed">
                                    <strong>Verification:</strong> Your alumni profile will be created with a <span className="text-primary-400 font-semibold">pending</span> status. An admin will review your details. You can add more verification signals later (graduation certificate, references from verified alumni, etc.)
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3 flex items-center justify-center gap-2">
                                    <ChevronLeft className="w-4 h-4" /> Back
                                </button>
                                <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>Create Account <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    <p className="mt-6 text-center text-sm text-surface-400">
                        Already have an account? <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
