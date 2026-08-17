import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    BedDouble,
    CheckCircle2,
    CircleHelp,
    CircleX,
    Save,
    UtensilsCrossed,
    Users,
} from 'lucide-react';
import api from '../../services/api';

const RSVP_OPTIONS = [
    {
        value: 'GOING',
        label: 'Going',
        description: 'Count me in for the reunion',
        icon: CheckCircle2,
        selected: 'border-green-500 bg-green-500/15 text-green-300',
        iconColor: 'text-green-400',
    },
    {
        value: 'MAYBE',
        label: 'Maybe',
        description: 'Decide within two days',
        icon: CircleHelp,
        selected: 'border-amber-500 bg-amber-500/15 text-amber-300',
        iconColor: 'text-amber-400',
    },
    {
        value: 'NOT_GOING',
        label: 'Not interested',
        description: 'I will not attend this reunion',
        icon: CircleX,
        selected: 'border-red-500 bg-red-500/15 text-red-300',
        iconColor: 'text-red-400',
    },
];

const STATUS_STYLES = {
    GOING: 'bg-green-500/15 text-green-300 border-green-500/30',
    MAYBE: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    NOT_GOING: 'bg-red-500/15 text-red-300 border-red-500/30',
};

export default function AttendanceTab({ reunion, user, isOrganizer, onReunionUpdate }) {
    const [myStatus, setMyStatus] = useState('');
    const [accommodationNeeded, setAccommodationNeeded] = useState(false);
    const [dietaryNotes, setDietaryNotes] = useState('');
    const [maybeDeadline, setMaybeDeadline] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [organizerAttendance, setOrganizerAttendance] = useState([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [summary, setSummary] = useState({
        going: 0,
        maybe: 0,
        notGoing: 0,
        accommodationNeeded: 0,
        totalResponses: 0,
        eligibleAlumni: 0,
        responseRate: 0,
        potentialAttendees: 0,
    });

    const fetchSummary = useCallback(async () => {
        try {
            const response = await api.get('/api/reunions/' + reunion.id + '/attendance/summary');
            setSummary(response.data);
        } catch (requestError) {
            setError(requestError.response?.data?.detail || 'Unable to load attendance summary');
        }
    }, [reunion.id]);

    const fetchOrganizerAttendance = useCallback(async () => {
        if (!isOrganizer) {
            setOrganizerAttendance([]);
            return;
        }

        setDetailsLoading(true);
        try {
            const response = await api.get(
                '/api/reunions/' + reunion.id + '/attendance/details'
            );
            setOrganizerAttendance(Array.isArray(response.data) ? response.data : []);
        } catch (requestError) {
            setError(requestError.response?.data?.detail || 'Unable to load batchmate attendance notes');
            setOrganizerAttendance([]);
        } finally {
            setDetailsLoading(false);
        }
    }, [isOrganizer, reunion.id]);

    useEffect(() => {
        const myAttendance = reunion.attendance?.find((attendance) => attendance.user?.id === user?.id);
        setMyStatus(myAttendance?.status || '');
        setAccommodationNeeded(Boolean(myAttendance?.accommodationNeeded));
        setDietaryNotes(myAttendance?.dietaryNotes || '');
        setMaybeDeadline(myAttendance?.maybeDeadline || null);
        fetchSummary();
        fetchOrganizerAttendance();
    }, [fetchOrganizerAttendance, fetchSummary, reunion.attendance, user?.id]);

    useEffect(() => {
        if (myStatus !== 'MAYBE' || !maybeDeadline) return undefined;

        const remainingMilliseconds = new Date(maybeDeadline).getTime() - Date.now();
        const refreshExpiredMaybe = async () => {
            await fetchSummary();
            onReunionUpdate();
        };

        if (remainingMilliseconds <= 0) {
            refreshExpiredMaybe();
            return undefined;
        }

        const timeoutId = window.setTimeout(
            refreshExpiredMaybe,
            Math.min(remainingMilliseconds + 250, 2147483647)
        );
        return () => window.clearTimeout(timeoutId);
    }, [fetchSummary, maybeDeadline, myStatus, onReunionUpdate]);

    const sortedAttendance = useMemo(() => {
        const order = { GOING: 0, MAYBE: 1, NOT_GOING: 2 };
        return [...organizerAttendance].sort((left, right) =>
            (order[left.status] ?? 3) - (order[right.status] ?? 3)
        );
    }, [organizerAttendance]);

    const persistAttendance = async (status, needsAccommodation, notes, successMessage) => {
        setSaving(true);
        setMessage('');
        setError('');
        try {
            const response = await api.post('/api/reunions/' + reunion.id + '/attendance', {
                status,
                accommodationNeeded: status === 'NOT_GOING' ? false : needsAccommodation,
                dietaryNotes: status === 'NOT_GOING' ? '' : notes,
            });
            setMaybeDeadline(response.data.maybeDeadline || null);
            setMessage(successMessage);
            await Promise.all([fetchSummary(), fetchOrganizerAttendance()]);
            onReunionUpdate();
            return true;
        } catch (requestError) {
            setError(requestError.response?.data?.detail || 'Unable to save your RSVP');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const chooseStatus = async (status) => {
        if (saving || status === myStatus) return;
        const previousStatus = myStatus;
        const previousAccommodation = accommodationNeeded;
        const previousNotes = dietaryNotes;
        const previousDeadline = maybeDeadline;
        const nextAccommodation = status === 'NOT_GOING' ? false : accommodationNeeded;
        const nextNotes = status === 'NOT_GOING' ? '' : dietaryNotes;

        setMyStatus(status);
        setAccommodationNeeded(nextAccommodation);
        setDietaryNotes(nextNotes);

        const saved = await persistAttendance(
            status,
            nextAccommodation,
            nextNotes,
            status === 'GOING'
                ? 'You are confirmed as going and can now be included in expense splits.'
                : `Your RSVP has been updated to ${status === 'MAYBE' ? 'maybe' : 'not going'}.`
        );

        if (!saved) {
            setMyStatus(previousStatus);
            setAccommodationNeeded(previousAccommodation);
            setDietaryNotes(previousNotes);
            setMaybeDeadline(previousDeadline);
        }
    };

    const handleSave = async () => {
        if (!myStatus || saving) return;
        await persistAttendance(
            myStatus,
            accommodationNeeded,
            dietaryNotes,
            'Your RSVP and planning details have been saved.'
        );
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Attendance & RSVP</h2>
                    <p className="text-sm text-surface-400">
                        Give the organizer a clear headcount and planning details
                    </p>
                </div>
            </div>

            <div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                        <p className="text-2xl font-black text-green-400">{summary.going}</p>
                        <p className="text-xs text-surface-400 mt-1">Confirmed going</p>
                    </div>
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                        <p className="text-2xl font-black text-amber-400">{summary.maybe}</p>
                        <p className="text-xs text-surface-400 mt-1">Maybe attending</p>
                    </div>
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                        <p className="text-2xl font-black text-blue-400">{summary.potentialAttendees}</p>
                        <p className="text-xs text-surface-400 mt-1">Potential attendees</p>
                    </div>
                    <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-4">
                        <p className="text-2xl font-black text-primary-400">{summary.responseRate}%</p>
                        <p className="text-xs text-surface-400 mt-1">
                            {summary.totalResponses} of {summary.eligibleAlumni} responded
                        </p>
                    </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-800">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-600 to-green-500 transition-all"
                        style={{ width: Math.min(summary.responseRate, 100) + '%' }}
                    />
                </div>
            </div>

            <div className="card">
                <div className="mb-5">
                    <h3 className="text-lg font-bold text-white">Will you attend?</h3>
                    <p className="text-sm text-surface-400 mt-1">Select one clear RSVP option.</p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    {RSVP_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const selected = myStatus === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => chooseStatus(option.value)}
                                disabled={saving}
                                aria-pressed={selected}
                                className={'rounded-2xl border p-4 text-left transition-all ' +
                                    (selected
                                        ? option.selected + ' shadow-lg'
                                        : 'border-surface-700 bg-surface-800/30 hover:border-surface-500')}
                            >
                                <div className="flex items-start gap-3">
                                    <Icon className={'w-6 h-6 shrink-0 ' + option.iconColor} />
                                    <div>
                                        <p className="font-bold text-white">{option.label}</p>
                                        <p className="text-xs text-surface-400 mt-1">{option.description}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {myStatus === 'MAYBE' && maybeDeadline && (
                    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                        Please change your response to Going or Not interested by{' '}
                        <span className="font-semibold">
                            {new Date(maybeDeadline).toLocaleString('en-IN')}
                        </span>. If no decision is made, it will become Not interested automatically.
                    </div>
                )}

                {myStatus && myStatus !== 'NOT_GOING' && (
                    <div className="mt-6 rounded-2xl border border-surface-700/60 bg-surface-800/30 p-5 space-y-5">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={accommodationNeeded}
                                disabled={saving}
                                onChange={(event) => setAccommodationNeeded(event.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-surface-600 bg-surface-900 text-blue-600"
                            />
                            <span>
                                <span className="flex items-center gap-2 text-sm font-semibold text-white">
                                    <BedDouble className="w-4 h-4 text-blue-400" />
                                    I need accommodation
                                </span>
                                <span className="block text-xs text-surface-500 mt-1">
                                    Helps the organizer estimate rooms and lodging requirements.
                                </span>
                            </span>
                        </label>

                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">
                                <UtensilsCrossed className="w-4 h-4 inline mr-2 text-amber-400" />
                                Dietary, accessibility, or other planning notes
                            </label>
                            <textarea
                                value={dietaryNotes}
                                disabled={saving}
                                onChange={(event) => setDietaryNotes(event.target.value.slice(0, 500))}
                                placeholder="Example: vegetarian meal, peanut allergy, wheelchair access..."
                                rows={3}
                                className="input-field text-sm"
                            />
                            <div className="mt-1 flex items-center justify-between gap-3 text-[10px] text-surface-500">
                                <span>Only the reunion organizer can read notes submitted by batchmates.</span>
                                <span className="shrink-0">{dietaryNotes.length}/500</span>
                            </div>
                        </div>
                    </div>
                )}

                {message && (
                    <p className="mt-5 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-300">
                        {message}
                    </p>
                )}
                {error && (
                    <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                        {error}
                    </p>
                )}

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={!myStatus || saving}
                    className="btn-primary mt-6 flex items-center gap-2 disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving RSVP...' : myStatus ? 'Save RSVP' : 'Choose an option first'}
                </button>
            </div>

            {isOrganizer && (
                <div className="card">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-5">
                        <div>
                            <h3 className="text-lg font-bold text-white">Response details</h3>
                            <p className="text-sm text-surface-400">Visible to the reunion organizer for planning.</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-300">
                            <BedDouble className="w-4 h-4" />
                            {summary.accommodationNeeded} need accommodation
                        </div>
                    </div>

                    {detailsLoading ? (
                        <p className="text-sm text-surface-400">Loading private attendance details...</p>
                    ) : sortedAttendance.length === 0 ? (
                        <p className="rounded-xl border border-surface-700/40 bg-surface-800/30 p-4 text-sm text-surface-400">
                            No batchmates have submitted an RSVP yet.
                        </p>
                    ) : (
                    <div className="space-y-3">
                        {sortedAttendance.map((attendance) => (
                            <div
                                key={attendance.id}
                                className="rounded-xl border border-surface-700/40 bg-surface-800/30 p-4"
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                                            {attendance.user?.name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">{attendance.user?.name}</p>
                                            <p className="text-xs text-surface-500">{attendance.user?.email}</p>
                                        </div>
                                    </div>
                                    <span className={'w-fit rounded-full border px-3 py-1 text-xs font-semibold ' +
                                        (STATUS_STYLES[attendance.status] || '')}
                                    >
                                        {attendance.status === 'NOT_GOING'
                                            ? 'Not interested'
                                            : attendance.status === 'GOING' ? 'Going' : 'Maybe'}
                                    </span>
                                </div>

                                {(attendance.accommodationNeeded || attendance.dietaryNotes) && (
                                    <div className="mt-3 flex flex-col gap-2 border-t border-surface-700/40 pt-3 text-xs">
                                        {attendance.accommodationNeeded && (
                                            <span className="flex items-center gap-2 text-blue-300">
                                                <BedDouble className="w-3.5 h-3.5" /> Accommodation required
                                            </span>
                                        )}
                                        {attendance.dietaryNotes && (
                                            <span className="flex items-start gap-2 text-amber-200">
                                                <UtensilsCrossed className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                                {attendance.dietaryNotes}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    )}
                </div>
            )}
        </div>
    );
}
