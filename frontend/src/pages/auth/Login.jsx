import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, Mail, Lock, ArrowRight, Eye, EyeOff, Heart, Users, Sparkles, GraduationCap, BookOpen } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('STUDENT');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Read the submitted fields directly. This also supports browser
            // password-manager autofill, which may not trigger React onChange.
            const fields = new FormData(e.currentTarget);
            const submittedEmail = String(fields.get('email') || '').trim();
            const submittedPassword = String(fields.get('password') || '');
            const user = await login(submittedEmail, submittedPassword, role);
            const userRole = user.role?.toLowerCase();
            navigate(`/${userRole}/dashboard`);
        } catch (err) {
            console.error('Login error:', err);
            setError((err.code === 'ECONNABORTED' || err.message === 'Network Error')
                ? 'Cannot reach the server. Start the backend and try again.'
                : err.response?.data?.detail || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left - Branding */}
            <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-primary-600/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl" />
                    <div className="absolute inset-0 opacity-5"
                        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
                    />
                </div>
                <div className="relative z-10 text-center max-w-md">
                    <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-8 glow">
                        <Building2 className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-4">
                        Welcome Back to Your Community
                    </h1>
                    <p className="text-surface-300 text-lg mb-8">
                        Your batchmates, mentors, and opportunities are waiting. Sign in to reconnect.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {[
                            { icon: Heart, text: 'Mentorship' },
                            { icon: Users, text: 'Reunions' },
                            { icon: Sparkles, text: 'Opportunities' },
                        ].map((t, i) => (
                            <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-medium text-primary-400">
                                <t.icon className="w-3.5 h-3.5" />
                                {t.text}
                            </span>
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
                        <h2 className="text-3xl font-black text-white mb-2">Sign In</h2>
                        <p className="text-surface-400">Enter the email and password you used when registering.</p>
                    </div>

                    {error && (
                        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-surface-300 mb-2">Sign in as</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { value: 'STUDENT', label: 'Student', icon: BookOpen },
                                    { value: 'ALUMNI', label: 'Alumni', icon: GraduationCap },
                                    { value: 'FACULTY', label: 'Faculty', icon: Users },
                                ].map(({ value, label, icon: Icon }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setRole(value)}
                                        disabled={loading}
                                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-sm font-semibold transition-all border disabled:opacity-50 ${role === value
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
                            <label className="block text-sm font-medium text-surface-300 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                <input
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field pl-12"
                                    placeholder="you@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-surface-300">Password</label>
                                <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300 font-medium">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pl-12 pr-12"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">
                                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Sign In <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-surface-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold">
                            Join the community
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
