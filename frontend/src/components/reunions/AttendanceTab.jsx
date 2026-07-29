import { useState, useEffect } from 'react';
import { Users, CheckCircle, HelpCircle, XCircle, Hotel, UtensilsCrossed, Save } from 'lucide-react';

export default function AttendanceTab({ reunion, user, isCoordinator, onReunionUpdate }) {
    const [myStatus, setMyStatus] = useState('');
    const [accommodationNeeded, setAccommodationNeeded] = useState(false);
    const [dietaryNotes, setDietaryNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [summary, setSummary] = useState({ going: 0, maybe: 0, notGoing: 0, accommodationNeeded: 0 });

    useEffect(() => {
        const myAttendance = reunion.attendance?.find(a => a.user?.id === user?.id);
        if (myAttendance) {
            setMyStatus(myAttendance.status);
            setAccommodationNeeded(myAttendance.accommodationNeeded);
            setDietaryNotes(myAttendance.dietaryNotes || '');
        }
        fetchSummary();
    }, [reunion]);

    const fetchSummary = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3001/api/reunions/${reunion.id}/attendance/summary`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setSummary(await res.json());
        } catch (err) { console.error(err); }
    };

    const handleSave = async () => {
        if (!myStatus) return;
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:3001/api/reunions/${reunion.id}/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: myStatus, accommodationNeeded, dietaryNotes })
            });
            await fetchSummary();
            onReunionUpdate();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    const statusOptions = [
        { value: 'GOING', label: 'Going', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', activeBg: 'bg-green-600 border-green-500' },
        { value: 'MAYBE', label: 'Maybe', icon: HelpCircle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', activeBg: 'bg-amber-600 border-amber-500' },
        { value: 'NOT_GOING', label: 'Not Going', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', activeBg: 'bg-red-600 border-red-500' },
    ];

    return (
        <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Attendance</h2>
                    <p className="text-sm text-surface-400">RSVP and help the coordinator plan</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-center">
                    <p className="text-2xl font-black text-green-400">{summary.going}</p>
                    <p className="text-xs text-surface-400 mt-1">Going</p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                    <p className="text-2xl font-black text-amber-400">{summary.maybe}</p>
                    <p className="text-xs text-surface-400 mt-1">Maybe</p>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                    <p className="text-2xl font-black text-red-400">{summary.notGoing}</p>
                    <p className="text-xs text-surface-400 mt-1">Not Going</p>
                </div>
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Hotel className="w-4 h-4 text-blue-400" />
                        <p className="text-2xl font-black text-blue-400">{summary.accommodationNeeded}</p>
                    </div>
                    <p className="text-xs text-surface-400">Need Accommodation</p>
                </div>
            </div>

            {/* RSVP Form */}
            <div className="card mb-8">
                <h3 className="text-lg font-bold text-white mb-4">Your RSVP</h3>

                <div className="flex flex-wrap gap-3 mb-6">
                    {statusOptions.map(opt => {
                        const Icon = opt.icon;
                        const isActive = myStatus === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => setMyStatus(opt.value)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${isActive ? `${opt.activeBg} text-white shadow-lg` : `${opt.bg} ${opt.color} hover:opacity-80`
                                    }`}
                                aria-pressed={isActive}
                                aria-label={`Mark attendance as ${opt.label}`}
                            >
                                <Icon className="w-4 h-4" />
                                {opt.label}
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group" role="checkbox" aria-checked={accommodationNeeded}>
                        <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${accommodationNeeded ? 'bg-blue-600 border-blue-500' : 'border-surface-600 group-hover:border-surface-400'
                            }`}
                            onClick={() => setAccommodationNeeded(!accommodationNeeded)}
                        >
                            {accommodationNeeded && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="text-sm text-surface-300" onClick={() => setAccommodationNeeded(!accommodationNeeded)}>
                            I need accommodation
                        </span>
                    </label>

                    <div>
                        <label className="block text-sm font-medium text-surface-400 mb-2">
                            <UtensilsCrossed className="w-3.5 h-3.5 inline mr-1.5" />
                            Dietary requirements / Notes (optional)
                        </label>
                        <textarea
                            value={dietaryNotes}
                            onChange={(e) => setDietaryNotes(e.target.value)}
                            placeholder="e.g., Vegetarian, allergies, accessibility needs..."
                            rows={2}
                            className="input-field text-sm"
                            aria-label="Dietary requirements and notes"
                        />
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={!myStatus || saving}
                    className="btn-primary mt-6 flex items-center gap-2 text-sm disabled:opacity-50"
                    aria-label="Save attendance response"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Response'}
                </button>
            </div>

            {/* Attendee List (Coordinator View) */}
            {isCoordinator && reunion.attendance?.length > 0 && (
                <div className="card">
                    <h3 className="text-lg font-bold text-white mb-4">Attendee Details</h3>
                    <div className="space-y-2">
                        {reunion.attendance.map((a, i) => {
                            const statusColor = a.status === 'GOING' ? 'text-green-400' : a.status === 'MAYBE' ? 'text-amber-400' : 'text-red-400';
                            return (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-800/30 border border-surface-700/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                                            {a.user?.name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{a.user?.name}</p>
                                            <p className="text-xs text-surface-500">{a.user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {a.accommodationNeeded && (
                                            <span className="text-xs text-blue-400 flex items-center gap-1">
                                                <Hotel className="w-3 h-3" /> Accommodation
                                            </span>
                                        )}
                                        {a.dietaryNotes && (
                                            <span className="text-xs text-amber-400" title={a.dietaryNotes}>
                                                <UtensilsCrossed className="w-3 h-3 inline" /> Notes
                                            </span>
                                        )}
                                        <span className={`text-xs font-semibold ${statusColor}`}>
                                            {a.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
