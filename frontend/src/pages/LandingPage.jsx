import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Bot, Brain, Users, Briefcase, BarChart3, Network, Shield, Sparkles,
    ArrowRight, GraduationCap, Building2, Zap, Target, ChevronRight
} from 'lucide-react';

const features = [
    { icon: Brain, title: 'Alumni Intelligence Agent', desc: 'AI-powered expertise scoring, career timelines, and industry categorization for every alumnus.', color: 'from-blue-500 to-cyan-400' },
    { icon: Users, title: 'Smart Mentorship Matching', desc: 'NLP-driven matching with cosine similarity. Explainable recommendations for why each mentor fits.', color: 'from-purple-500 to-pink-400' },
    { icon: Briefcase, title: 'Career Opportunity Agent', desc: 'Automated job and internship recommendations based on skill embeddings and resume matching.', color: 'from-amber-500 to-orange-400' },
    { icon: Target, title: 'Engagement Prediction', desc: 'Predict alumni participation in events, donations, and mentorship with gradient boosting models.', color: 'from-green-500 to-emerald-400' },
    { icon: Bot, title: 'AI Communication Assistant', desc: 'Multilingual chatbot with LLM integration, RAG pipeline, and knowledge base access.', color: 'from-rose-500 to-red-400' },
    { icon: BarChart3, title: 'Analytics Intelligence', desc: 'Placement trends, salary analysis, geographic distribution, and predictive institutional insights.', color: 'from-indigo-500 to-violet-400' },
];

const novelFeatures = [
    { icon: Sparkles, title: 'Explainable AI (XAI)', desc: 'SHAP-value explanations for every recommendation' },
    { icon: Zap, title: 'Alumni Digital Twin', desc: 'Virtual profiles that continuously evolve with AI' },
    { icon: Network, title: 'Graph Network Analysis', desc: 'NetworkX-powered alumni relationship mapping' },
    { icon: Shield, title: 'Enterprise Security', desc: 'JWT + RBAC + encrypted data + audit logging' },
];

export default function LandingPage() {
    const { user } = useAuth();

    const getDashboardLink = () => {
        if (!user) return '/login';
        return `/${user.role}/dashboard`;
    };

    return (
        <div className="min-h-screen bg-surface-950">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 glass border-b border-surface-800/30">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-white">AlumniConnect <span className="text-primary-400">AI</span></span>
                    </div>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <Link to={getDashboardLink()} className="btn-primary flex items-center gap-2">
                                Dashboard <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="btn-secondary text-sm">Sign In</Link>
                                <Link to="/register" className="btn-primary text-sm flex items-center gap-2">
                                    Get Started <ArrowRight className="w-4 h-4" />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative min-h-screen flex items-center justify-center gradient-hero overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl animate-pulse-slow" />
                    <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-600/5 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-20">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8">
                        <Sparkles className="w-4 h-4 text-primary-400" />
                        <span className="text-sm font-medium text-primary-400">Multi-Agent AI Platform</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
                        Alumni Intelligence
                        <br />
                        <span className="text-gradient">Reimagined with AI</span>
                    </h1>

                    <p className="text-lg md:text-xl text-surface-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                        6 AI agents collaborate to deliver explainable mentorship matching, career recommendations,
                        engagement prediction, and institutional analytics — all powered by cutting-edge ML.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
                        <Link to="/register" className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
                            <GraduationCap className="w-5 h-5" /> Get Started Free
                        </Link>
                        <a href="#features" className="btn-secondary text-lg px-8 py-3 flex items-center gap-2">
                            Explore Features <ChevronRight className="w-5 h-5" />
                        </a>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
                        {[
                            { value: '6', label: 'AI Agents' },
                            { value: '10K+', label: 'Alumni Profiles' },
                            { value: '94%', label: 'Match Accuracy' },
                            { value: 'XAI', label: 'Explainable AI' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl md:text-4xl font-black text-gradient">{stat.value}</div>
                                <div className="text-sm text-surface-400 mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI Agents */}
            <section id="features" className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-500/10 border border-accent-500/20 mb-4">
                            <Brain className="w-4 h-4 text-accent-400" />
                            <span className="text-sm font-medium text-accent-400">Multi-Agent Architecture</span>
                        </div>
                        <h2 className="text-4xl font-black text-white mb-4">6 AI Agents, One Platform</h2>
                        <p className="text-surface-400 max-w-2xl mx-auto">Each agent specializes in a domain, collaborating to deliver intelligent, personalized recommendations.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((f, i) => (
                            <div key={i} className="card group hover:border-primary-500/30 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <f.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                                <p className="text-sm text-surface-400 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Novel Features */}
            <section className="py-24 px-6 border-t border-surface-800/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-white mb-4">Research-Grade Innovations</h2>
                        <p className="text-surface-400 max-w-xl mx-auto">Novel features suitable for SIH, research publications, and industry showcase.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {novelFeatures.map((f, i) => (
                            <div key={i} className="card text-center hover:border-accent-500/30">
                                <div className="w-14 h-14 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-4">
                                    <f.icon className="w-7 h-7 text-accent-400" />
                                </div>
                                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                                <p className="text-sm text-surface-400">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="card gradient-primary p-12 border-none relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                                Ready to Transform Alumni Engagement?
                            </h2>
                            <p className="text-white/80 mb-8 max-w-lg mx-auto">
                                Join the AI-powered platform that connects alumni, students, and institutions intelligently.
                            </p>
                            <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary-700 rounded-xl font-bold hover:bg-surface-100 transition-all shadow-lg">
                                Start Now <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-surface-800/30 py-8 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary-400" />
                        <span className="text-sm font-semibold text-surface-300">AlumniConnect AI</span>
                    </div>
                    <p className="text-xs text-surface-500">© 2026 AlumniConnect AI. Multi-Agent Alumni Intelligence Platform.</p>
                </div>
            </footer>
        </div>
    );
}
