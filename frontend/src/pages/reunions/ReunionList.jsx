import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    PartyPopper, Plus, Calendar, MapPin, Users,
    Clock, CheckCircle, Vote, Eye, AlertCircle, Crown, Mail, Trash2, Loader2,
    Building2, GraduationCap
} from 'lucide-react';

import api from '../../services/api';

export default function ReunionList() {
    const { user } = useAuth();
    const [reunions, setReunions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    const canCreate = user?.role === 'ALUMNI' && user?.alumniProfile?.isVerified;

    useEffect(() => {
        fetchReunions();
        const refreshTimer = setInterval(fetchReunions, 10000);
        const refreshOnFocus = () => fetchReunions();
        window.addEventListener('focus', refreshOnFocus);

        return () => {
            clearInterval(refreshTimer);
            window.removeEventListener('focus', refreshOnFocus);
        };
    }, []);

    const fetchReunions = async () => {
        try {
            const res = await api.get('/api/reunions');
            setReunions(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setError(err.response?.data?.detail || 'Unable to load your batch reunions');
            setReunions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (reunion) => {
        const isOrganizer = Number(reunion.organizer?.id) === Number(user?.id);
        if (!isOrganizer || deletingId) return;

        const confirmed = window.confirm(
            `Delete "${reunion.title}"? This permanently removes its votes, attendance, expenses, photos, and announcements.`
        );
        if (!confirmed) return;

        setDeletingId(reunion.id);
        setError('');
        try {
            await api.delete(`/api/reunions/${reunion.id}`);
            setReunions((items) => items.filter((item) => item.id !== reunion.id));
        } catch (requestError) {
            setError(requestError.response?.data?.detail || 'Unable to delete the reunion');
        } finally {
            setDeletingId(null);
        }
    };

    const getStatusDisplay = (reunion) => {
        switch (reunion.status) {
            case 'PLANNING':
            case 'DATE_VOTING':
            case 'VENUE_VOTING':
            case 'VOTING':
                return {
                    label: 'Date & Venue Voting Open',
                    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                    icon: Vote
                };
            case 'CONFIRMED':
                return {
                    label: 'Confirmed',
                    color: 'text-green-400 bg-green-500/10 border-green-500/20',
                    icon: CheckCircle
                };
            default:
                return {
                    label: 'Planning',
                    color: 'text-surface-400 bg-surface-500/10 border-surface-500/20',
                    icon: Clock
                };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-surface-400 text-sm font-medium">Loading reunions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-950 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                            <PartyPopper className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white">Batch Reunions</h1>
                            <p className="text-surface-400">
                                Reunions shared with verified alumni from your graduation year
                            </p>
                        </div>
                    </div>

                    {canCreate && (
                        <Link to="/reunions/new" className="btn-primary flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Create Reunion
                        </Link>
                    )}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 mb-8">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
                            <div>
                                <h3 className="text-red-400 font-medium">Error Loading Reunions</h3>
                                <p className="text-red-400/80 text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Batch Info */}
                {user && (
                    <div className="card mb-8 bg-gradient-to-r from-primary-600/10 to-accent-600/10 border-primary-500/20">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-primary-500/20 flex items-center justify-center">
                                <Users className="w-8 h-8 text-primary-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Your Reunion Batch</h3>
                                <p className="text-surface-300">
                                    {user.role === 'ALUMNI' ? (
                                        <>
                                            Class of {user.alumniProfile?.graduationYear} · All verified departments
                                            {canCreate && (
                                                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-accent-500/20 text-accent-400">
                                                    Verified alumni
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {user.studentProfile?.department} • Expected Class of {new Date().getFullYear() + (4 - (user.studentProfile?.year || 1))}
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reunions List */}
                {reunions.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-surface-800/50 flex items-center justify-center mx-auto mb-6">
                            <PartyPopper className="w-8 h-8 text-surface-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Reunions Yet</h3>
                        <p className="text-surface-400 mb-6 max-w-md mx-auto">
                            {canCreate
                                ? "You haven't organized any reunions yet. Create the first one for your batch!"
                                : "No reunions have been organized for your batch yet. Stay tuned!"}
                        </p>
                        {canCreate && (
                            <Link to="/reunions/new" className="btn-primary inline-flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Create First Reunion
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {reunions.map((reunion) => {
                            const status = getStatusDisplay(reunion);
                            const StatusIcon = status.icon;
                            const isOrganizer = Number(reunion.organizer?.id) === Number(user?.id);

                            return (
                                <div key={reunion.id} className="card hover:border-primary-500/30 transition-all duration-300 group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                                                    <PartyPopper className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors">
                                                        {reunion.title}
                                                    </h3>
                                                    <p className="text-surface-400 text-sm mt-1 line-clamp-2">
                                                        {reunion.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                {/* Status */}
                                                <div className="flex items-center gap-2">
                                                    <StatusIcon className="w-4 h-4 text-current shrink-0" />
                                                    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 text-surface-300">
                                                    {reunion.audienceType === 'WHOLE_BATCH'
                                                        ? <GraduationCap className="h-4 w-4 shrink-0 text-accent-400" />
                                                        : <Building2 className="h-4 w-4 shrink-0 text-primary-400" />}
                                                    <span className="text-sm font-medium">
                                                        {reunion.audienceType === 'WHOLE_BATCH'
                                                            ? 'Whole batch'
                                                            : `${reunion.targetDepartment} only`}
                                                    </span>
                                                </div>

                                                {!reunion.finalizedAt && reunion.votingDeadline && (
                                                    <div className="flex items-center gap-2 text-surface-300">
                                                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                                                        <span className="text-sm font-medium">
                                                            Voting closes {new Date(reunion.votingDeadline).toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Final Date */}
                                                {reunion.finalDate && (
                                                    <div className="flex items-center gap-2 text-surface-300">
                                                        <Calendar className="w-4 h-4 text-green-400 shrink-0" />
                                                        <span className="text-sm font-medium">
                                                            {formatDate(reunion.finalDate)}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Final Venue */}
                                                {reunion.finalVenue && (
                                                    <div className="flex items-center gap-2 text-surface-300">
                                                        <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                                                        <span className="text-sm font-medium">
                                                            {JSON.parse(reunion.finalVenue).name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Stats */}
                                            <div className="flex items-center gap-6 text-xs text-surface-500">
                                                <span>{reunion._count.dateVotes} date votes</span>
                                                <span>{reunion._count.venueVotes} venue votes</span>
                                                <span>{reunion._count.attendance} responses</span>
                                                <span>{reunion._count.photos} photos</span>
                                                <span>{reunion._count.expenses} expenses</span>
                                            </div>

                                            {reunion.organizer && (
                                                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-surface-700/40 pt-4 text-sm">
                                                    <span className="flex items-center gap-1.5 font-medium text-surface-300">
                                                        <Crown className="h-4 w-4 text-amber-400" />
                                                        Organizer: {reunion.organizer.name}
                                                    </span>
                                                    <a
                                                        href={`mailto:${reunion.organizer.email}`}
                                                        className="flex items-center gap-1.5 text-primary-400 hover:text-primary-300"
                                                    >
                                                        <Mail className="h-4 w-4" />
                                                        {reunion.organizer.email}
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 ml-4">
                                            {isOrganizer && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(reunion)}
                                                    disabled={deletingId === reunion.id}
                                                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 transition-colors hover:border-red-400 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50"
                                                    aria-label={`Delete ${reunion.title}`}
                                                    title="Delete reunion"
                                                >
                                                    {deletingId === reunion.id
                                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                                        : <Trash2 className="h-4 w-4" />}
                                                </button>
                                            )}
                                            <Link
                                                to={`/reunions/${reunion.id}`}
                                                className="btn-secondary flex items-center gap-2 text-sm"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Hub
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
}
