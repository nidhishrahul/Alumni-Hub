import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, Clock, ExternalLink, Lock, MapPin, Trophy, Users } from 'lucide-react';
import api from '../../services/api';

const readOptions = (value) => {
    try {
        const parsed = JSON.parse(value || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const readFinalVenue = (value) => {
    try {
        return JSON.parse(value || 'null');
    } catch {
        return null;
    }
};

export default function VenueVotingTab({ reunion, user, onReunionUpdate }) {
    const [votes, setVotes] = useState({ voteCounts: [], totalVotes: 0 });
    const [userVote, setUserVote] = useState(null);
    const [voting, setVoting] = useState(false);
    const [error, setError] = useState('');
    const [now, setNow] = useState(Date.now());

    const venueOptions = useMemo(
        () => readOptions(reunion.venueOptions),
        [reunion.venueOptions],
    );
    const finalVenue = useMemo(
        () => readFinalVenue(reunion.finalVenue),
        [reunion.finalVenue],
    );
    const deadlineTime = reunion.votingDeadline
        ? new Date(reunion.votingDeadline).getTime()
        : null;
    const isConfirmed = reunion.status === 'CONFIRMED';
    const votingOpen = !isConfirmed && (!deadlineTime || deadlineTime > now);

    const fetchVotes = useCallback(async () => {
        try {
            const response = await api.get('/api/reunions/' + reunion.id + '/venues/votes');
            setVotes(response.data);
        } catch (requestError) {
            setError(requestError.response?.data?.detail || 'Unable to load venue votes');
        }
    }, [reunion.id]);

    useEffect(() => {
        fetchVotes();
        const myVote = reunion.venueVotes?.find((vote) => vote.user?.id === user?.id);
        setUserVote(myVote?.chosenOptionIndex ?? null);
    }, [fetchVotes, reunion.venueVotes, user?.id]);

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(Date.now());
            if (deadlineTime && Date.now() >= deadlineTime && !isConfirmed) {
                onReunionUpdate();
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [deadlineTime, isConfirmed, onReunionUpdate]);

    const handleVote = async (optionIndex) => {
        if (!votingOpen || voting) return;
        setVoting(true);
        setError('');
        try {
            await api.post('/api/reunions/' + reunion.id + '/venues/vote', {
                chosenOptionIndex: optionIndex,
            });
            setUserVote(optionIndex);
            await fetchVotes();
        } catch (requestError) {
            setError(requestError.response?.data?.detail || 'Unable to save your vote');
        } finally {
            setVoting(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Venue preferences</h2>
                        <p className="text-sm text-surface-400">
                            {votingOpen ? 'Choose the venue your batch prefers' : 'Venue voting is closed'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-surface-700 bg-surface-800/50 px-3 py-2 text-xs text-surface-300">
                    {votingOpen ? <Clock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5" />}
                    {reunion.votingDeadline
                        ? 'Closes ' + new Date(reunion.votingDeadline).toLocaleString('en-IN')
                        : 'No deadline configured'}
                </div>
            </div>

            <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-surface-800/30 border border-surface-700/30">
                <Users className="w-4 h-4 text-surface-400" />
                <span className="text-sm text-surface-300">
                    <span className="font-semibold text-white">{votes.totalVotes}</span> verified batch vote{votes.totalVotes === 1 ? '' : 's'}
                </span>
            </div>

            {error && (
                <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            <div className="grid gap-4">
                {venueOptions.map((venue, index) => {
                    const count = votes.voteCounts.find((item) => item.optionIndex === index)?.count || 0;
                    const percentage = votes.totalVotes
                        ? Math.round((count / votes.totalVotes) * 100)
                        : 0;
                    const isMyVote = userVote === index;
                    const isWinner = isConfirmed && finalVenue &&
                        finalVenue.name === venue.name && finalVenue.address === venue.address;

                    return (
                        <div
                            key={venue.name + index}
                            className={'relative rounded-2xl border p-5 transition-all ' +
                                (isWinner
                                    ? 'border-green-500/40 bg-green-500/5'
                                    : isMyVote
                                        ? 'border-purple-500/40 bg-purple-500/5'
                                        : 'border-surface-700/50 bg-surface-800/30')}
                        >
                            {isWinner && (
                                <span className="absolute -top-3 right-4 flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
                                    <Trophy className="w-3 h-3" /> Final venue
                                </span>
                            )}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className={isWinner ? 'font-semibold text-green-300' : 'font-semibold text-white'}>
                                        {venue.name}
                                    </p>
                                    <p className="text-sm text-surface-400 mt-1">{venue.address}</p>
                                    {venue.mapLink && (
                                        <a
                                            href={venue.mapLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-2 inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                                        >
                                            <ExternalLink className="w-3 h-3" /> View map
                                        </a>
                                    )}
                                    <p className="text-xs text-surface-400 mt-2">{count} vote{count === 1 ? '' : 's'} · {percentage}%</p>
                                </div>
                                {votingOpen && (
                                    <button
                                        type="button"
                                        onClick={() => handleVote(index)}
                                        disabled={voting}
                                        className={isMyVote ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
                                    >
                                        {isMyVote
                                            ? <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Selected</span>
                                            : 'Vote for this venue'}
                                    </button>
                                )}
                            </div>
                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-700/50">
                                <div
                                    className={isWinner ? 'h-full bg-green-500' : 'h-full bg-purple-500'}
                                    style={{ width: percentage + '%' }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
