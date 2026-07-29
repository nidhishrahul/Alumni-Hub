import { useState, useEffect } from 'react';
import { PartyPopper, Clock, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReunionCountdown({ reunion, variant = 'large' }) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const targetDate = reunion?.finalDate || reunion?.countdownTargetDate;
        if (!targetDate) return;

        const update = () => {
            const now = new Date();
            const target = new Date(targetDate);
            const diff = target - now;

            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / (1000 * 60)) % 60),
                seconds: Math.floor((diff / 1000) % 60)
            });
        };

        update();
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [reunion]);

    const targetDate = reunion?.finalDate || reunion?.countdownTargetDate;
    if (!targetDate) return null;

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });

    // Compact variant for dashboard
    if (variant === 'compact') {
        return (
            <Link to={`/reunions/${reunion.id}`}
                className="block rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-surface-900/50 to-amber-500/5 p-5 hover:border-orange-500/40 transition-all group relative overflow-hidden"
            >
                {/* Confetti dots */}
                <div className="absolute top-2 right-3 flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400/40 animate-pulse-slow" />
                    <span className="w-1 h-1 rounded-full bg-amber-400/30 animate-pulse-slow" style={{ animationDelay: '0.5s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400/30 animate-pulse-slow" style={{ animationDelay: '1s' }} />
                </div>

                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                        <PartyPopper className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate group-hover:text-orange-300 transition-colors">{reunion.title}</p>
                        <p className="text-[10px] text-surface-400">{formatDate(targetDate)}</p>
                    </div>
                </div>

                {isExpired ? (
                    <div className="text-center py-1">
                        <p className="text-sm font-bold text-orange-400">🎉 It's Reunion Day!</p>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        {[
                            { val: timeLeft.days, label: 'Days' },
                            { val: timeLeft.hours, label: 'Hrs' },
                            { val: timeLeft.minutes, label: 'Min' },
                        ].map((t, i) => (
                            <div key={i} className="flex-1 text-center rounded-lg bg-surface-800/60 border border-surface-700/40 py-2">
                                <p className="text-lg font-black text-orange-400">{String(t.val).padStart(2, '0')}</p>
                                <p className="text-[9px] text-surface-500 uppercase tracking-wider">{t.label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </Link>
        );
    }

    // Large variant for hub page
    return (
        <div className="relative rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-surface-900/80 to-amber-500/10 p-6 mb-8 overflow-hidden">
            {/* Confetti accent dots */}
            <div className="absolute top-4 right-6 flex gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400/50 animate-pulse-slow" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/40 animate-pulse-slow" style={{ animationDelay: '0.3s' }} />
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/30 animate-pulse-slow" style={{ animationDelay: '0.7s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/30 animate-pulse-slow" style={{ animationDelay: '1.1s' }} />
                <span className="w-2 h-2 rounded-full bg-orange-300/25 animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
            </div>
            <div className="absolute bottom-3 left-8 flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/20 animate-pulse-slow" style={{ animationDelay: '0.4s' }} />
                <span className="w-2 h-2 rounded-full bg-orange-300/20 animate-pulse-slow" style={{ animationDelay: '0.8s' }} />
                <span className="w-1 h-1 rounded-full bg-red-300/20 animate-pulse-slow" style={{ animationDelay: '1.2s' }} />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/20 flex items-center justify-center shrink-0">
                        <PartyPopper className="w-7 h-7 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white">
                            {isExpired ? '🎉 Reunion Day!' : 'Reunion Countdown'}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-surface-400">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-orange-400" />
                                {formatDate(targetDate)}
                            </span>
                            {reunion.finalVenue && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-orange-400" />
                                    {(() => { try { return JSON.parse(reunion.finalVenue).name; } catch { return reunion.finalVenue; } })()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {!isExpired && (
                    <div className="flex gap-3">
                        {[
                            { val: timeLeft.days, label: 'Days' },
                            { val: timeLeft.hours, label: 'Hours' },
                            { val: timeLeft.minutes, label: 'Min' },
                            { val: timeLeft.seconds, label: 'Sec' },
                        ].map((t, i) => (
                            <div key={i} className="text-center">
                                <div className="w-16 h-16 rounded-xl bg-surface-800/60 border border-orange-500/20 flex items-center justify-center mb-1 relative overflow-hidden">
                                    <span className="text-2xl font-black text-orange-400 tabular-nums">
                                        {String(t.val).padStart(2, '0')}
                                    </span>
                                </div>
                                <p className="text-[10px] text-surface-500 uppercase tracking-wider font-medium">{t.label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
