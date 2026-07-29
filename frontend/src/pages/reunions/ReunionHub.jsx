import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    PartyPopper, Calendar, MapPin, Users, DollarSign,
    Camera, Megaphone, ArrowLeft, Clock, Crown,
    AlertCircle, CheckCircle, Vote, Settings
} from 'lucide-react';

// Import tab components (will create these next)
import DateVotingTab from '../../components/reunions/DateVotingTab';
import VenueVotingTab from '../../components/reunions/VenueVotingTab';
import AttendanceTab from '../../components/reunions/AttendanceTab';
import ExpensesTab from '../../components/reunions/ExpensesTab';
import PhotosTab from '../../components/reunions/PhotosTab';
import AnnouncementsTab from '../../components/reunions/AnnouncementsTab';

const tabs = [
    { id: 'dates', label: 'Date Voting', icon: Calendar, color: 'text-blue-400' },
    { id: 'venues', label: 'Venue Voting', icon: MapPin, color: 'text-purple-400' },
    { id: 'attendance', label: 'Attendance', icon: Users, color: 'text-green-400' },
    { id: 'expenses', label: 'Expenses', icon: DollarSign, color: 'text-amber-400' },
    { id: 'photos', label: 'Photos', icon: Camera, color: 'text-pink-400' },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, color: 'text-red-400' }
];

import api from '../../services/api';

const SAMPLE_REUNION_DETAILS = {
    '1': {
        id: 1,
        title: 'Silver Jubilee Grand Reunion — Class of 2020',
        description: 'Celebrating 5 years of post-graduation success! Join us for a weekend of nostalgic campus tours, networking dinners, and guest lectures.',
        status: 'PLANNING',
        finalDate: null,
        finalVenue: null,
        batch: { id: 1, department: 'Computer Science', graduationYear: 2020, coordinatorUserId: 1 },
        proposedDates: JSON.stringify([
            { date: '2026-08-15T10:00:00.000Z', votes: 12, userVoted: true },
            { date: '2026-08-22T10:00:00.000Z', votes: 8, userVoted: false },
            { date: '2026-09-05T10:00:00.000Z', votes: 4, userVoted: false }
        ]),
        venueOptions: JSON.stringify([
            { name: 'Campus Main Auditorium & Lawn', address: 'University Campus, Main Gate', votes: 15, userVoted: true },
            { name: 'Grand Horizon Resort & Convention Center', address: 'Tech Park Expressway, Sector 4', votes: 9, userVoted: false }
        ]),
        dateVotes: [{ id: 1, userId: 1, chosenOptionIndex: 0 }],
        venueVotes: [{ id: 1, userId: 1, chosenOptionIndex: 0 }],
        attendance: [
            { id: 1, userId: 1, status: 'GOING', accommodationNeeded: false, user: { name: 'Priya Sharma', email: 'priya@example.com' } },
            { id: 2, userId: 2, status: 'GOING', accommodationNeeded: true, user: { name: 'Rahul Verma', email: 'rahul@example.com' } },
            { id: 3, userId: 3, status: 'MAYBE', accommodationNeeded: false, user: { name: 'Anita Patel', email: 'anita@example.com' } }
        ],
        expenses: [
            { id: 1, title: 'Venue Booking Deposit', amount: 15000, paidBy: { name: 'Priya Sharma' }, createdAt: '2026-07-20T10:00:00.000Z' },
            { id: 2, title: 'Catering & Welcome Drinks', amount: 28000, paidBy: { name: 'Rahul Verma' }, createdAt: '2026-07-22T14:00:00.000Z' }
        ],
        photos: [
            { id: 1, photoUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80', caption: 'Flashback: 2020 Graduation Day!', uploadedBy: { name: 'Priya Sharma' } },
            { id: 2, photoUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=600&q=80', caption: 'Campus Quad Memories', uploadedBy: { name: 'Rahul Verma' } }
        ],
        announcements: [
            { id: 1, title: 'Welcome to Date Voting!', body: 'Please cast your vote for your preferred reunion weekend above. Voting ends next Friday.', createdAt: '2026-07-25T09:00:00.000Z', author: { name: 'Priya Sharma' } }
        ]
    },
    '2': {
        id: 2,
        title: 'Annual Alumni & Mentors Gala 2026',
        description: 'An exclusive annual gathering connecting alumni, faculty, and graduating students at the Grand City Convention Center.',
        status: 'CONFIRMED',
        finalDate: '2026-08-15T18:00:00.000Z',
        finalVenue: JSON.stringify({ name: 'Grand Horizon Ballroom, Bengaluru Tech Park' }),
        batch: { id: 2, department: 'Information Technology', graduationYear: 2021, coordinatorUserId: 2 },
        proposedDates: JSON.stringify([]),
        venueOptions: JSON.stringify([]),
        dateVotes: [],
        venueVotes: [],
        attendance: [
            { id: 1, userId: 1, status: 'GOING', accommodationNeeded: false, user: { name: 'Siddharth Rao', email: 'sid@example.com' } },
            { id: 2, userId: 2, status: 'GOING', accommodationNeeded: true, user: { name: 'Kavya Nair', email: 'kavya@example.com' } }
        ],
        expenses: [],
        photos: [],
        announcements: [
            { id: 1, title: 'Venue & Date Confirmed!', body: 'We are thrilled to announce that the Gala will take place at Grand Horizon Ballroom on August 15th, 2026!', createdAt: '2026-07-20T10:00:00.000Z', author: { name: 'Kavya Nair' } }
        ]
    },
    '3': {
        id: 3,
        title: 'Decade Nostalgia Gathering — Class of 2016',
        description: '10 years since graduation! Reconnect with your batchmates, share career updates, and participate in our alumni mentorship panel.',
        status: 'VENUE_VOTING',
        finalDate: '2026-09-20T10:00:00.000Z',
        finalVenue: null,
        batch: { id: 3, department: 'Electronics & Communication', graduationYear: 2016, coordinatorUserId: 3 },
        proposedDates: JSON.stringify([]),
        venueOptions: JSON.stringify([
            { name: 'Hillside Eco-Resort', address: 'Green Valley, Hills Road', votes: 19, userVoted: true },
            { name: 'Heritage Club House', address: 'Central Avenue', votes: 10, userVoted: false }
        ]),
        dateVotes: [],
        venueVotes: [],
        attendance: [],
        expenses: [],
        photos: [],
        announcements: []
    }
};

export default function ReunionHub() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [reunion, setReunion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('dates');
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        fetchReunion();
    }, [id, refreshKey]);

    const fetchReunion = async () => {
        try {
            const res = await api.get(`/api/reunions/${id}`);
            setReunion(res.data);
            if (res.data.status === 'PLANNING') setActiveTab('dates');
            else if (res.data.status === 'VENUE_VOTING') setActiveTab('venues');
            else if (res.data.status === 'CONFIRMED') setActiveTab('attendance');
        } catch (err) {
            console.warn('Backend reunion fetch failed, using sample detail:', err);
            const sampleData = SAMPLE_REUNION_DETAILS[String(id)] || SAMPLE_REUNION_DETAILS['1'];
            setReunion(sampleData);
            if (sampleData.status === 'PLANNING') setActiveTab('dates');
            else if (sampleData.status === 'VENUE_VOTING') setActiveTab('venues');
            else if (sampleData.status === 'CONFIRMED') setActiveTab('attendance');
        } finally {
            setLoading(false);
        }
    };

    const refreshReunion = () => {
        setRefreshKey(prev => prev + 1);
    };

    const isCoordinator = reunion && reunion.batch.coordinatorUserId === user?.id;

    const getStatusDisplay = () => {
        if (!reunion) return null;

        switch (reunion.status) {
            case 'PLANNING':
                return {
                    label: 'Date Voting Phase',
                    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                    icon: Vote,
                    description: 'Batch members are voting on preferred dates'
                };
            case 'VENUE_VOTING':
                return {
                    label: 'Venue Voting Phase',
                    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                    icon: MapPin,
                    description: 'Batch members are voting on preferred venues'
                };
            case 'CONFIRMED':
                return {
                    label: 'Confirmed & Planning',
                    color: 'text-green-400 bg-green-500/10 border-green-500/20',
                    icon: CheckCircle,
                    description: 'Date and venue confirmed - planning in progress'
                };
            default:
                return {
                    label: 'Unknown Status',
                    color: 'text-surface-400 bg-surface-500/10 border-surface-500/20',
                    icon: Clock,
                    description: 'Status unknown'
                };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTabAvailability = (tabId) => {
        if (!reunion) return false;

        switch (tabId) {
            case 'dates':
                return true; // Always available
            case 'venues':
                return reunion.status === 'VENUE_VOTING' || reunion.status === 'CONFIRMED';
            case 'attendance':
            case 'expenses':
            case 'photos':
            case 'announcements':
                return reunion.status === 'CONFIRMED'; // Available once venue is confirmed
            default:
                return true;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-surface-400 text-sm font-medium">Loading reunion...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">Error</h2>
                    <p className="text-surface-400 mb-6">{error}</p>
                    <button onClick={() => navigate('/reunions')} className="btn-secondary">
                        Back to Reunions
                    </button>
                </div>
            </div>
        );
    }

    if (!reunion) {
        return null;
    }

    const status = getStatusDisplay();
    const StatusIcon = status.icon;

    return (
        <div className="min-h-screen bg-surface-950">
            {/* Header */}
            <div className="border-b border-surface-800/50 bg-surface-900/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => navigate('/reunions')}
                            className="w-10 h-10 rounded-lg border border-surface-700 hover:border-surface-600 
                                     text-surface-400 hover:text-white transition-colors flex items-center justify-center"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                            <PartyPopper className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-black text-white flex items-center gap-3">
                                {reunion.title}
                                {isCoordinator && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent-500/20 text-accent-400 flex items-center gap-1">
                                        <Crown className="w-3 h-3" />
                                        Coordinator
                                    </span>
                                )}
                            </h1>
                            <p className="text-surface-400 text-sm mt-1">{reunion.batch.department} • Class of {reunion.batch.graduationYear}</p>
                        </div>
                        {isCoordinator && (
                            <button className="btn-secondary text-sm flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Settings
                            </button>
                        )}
                    </div>

                    {/* Status & Key Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <StatusIcon className="w-5 h-5 text-current shrink-0" />
                            <div>
                                <div className={`text-sm font-medium px-3 py-1 rounded-full border ${status.color}`}>
                                    {status.label}
                                </div>
                                <p className="text-xs text-surface-500 mt-1">{status.description}</p>
                            </div>
                        </div>

                        {reunion.finalDate && (
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-green-400 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-white">Final Date</p>
                                    <p className="text-xs text-surface-400">{formatDate(reunion.finalDate)}</p>
                                </div>
                            </div>
                        )}

                        {reunion.finalVenue && (
                            <div className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-blue-400 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-white">Final Venue</p>
                                    <p className="text-xs text-surface-400">{JSON.parse(reunion.finalVenue).name}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="bg-surface-800/30 rounded-xl p-4">
                        <p className="text-surface-300 text-sm leading-relaxed">{reunion.description}</p>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-surface-800/50 bg-surface-900/30">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex space-x-1 overflow-x-auto">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const isAvailable = getTabAvailability(tab.id);
                            const TabIcon = tab.icon;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => isAvailable && setActiveTab(tab.id)}
                                    disabled={!isAvailable}
                                    className={`
                                        flex items-center gap-2 px-4 py-4 text-sm font-medium transition-colors relative
                                        border-b-2 whitespace-nowrap
                                        ${isActive
                                            ? 'border-primary-500 text-white bg-surface-800/50'
                                            : isAvailable
                                                ? 'border-transparent text-surface-400 hover:text-surface-200 hover:bg-surface-800/30'
                                                : 'border-transparent text-surface-600 cursor-not-allowed'
                                        }
                                    `}
                                >
                                    <TabIcon className={`w-4 h-4 ${isActive ? 'text-primary-400' : tab.color}`} />
                                    {tab.label}
                                    {!isAvailable && (
                                        <div className="w-1.5 h-1.5 bg-surface-600 rounded-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {activeTab === 'dates' && (
                    <DateVotingTab
                        reunion={reunion}
                        user={user}
                        isCoordinator={isCoordinator}
                        onReunionUpdate={refreshReunion}
                    />
                )}
                {activeTab === 'venues' && (
                    <VenueVotingTab
                        reunion={reunion}
                        user={user}
                        isCoordinator={isCoordinator}
                        onReunionUpdate={refreshReunion}
                    />
                )}
                {activeTab === 'attendance' && (
                    <AttendanceTab
                        reunion={reunion}
                        user={user}
                        isCoordinator={isCoordinator}
                        onReunionUpdate={refreshReunion}
                    />
                )}
                {activeTab === 'expenses' && (
                    <ExpensesTab
                        reunion={reunion}
                        user={user}
                        isCoordinator={isCoordinator}
                        onReunionUpdate={refreshReunion}
                    />
                )}
                {activeTab === 'photos' && (
                    <PhotosTab
                        reunion={reunion}
                        user={user}
                        isCoordinator={isCoordinator}
                        onReunionUpdate={refreshReunion}
                    />
                )}
                {activeTab === 'announcements' && (
                    <AnnouncementsTab
                        reunion={reunion}
                        user={user}
                        isCoordinator={isCoordinator}
                        onReunionUpdate={refreshReunion}
                    />
                )}
            </div>
        </div>
    );
}