import { useState, useEffect } from 'react';
import { MapPin, Vote, CheckCircle, ExternalLink, Lock, Trophy, Users } from 'lucide-react';

export default function VenueVotingTab({ reunion, user, isCoordinator, onReunionUpdate }) {
    const [votes, setVotes] = useState({ voteCounts: [], totalVotes: 0 });
    const [userVote, setUserVote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [finalizing, setFinalizing] = useState(false);

    const venueOptions = JSON.parse(reunion.venueOptions || '[]');
    const isLocked = reunion.status !== 'VENUE_VOTING';
    const isConfirmed = reunion.status === 'CONFIRMED';

    useEffect(() => {
        fetchVotes();
        const myVote = reunion.venueVotes?.find(v => v.user?.id === user?.id);
        if (myVote) setUserVote(myVote.chosenOptionIndex);
    }, [reunion]);

    const fetchVotes = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3001/api/reunions/${reunion.id}/venues/votes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setVotes(await res.json());
        } catch (err) {
            console.error('Fetch venue votes error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (optionIndex) => {
        if (isLocked || voting) return;
        setVoting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3001/api/reunions/${reunion.id}/venues/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ chosenOptionIndex: optionIndex })
            });
            if (res.ok) {
                setUserVote(optionIndex);
                await fetchVotes();
            }
        } catch (err) {
            console.error('Venue vote error:', err);
        } finally {
            setVoting(false);
        }
    };

    const handleFinalize = async (index) => {
        if (finalizing) return;
        setFinalizing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3001/api/reunions/${reunion.id}/venues/finalize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ winningVenueIndex: index })
            });
            if (res.ok) onReunionUpdate();
        } catch (err) {
            console.error('Finalize venue error:', err);
        } finally {
            setFinalizing(false);
        }
    };

    const getWinnerIndex = () => {
        if (!votes.voteCounts.length) return -1;
        let maxCount = 0, winnerIdx = 0;
        votes.voteCounts.forEach((vc, i) => {
            if (vc.count > maxCount) { maxCount = vc.count; winnerIdx = i; }
        });
        return winnerIdx;
    };

    const winnerIndex = getWinnerIndex();

    // If in PLANNING state, show a placeholder
    if (reunion.status === 'PLANNING') {
        return (
            <div className="animate-fade-in text-center py-16">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Venue Voting Locked</h3>
                <p className="text-surface-400 max-w-md mx-auto">
                    Venue voting will open once the reunion date has been finalized.
                    Complete date voting first!
                </p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Venue Voting</h2>
                        <p className="text-sm text-surface-400">
                            {isConfirmed ? 'Venue has been confirmed' : 'Vote for your preferred venue'}
                        </p>
                    </div>
                </div>
                {isConfirmed && (
                    <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Confirmed
                    </div>
                )}
            </div>

            {votes.totalVotes > 0 && (
                <div className="flex items-center gap-4 mb-6 p-3 rounded-xl bg-surface-800/30 border border-surface-700/30">
                    <Users className="w-4 h-4 text-surface-400" />
                    <span className="text-sm text-surface-300">
                        <span className="font-semibold text-white">{votes.totalVotes}</span> vote{votes.totalVotes !== 1 ? 's' : ''} cast
                    </span>
                </div>
            )}

            {/* Venue Cards */}
            <div className="grid gap-4">
                {venueOptions.map((venue, index) => {
                    const voteData = votes.voteCounts.find(v => v.optionIndex === index);
                    const count = voteData?.count || 0;
                    const percentage = votes.totalVotes > 0 ? Math.round((count / votes.totalVotes) * 100) : 0;
                    const isMyVote = userVote === index;
                    const isWinner = isConfirmed && index === winnerIndex && count > 0;

                    return (
                        <div
                            key={index}
                            className={`
                                relative rounded-2xl border p-5 transition-all duration-300
                                ${isWinner
                                    ? 'border-green-500/40 bg-green-500/5 shadow-lg shadow-green-500/10'
                                    : isMyVote
                                        ? 'border-purple-500/40 bg-purple-500/5'
                                        : 'border-surface-700/50 bg-surface-800/30 hover:border-surface-600/50'}
                            `}
                        >
                            {isWinner && (
                                <div className="absolute -top-3 right-4 flex items-center gap-1.5 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                    <Trophy className="w-3 h-3" />
                                    Confirmed
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-3 flex-1">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5
                                        ${isWinner ? 'bg-green-500/20 text-green-400' : 'bg-surface-700/50 text-surface-300'}`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-semibold ${isWinner ? 'text-green-300' : 'text-white'}`}>
                                            {venue.name}
                                        </p>
                                        <p className="text-sm text-surface-400 mt-0.5">{venue.address}</p>
                                        {venue.mapLink && (
                                            <a
                                                href={venue.mapLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 mt-2 transition-colors"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                View on Map
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 ml-4">
                                    <span className="text-sm font-medium text-surface-300">
                                        {count} vote{count !== 1 ? 's' : ''}
                                    </span>
                                    {!isLocked && (
                                        <button
                                            onClick={() => handleVote(index)}
                                            disabled={voting}
                                            className={`
                                                px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                                                ${isMyVote
                                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                                                    : 'border border-surface-600 text-surface-300 hover:border-purple-500 hover:text-purple-400'}
                                            `}
                                        >
                                            {isMyVote ? (
                                                <span className="flex items-center gap-1.5">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Voted
                                                </span>
                                            ) : 'Vote'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative h-2 bg-surface-700/50 rounded-full overflow-hidden">
                                <div
                                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out
                                        ${isWinner ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-purple-600 to-purple-400'}`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-2">
                                <span className="text-xs text-surface-500">{percentage}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Coordinator Finalize */}
            {isCoordinator && !isLocked && votes.totalVotes > 0 && (
                <div className="mt-8 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                    <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                        <Vote className="w-4 h-4" />
                        Close Voting & Confirm Venue
                    </h3>
                    <p className="text-xs text-surface-400 mb-4">
                        Select the winning venue to confirm the reunion details. This will move the reunion to Confirmed status.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {venueOptions.map((venue, index) => {
                            const voteData = votes.voteCounts.find(v => v.optionIndex === index);
                            const count = voteData?.count || 0;
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleFinalize(index)}
                                    disabled={finalizing}
                                    className="px-4 py-2 rounded-xl text-xs font-medium border border-amber-500/30 text-amber-300 
                                             hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                                >
                                    {venue.name} ({count} votes)
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}