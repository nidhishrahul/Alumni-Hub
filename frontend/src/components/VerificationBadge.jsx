/**
 * VerificationBadge — displays the AI verification status badge
 * for an alumni profile, with interactive click handler to trigger verification modal.
 */
import { ShieldCheck, ShieldAlert, ShieldX, Clock, Loader2, Sparkles } from 'lucide-react';

const STATUS_CONFIG = {
    VERIFIED_LOW_RISK: {
        label: 'Fully Verified — Low Risk',
        icon: ShieldCheck,
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        glow: 'shadow-emerald-500/10',
    },
    VERIFIED_BY_ADMIN: {
        label: 'Verified by Admin',
        icon: ShieldCheck,
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        glow: 'shadow-blue-500/10',
    },
    PENDING_ADMIN_REVIEW: {
        label: 'Pending Admin Review',
        icon: Clock,
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        glow: 'shadow-amber-500/10',
    },
    REJECTED_HIGH_RISK: {
        label: 'Rejected — High Risk',
        icon: ShieldX,
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        text: 'text-red-400',
        glow: 'shadow-red-500/10',
    },
    REJECTED_BY_ADMIN: {
        label: 'Rejected by Admin',
        icon: ShieldAlert,
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        text: 'text-red-400',
        glow: 'shadow-red-500/10',
    },
    PENDING: {
        label: 'Click to Verify Profile',
        icon: Sparkles,
        bg: 'bg-primary-500/10',
        border: 'border-primary-500/30',
        text: 'text-primary-400',
        glow: 'shadow-primary-500/10',
    },
};

export default function VerificationBadge({ status, riskScore, compact = false, onClick }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    const Icon = config.icon;
    const isAnimated = status === 'PENDING';
    const isClickable = typeof onClick === 'function';

    if (compact) {
        return (
            <button
                type="button"
                onClick={onClick}
                disabled={!isClickable}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                    ${config.bg} ${config.border} ${config.text} border backdrop-blur-sm transition-all
                    ${isClickable ? 'cursor-pointer hover:scale-105 hover:shadow-md' : 'cursor-default'}`}
            >
                <Icon className={`w-3.5 h-3.5 ${isAnimated ? 'animate-pulse' : ''}`} />
                {config.label}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!isClickable}
            className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border backdrop-blur-sm
                ${config.bg} ${config.border} ${config.glow} shadow-lg transition-all duration-300
                ${isClickable ? 'cursor-pointer hover:scale-[1.03] active:scale-95' : 'cursor-default'}`}
        >
            <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${config.text} ${isAnimated ? 'animate-pulse' : ''}`} />
            </div>
            <div className="text-left">
                <p className={`text-sm font-bold ${config.text} flex items-center gap-1.5`}>
                    {config.label}
                    {isClickable && status === 'PENDING' && (
                        <span className="text-[10px] font-normal underline text-primary-300">Click to start</span>
                    )}
                </p>
                {riskScore !== null && riskScore !== undefined && (
                    <p className="text-[10px] text-surface-500">
                        Risk Score: {riskScore.toFixed(1)}/100
                    </p>
                )}
            </div>
        </button>
    );
}
