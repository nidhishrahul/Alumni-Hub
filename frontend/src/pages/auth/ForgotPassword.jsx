import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const { forgotPassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await forgotPassword(email);
            if (result.resetToken) {
                navigate(`/reset-password?token=${encodeURIComponent(result.resetToken)}`);
                return;
            }
            setSent(true);
        } catch (err) {
            setError(err.response?.data?.detail || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-surface-950">
            <div className="w-full max-w-md">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white">AlumniConnect</span>
                </div>

                {!sent ? (
                    <>
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-white mb-2">Reset Your Password</h2>
                            <p className="text-surface-400">
                                No worries! Enter the email you signed up with and we'll send you a reset link.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="input-field pl-12"
                                        placeholder="you@email.com"
                                        required
                                    />
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
                                    <>Send Reset Link <Send className="w-4 h-4" /></>
                                )}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-3">Check Your Email</h2>
                        <p className="text-surface-400 mb-6">
                            If an account exists for <span className="text-white font-medium">{email}</span>, we've sent a password reset link. Check your inbox (and spam folder).
                        </p>
                        <p className="text-xs text-surface-500 mb-6">
                            💡 Dev mode: Check the Express server console for the reset link.
                        </p>
                    </div>
                )}

                <p className="mt-6 text-center text-sm text-surface-400">
                    <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold inline-flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" /> Back to Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}
