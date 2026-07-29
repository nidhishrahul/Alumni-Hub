import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    PartyPopper, Plus, Calendar, MapPin, Users,
    Clock, CheckCircle, Vote, Eye, AlertCircle
} from 'lucide-react';

import api from '../../services/api';

const SAMPLE_REUNIONS = [
    {
        id: 1,
        title: 'Silver Jubilee Grand Reunion — Class of 2020',
        description: 'Celebrating 5 years of post-graduation success! Join us for a weekend of nostalgic campus tours, networking dinners, and guest lectures.',
        status: 'PLANNING',
        finalDate: null,
        finalVenue: null,
        batch: { department: 'Computer Science', graduationYear: 2020, coordinatorUserId: 1 },
        _count: { dateVotes: 24, venueVotes: 18, attendance: 35, photos: 12, expenses: 4 }
    },
    {
        id: 2,
        title: 'Annual Alumni & Mentors Gala 2026',
        description: 'An exclusive annual gathering connecting alumni, faculty, and graduating students at the Grand City Convention Center.',
        status: 'CONFIRMED',
        finalDate: '2026-08-15T18:00:00.000Z',
        finalVenue: JSON.stringify({ name: 'Grand Horizon Ballroom, Bengaluru Tech Park' }),
        batch: { department: 'Information Technology', graduationYear: 2021, coordinatorUserId: 2 },
        _count: { dateVotes: 42, venueVotes: 38, attendance: 58, photos: 28, expenses: 9 }
    },
    {
        id: 3,
        title: 'Decade Nostalgia Gathering — Class of 2016',
        description: '10 years since graduation! Reconnect with your batchmates, share career updates, and participate in our alumni mentorship panel.',
        status: 'VENUE_VOTING',
        finalDate: '2026-09-20T10:00:00.000Z',
        finalVenue: null,
        batch: { department: 'Electronics & Communication', graduationYear: 2016, coordinatorUserId: 3 },
        _count: { dateVotes: 31, venueVotes: 29, attendance: 44, photos: 19, expenses: 6 }
    }
];

export default function ReunionList() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [reunions, setReunions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Check if user is a batch coordinator
    const isCoordinator = user?.role === 'ALUMNI' && user?.alumniProfile?.isVerified;

    useEffect(() => {
        fetchReunions();
    }, []);

    const fetchReunions = async () => {
        try {
            const res = await api.get('/api/reunions');
            if (Array.isArray(res.data) && res.data.length > 0) {
                setReunions(res.data);
            } else {
                setReunions(SAMPLE_REUNIONS);
            }
        } catch (err) {
            console.warn('Backend reunions request failed, showing sample reunions:', err);
            setReunions(SAMPLE_REUNIONS);
        } finally {
            setLoading(false);
        }
    };

    const getStatusDisplay = (reunion) => {
        switch (reunion.status) {
            case 'PLANNING':
                return {
                    label: 'Date Voting Open',
                    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                    icon: Vote
                };
            case 'VENUE_VOTING':
                return {
                    label: 'Venue Voting Open',
                    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                    icon: MapPin
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
                                {user?.role === 'ALUMNI' ? 'Reconnect with your graduating class' : 'Stay connected with your future alumni network'}
                            </p>
                        </div>
                    </div>

                    {isCoordinator && (
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
                                <h3 className="text-lg font-bold text-white">Your Batch</h3>
                                <p className="text-surface-300">
                                    {user.role === 'ALUMNI' ? (
                                        <>
                                            {user.alumniProfile?.department} • Class of {user.alumniProfile?.graduationYear}
                                            {isCoordinator && (
                                                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-accent-500/20 text-accent-400">
                                                    Coordinator
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
                            {isCoordinator
                                ? "You haven't organized any reunions yet. Create the first one for your batch!"
                                : "No reunions have been organized for your batch yet. Stay tuned!"}
                        </p>
                        {isCoordinator && (
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
                                        </div>

                                        <div className="flex items-center gap-3 ml-4">
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

                {/* Coordinator Info */}
                {!isCoordinator && user?.role === 'ALUMNI' && (
                    <div className="mt-12 text-center">
                        <div className="card bg-amber-500/5 border-amber-500/20">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                    <Users className="w-6 h-6 text-amber-400" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white">Want to be a Batch Coordinator?</h3>
                                    <p className="text-surface-400 text-sm">
                                        Batch coordinators can organize reunions for their graduating class. Contact an admin to request coordinator privileges.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}