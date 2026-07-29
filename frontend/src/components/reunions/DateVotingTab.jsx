import { useState, useEffect } from 'react';
import { Calendar, Vote, CheckCircle, Clock, Users, Lock, Trophy } from 'lucide-react';

export default function DateVotingTab({ reunion, user, isCoordinator, onReunionUpdate }) {
    const [votes, setVotes] = useState({ voteCounts: [], totalVotes: 0 });
    const [userVote, setUserVote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [finalizing, setFinalizing] = useState(false);

    const proposedDates = JSON.parse(reunion.proposedDates || '[]');
    const isLocked = reunion.status !== 'PLANNING';

    useEffect(() => {
        fetchVotes();
        // Find user's current vote
        const myVote = reunion.dateVotes?.find(v => v.user?.id === user?.id);
        if (myVote) setUserVote(myVote.chosenOptionIndex);
    }, [reunion]);

    const fetchVotes = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3001/api/reunions/${reunion.id}/dates/votes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setVotes(data);
            }
        } catch (err) {
            console.error('Fetch votes error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (optionIndex) => {
        if (isLocked || voting) return;
        setVoting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3001/api/reunions/${reunion.id}/dates/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ chosenOptionIndex: optionIndex })
            });
            if (res.ok) {
                setUserVote(optionIndex);
                await fetchVotes();
            }
        } catch (err) {
            console.error('Vote error:', err);
        } finally {
            setVoting(false);
        }
    };

    const handleFinalize = async (index) => {
        if (finalizing) return;
        setFinalizing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3001/api/reunions/${reunion.id}/dates/finalize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ winningDateIndex: index })
            });
            if (res.ok) {
                onReunionUpdate();
            }
        } catch (err) {
            console.error('Finalize error:', err);
        } finally {
            setFinalizing(false);
        }
    };

    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch { return dateStr; }
    };

    const getWinnerIndex = () => {
        if (!votes.voteCounts.length) return -1;
        let maxCount = 0;
        let winnerIdx = 0;
        votes.voteCounts.forEach((vc, i) => {
            if (vc.count > maxCount) { maxCount = vc.count; winnerIdx = i; }
        });
        return winnerIdx;
    };

    const winnerIndex = getWinnerIndex();

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Date Voting</h2>
                        <p className="text-sm text-surface-400">
                            {isLocked ? 'Voting is closed' : 'Vote for your preferred reunion date'}
                        </p>
                    </div>
                </div>
                {isLocked && (
                    <div className="flex items-center gap-2 text-sm text-surface-400 bg-surface-800/50 px-3 py-1.5 rounded-full">
                        <Lock className="w-3.5 h-3.5" />
                        Closed
                    </div>
                )}
            </div>

            {/* Vote Summary */}
            {votes.totalVotes > 0 && (
                <div className="flex items-center gap-4 mb-6 p-3 rounded-xl bg-surface-800/30 border border-surface-700/30">
                    <Users className="w-4 h-4 text-surface-400" />
                    <span className="text-sm text-surface-300">
                        <span className="font-semibold text-white">{votes.totalVotes}</span> vote{votes.totalVotes !== 1 ? 's' : ''} cast
                    </span>
                </div>
            )}

            {/* Date Cards */}
            <div className="grid gap-4">
                {proposedDates.map((date, index) => {
                    const voteData = votes.voteCounts.find(v => v.optionIndex === index);
                    const count = voteData?.count || 0;
                    const percentage = votes.totalVotes > 0 ? Math.round((count / votes.totalVotes) * 100) : 0;
                    const isMyVote = userVote === index;
                    const isWinner = isLocked && index === winnerIndex && count > 0;

                    return (
                        <div
                            key={index}
                            className={`
                                relative rounded-2xl border p-5 transition-all duration-300
                                ${isWinner
                                    ? 'border-green-500/40 bg-green-500/5 shadow-lg shadow-green-500/10'
                                    : isMyVote
                                        ? 'border-blue-500/40 bg-blue-500/5'
                                        : 'border-surface-700/50 bg-surface-800/30 hover:border-surface-600/50'}
                            `}
                        >
                            {isWinner && (
                                <div className="absolute -top-3 right-4 flex items-center gap-1.5 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                    <Trophy className="w-3 h-3" />
                                    Winner
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                                        ${isWinner ? 'bg-green-500/20 text-green-400' : 'bg-surface-700/50 text-surface-300'}`}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className={`font-semibold ${isWinner ? 'text-green-300' : 'text-white'}`}>
                                            {formatDate(date)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
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
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                                                    : 'border border-surface-600 text-surface-300 hover:border-blue-500 hover:text-blue-400'}
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
                                        ${isWinner ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`}
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
                        Close Voting & Finalize
                    </h3>
                    <p className="text-xs text-surface-400 mb-4">
                        Select the winning date to close voting and move to venue voting phase.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {proposedDates.map((date, index) => {
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
                                    {formatDate(date)} ({count} votes)
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}